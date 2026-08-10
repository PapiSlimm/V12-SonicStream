import { db } from '../db.js';
import { FinancialAIService } from '../domains/finance/financial-ai.service.js';

export class DecisionEngine {
  /**
   * Makes policy decisions based on risk and features
   */
  static async evaluate(userId: string) {
    const features = await FinancialAIService.syncUserFeatures(userId);
    
    let decision: 'ALLOW' | 'BLOCK' | 'LIMIT' = 'ALLOW';
    const constraints: string[] = [];

    // 1. Risk-based gating
    if (features.riskScore > 80) {
      decision = 'BLOCK';
      constraints.push('High suspicious activity score');
    } else if (features.riskScore > 50) {
      decision = 'LIMIT';
      constraints.push('Account under probation: Payout limits applied');
    }

    // 2. Trust-based incentives
    const canInstantPayout = features.trustScore > 90;

    return {
      decision,
      constraints,
      canInstantPayout,
      riskLevel: features.riskScore > 30 ? 'ELEVATED' : 'STABLE'
    };
  }

  static async logDecision(params: {
    tenantId: string;
    userId: string;
    engine: string;
    input: any;
    output: any;
    label: string;
  }) {
    const id = `dec_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      `INSERT INTO brain_decisions (id, tenant_id, user_id, engine, input_data, output_result, decision_label) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, params.tenantId, params.userId, params.engine, JSON.stringify(params.input), JSON.stringify(params.output), params.label]
    );
  }
}
