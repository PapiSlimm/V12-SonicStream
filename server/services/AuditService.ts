import { run, all } from '../db.js';
import { logger } from '../middleware/error.js';

export interface AuditLog {
  id?: number | string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt?: string;
}

export class AuditService {
  private static tableEnsured = false;

  private static async ensureTable() {
    if (this.tableEnsured) return;
    try {
      await run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          action VARCHAR(255) NOT NULL,
          target_type VARCHAR(255) NOT NULL,
          target_id VARCHAR(255) NOT NULL,
          details TEXT,
          ip_address VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
      this.tableEnsured = true;
    } catch (err: any) {
      logger.warn('[AuditService] Failed to dynamically ensure audit_logs table, using fallback.', err.message || err);
    }
  }

  /**
   * Log an event/action for compliance and security audit trail
   */
  static async log(
    userId: string,
    action: 'payout_request' | 'payout_approve' | 'payout_reject' | 'refund' | 'role_change' | 'admin_action' | 'marketplace_order' | 'contract_create',
    targetType: string,
    targetId: string,
    details: Record<string, any> | string,
    ipAddress?: string
  ): Promise<void> {
    try {
      await this.ensureTable();
      const id = 'aud_' + Math.random().toString(36).substring(2, 11);
      const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
      
      await run(
        `INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, action, targetType, targetId, detailsStr, ipAddress || 'unknown']
      );
      
      logger.info(`[AuditService] Audit logged: ${action} by User: ${userId} on ${targetType}:${targetId}`);
    } catch (err: any) {
      logger.error('[AuditService] Error writing audit log:', err.message || err);
    }
  }

  /**
   * Retrieve audit logs for compliance review
   */
  static async getLogs(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    try {
      await this.ensureTable();
      return await all<AuditLog>(
        `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
    } catch (err: any) {
      logger.error('[AuditService] Error fetching audit logs:', err.message || err);
      return [];
    }
  }
}
