import { db } from '../db.js';
import { config } from '../config.js';
import { GoogleGenAI, Type } from "@google/genai";

export interface FraudSignals {
  riskScore: number;
  isFlagged: boolean;
  reasons: string[];
}

export class FraudService {
  /**
   * Analyzes a user for potential fraud before payout or high-volume activities
   */
  static async analyzeUser(userId: string, tenantId: string, ipContext?: string, userDevice?: string): Promise<FraudSignals> {
    const reasons: string[] = [];
    let riskScore = 0;

    // 1. Check Refund Rate via ledger transactions
    const stats = await db.get<any>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'refund' OR status = 'failed' THEN 1 ELSE 0 END) as refunds
       FROM ledger_transactions 
       WHERE user_id = ?`,
      [userId]
    );

    if (stats && stats.total > 0) {
      const refundRate = (stats.refunds || 0) / stats.total;
      if (refundRate > 0.15) {
        riskScore += 40;
        reasons.push(`High transaction failure/refund rate: ${(refundRate * 100).toFixed(1)}%`);
      }
    }

    // 2. Check for rapid transaction bursts (velocity logic)
    const bursts = await db.get<any>(
      `SELECT COUNT(*) as count 
       FROM ledger_transactions 
       WHERE user_id = ? AND created_at > datetime('now', '-1 hour')`,
      [userId]
    );

    if (bursts && bursts.count > 10) {
      riskScore += 30;
      reasons.push(`Velocity warning: ${bursts.count} transactions in the last hour.`);
    }

    // 3. Multi-accounting & IP duplication verification
    if (ipContext) {
      const duplicateIpUsers = await db.all<any>(
        `SELECT DISTINCT user_id FROM user_sessions WHERE ip_address = ? AND user_id != ?`,
        [ipContext, userId]
      );
      if (duplicateIpUsers.length > 0) {
        riskScore += 25;
        reasons.push(`IP sharing detected: ${duplicateIpUsers.length} other user account(s) used IP ${ipContext}`);
      }
    }

    // 4. Device Fingerprinting Verification
    if (userDevice && userDevice !== 'unknown' && userDevice !== 'Unknown') {
      const duplicateDevices = await db.all<any>(
        `SELECT DISTINCT user_id FROM stream_logs WHERE device = ? AND user_id != ? LIMIT 10`,
        [userDevice, userId]
      );
      if (duplicateDevices.length > 2) {
        riskScore += 20;
        reasons.push(`Device Fingerprint duplication: signature shared across ${duplicateDevices.length} accounts.`);
      }
    }

    // 5. Playback Stream Anomaly Detection (Fake Streams)
    const streamAnomaly = await db.get<any>(
      `SELECT COUNT(*) as count, COUNT(DISTINCT track_id) as tracks_count
       FROM stream_logs 
       WHERE (user_id = ? OR device = ?) AND created_at > datetime('now', '-1 hour')`,
      [userId, userDevice || 'unknown']
    );

    if (streamAnomaly && streamAnomaly.count > 60) {
      riskScore += 35;
      reasons.push(`Suspicious streaming farm pattern: ${streamAnomaly.count} plays within 1hr. Target tracks: ${streamAnomaly.tracks_count}`);
    }

    // 6. Chargeback and Dispute Monitoring
    const chargebacks = await db.get<any>(
      `SELECT COUNT(*) as count FROM ledger_transactions 
       WHERE user_id = ? AND type = 'refund' AND status = 'failed'`,
      [userId]
    );
    if (chargebacks && chargebacks.count > 1) {
      riskScore += 30;
      reasons.push(`High risk: ${chargebacks.count} stripe dispute/refund issues detected on transaction records.`);
    }

    // 7. Gemini AI Risk Threat Modeling or heuristic fallback
    if (config.GEMINI_API_KEY) {
      try {
        console.log(`[FraudService] Initiating Gemini anomaly modeling for user: ${userId}`);
        const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
        const systemPrompt = `
          You are a leading financial cyber-security modeling agent detecting payout fraud, credit card washing, and laundering.
          Evaluate these activity facts:
          - IP Address: ${ipContext || 'Unknown'}
          - Device Signature: ${userDevice || 'Unknown'}
          - Transaction Volume (30d): ${stats?.total || 0}
          - Fails/Refunds matches: ${stats?.refunds || 0}
          - Velocity (1hr): ${bursts?.count || 0}
          
          Grade the aggregate riskScore from 0 (completely compliant) to 100 (hostile/sanctioned block). 
          Explain your analysis reasoning. Return in JSON mode.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                aiRiskScore: { type: Type.NUMBER },
                flags: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
              },
              required: ['aiRiskScore', 'flags', 'summary']
            }
          }
        });

        const assessment = JSON.parse(response.text || '{}');
        if (typeof assessment.aiRiskScore === 'number') {
          // Weighted composite risk formula
          riskScore = Math.max(riskScore, Math.round(assessment.aiRiskScore));
        }
        if (assessment.flags && Array.isArray(assessment.flags)) {
          assessment.flags.forEach((f: string) => {
            if (!reasons.includes(f)) reasons.push(`[AI Flag] ${f}`);
          });
        }
        console.log(`[FraudService] AI Threat modeling complete. Final risk score assigned: ${riskScore}`);
      } catch (err) {
        console.warn(`[FraudService] Gemini real-time risk assessment encountered an issue, defaulting to strict heuristics:`, err);
      }
    }

    // Persist log entry in database safely
    try {
      await this.logFraudSignal(userId, tenantId, 'PRE_PAYOUT_AUDIT', riskScore, {
        reasons,
        ipAddress: ipContext,
        device: userDevice,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error(`[FraudService] Failed to log audit signal entry:`, e);
    }

    return {
      riskScore,
      isFlagged: riskScore >= 50,
      reasons
    };
  }

  static async logFraudSignal(userId: string, tenantId: string, type: string, score: number, metadata: any) {
    const logId = `frd_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      `INSERT INTO fraud_signals (id, user_id, tenant_id, type, score, metadata) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, userId, tenantId, type, score, JSON.stringify(metadata)]
    );
  }

  /**
   * Simple Heuristic Scoring Engine
   */
  static score(event: { velocity: number; ipReused: boolean; payoutSpike: boolean }) {
    let score = 0;

    if (event.velocity > 10) score += 40;
    if (event.ipReused) score += 30;
    if (event.payoutSpike) score += 30;

    return {
      score,
      risk: score > 70 ? "high" : "low",
    };
  }
}
