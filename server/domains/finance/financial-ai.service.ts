import { db } from '../../db.js';
import { GoogleGenAI, Type } from "@google/genai";
import { config } from '../../config.js';

export interface UserFeatures {
  userId: string;
  tenantId: string;
  totalRevenue: number;
  avgTransaction: number;
  refundRate: number;
  streamCount: number;
  growthRate: number;
  riskScore: number;
  revenueScore: number;
  trustScore: number;
  predicted30dRevenue: number;
}

export class FinancialAIService {
  /**
   * Aggregates raw data into user financial features
   */
  static async syncUserFeatures(userId: string): Promise<UserFeatures> {
    const user = await db.get<{ tenantId: string }>('SELECT tenant_id FROM users WHERE id = ?', [userId]);
    const tenantId = user?.tenantId || 'default';

    // 1. Calculate basic financial metrics
    const stats = await db.get<{ totalRev: number, avgTx: number }>(
      `SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_rev,
        AVG(CASE WHEN amount > 0 THEN amount ELSE 0 END) as avg_tx,
        SUM(CASE WHEN amount < 0 AND type = 'debit' THEN ABS(amount) ELSE 0 END) as total_payouts
       FROM ledger_entries 
       WHERE user_id = ? AND account_type = 'USER'`,
      [userId]
    );

    const totalRevenue = stats?.totalRev || 0;
    const avgTransaction = stats?.avgTx || 0;

    // 2. Refund Rate
    const refundStats = await db.get<{ total: number, refunds: number }>(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = "failed" OR type = "refund" THEN 1 ELSE 0 END) as refunds FROM ledger_transactions WHERE user_id = ?',
      [userId]
    );
    const refundRate = (refundStats?.total || 0) > 0 ? (refundStats!.refunds / refundStats!.total) : 0;

    // 3. Growth Rate (Simple Month-over-Month)
    const history = await db.all<{ monthly: number, month: string }>(
      `SELECT SUM(amount) as monthly, strftime('%Y-%m', created_at) as month 
       FROM ledger_entries 
       WHERE user_id = ? AND account_type = 'USER' AND amount > 0 
       GROUP BY month ORDER BY month DESC LIMIT 2`,
      [userId]
    );
    let growthRate = 0;
    if (history.length === 2) {
      const current = history[0].monthly;
      const prev = history[1].monthly;
      growthRate = prev > 0 ? (current - prev) / prev : 0;
    }

    // 4. Gemini-Powered AI Scoring (Revenue, Risk, Trust, and Forecast) or Fallback
    let revenueScore = Math.min(100, (totalRevenue / 10000) * 100);
    let riskScore = (refundRate * 100) + (growthRate < -0.5 ? 30 : 0);
    let trustScore = Math.max(0, 100 - riskScore + (totalRevenue > 1000 ? 20 : 0));
    let predicted30dRevenue = totalRevenue > 0 ? (totalRevenue / 3) * (1 + growthRate) : 0;
    let aiExplanation = 'Calculated via deterministic static formulas (API key not available).';

    if (config.GEMINI_API_KEY) {
      try {
        console.log(`[FinancialAIService] Consulting Gemini model for user financial scoring: ${userId}`);
        const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
        const analysisPrompt = `
          Analyze the following financial metrics for User ID "${userId}":
          - Total Revenue: $${totalRevenue}
          - Average Transaction Size: $${avgTransaction}
          - Failed/Refunded Rate: ${(refundRate * 100).toFixed(2)}%
          - Month-over-Month Revenue Growth Rate: ${(growthRate * 100).toFixed(2)}%
          
          Based on standard payment fraud scoring, transactional risk engines, and MoM forecasting:
          1. riskScore: Evaluate a fraud & payout risk rating from 0 (very safe) to 100 (highly suspicious).
          2. revenueScore: Grade the revenue health and volume from 0 (none) to 100 (enterprise whale client).
          3. trustScore: Grade user compliance/onboarding score from 0 (blacklisted) to 100 (fully reputable premium peer).
          4. predicted30dRevenue: Forecast the expected gross revenue for the upcoming 30 days based on growth rate, trajectory, and refund rate stability.
          
          Provide the output as JSON.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: analysisPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                riskScore: { type: Type.NUMBER },
                revenueScore: { type: Type.NUMBER },
                trustScore: { type: Type.NUMBER },
                predicted30dRevenue: { type: Type.NUMBER },
                explanations: { type: Type.STRING }
              },
              required: ['riskScore', 'revenueScore', 'trustScore', 'predicted30dRevenue', 'explanations']
            }
          }
        });

        const result = JSON.parse(response.text || '{}');
        if (typeof result.riskScore === 'number') riskScore = Math.max(0, Math.min(100, result.riskScore));
        if (typeof result.revenueScore === 'number') revenueScore = Math.max(0, Math.min(100, result.revenueScore));
        if (typeof result.trustScore === 'number') trustScore = Math.max(0, Math.min(100, result.trustScore));
        if (typeof result.predicted30dRevenue === 'number') predicted30dRevenue = Math.max(0, result.predicted30dRevenue);
        if (result.explanations) aiExplanation = result.explanations;
        
        console.log(`[FinancialAIService] Gemini AI successfully analyzed user ${userId}: riskScore=${riskScore}, revenueScore=${revenueScore}, trustScore=${trustScore}. Explanation: ${aiExplanation}`);
      } catch (err) {
        console.error('[FinancialAIService] Gemini AI scoring failed, fell back to heuristic scoring:', err);
      }
    }

    // 5. Query actual play_history stream count for the past 30 days
    const streamStats = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM play_history 
       WHERE user_id = ? AND created_at > datetime('now', '-30 days')`,
      [userId]
    );
    const actualStreamCount = streamStats?.count ?? 0;

    const features: UserFeatures = {
      userId,
      tenantId,
      totalRevenue,
      avgTransaction,
      refundRate,
      streamCount: actualStreamCount,
      growthRate,
      riskScore,
      revenueScore,
      trustScore,
      predicted30dRevenue
    };

    await db.run(
      `INSERT INTO user_financial_features (
        user_id, tenant_id, total_revenue, avg_transaction, refund_rate, growth_rate, 
        risk_score, revenue_score, trust_score, predicted_30d_revenue, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        total_revenue = excluded.total_revenue,
        avg_transaction = excluded.avg_transaction,
        refund_rate = excluded.refund_rate,
        growth_rate = excluded.growth_rate,
        risk_score = excluded.risk_score,
        revenue_score = excluded.revenue_score,
        trust_score = excluded.trust_score,
        predicted_30d_revenue = excluded.predicted_30d_revenue,
        updated_at = CURRENT_TIMESTAMP`,
      [
        userId, tenantId, totalRevenue, avgTransaction, refundRate, growthRate,
        riskScore, revenueScore, trustScore, predicted30dRevenue
      ]
    );

    return features;
  }

  /**
   * AI Decision: Should we allow this payout?
   */
  static async evaluatePayout(userId: string): Promise<{ decision: 'ALLOW' | 'HOLD' | 'BLOCK', reason: string, delayDays: number }> {
    const features = await db.get<any>('SELECT * FROM user_financial_features WHERE user_id = ?', [userId]);
    if (!features) {
      // First timer, high risk
      return { decision: 'HOLD', reason: 'New user: Initial verification required', delayDays: 7 };
    }

    if (features.riskScore > 70) {
      return { decision: 'BLOCK', reason: `High risk score (${features.riskScore.toFixed(1)}): Potential fraud detected`, delayDays: 0 };
    }

    if (features.riskScore > 40) {
      return { decision: 'HOLD', reason: 'Moderate risk: Manual review required', delayDays: 3 };
    }

    // Optimization: trusted users get instant payouts
    if (features.trustScore > 80) {
       return { decision: 'ALLOW', reason: 'Trusted account: Accelerated payout', delayDays: 0 };
    }

    return { decision: 'ALLOW', reason: 'Normal verification complete', delayDays: 1 };
  }

  /**
   * Dynamic Fee: AI determines the platform take rate
   */
  static async getDynamicFee(userId: string): Promise<number> {
    const features = await db.get<any>('SELECT total_revenue, growth_rate FROM user_financial_features WHERE user_id = ?', [userId]);
    
    if (!features) return 0.15; // Default 15%

    // Retention strategy: Reward high volume & growers
    if (features.totalRevenue > 50000) return 0.08; // 8% for whales
    if (features.totalRevenue > 10000) return 0.10; // 10% for established
    if (features.growthRate > 0.5) return 0.12;     // 12% for fast growers

    return 0.15;
  }
}
