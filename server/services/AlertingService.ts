import { run, all } from '../db.js';
import { logger } from '../middleware/error.js';
import * as Sentry from '@sentry/node';
import { config } from '../config.js';

export interface SystemAlert {
  id: string;
  service: 'database' | 'redis' | 'stripe' | 'worker';
  severity: 'critical' | 'warning';
  message: string;
  details?: string;
  createdAt?: string;
}

export class AlertingService {
  private static tableEnsured = false;

  private static async ensureTable() {
    if (this.tableEnsured) return;
    try {
      await run(`
        CREATE TABLE IF NOT EXISTS system_alerts (
          id VARCHAR(255) PRIMARY KEY,
          service VARCHAR(50) NOT NULL,
          severity VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          details TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
      this.tableEnsured = true;
    } catch (err: any) {
      logger.warn('[AlertingService] Failed to dynamically ensure system_alerts table:', err.message);
    }
  }

  /**
   * Raise a system infrastructure alert
   */
  static async raiseAlert(
    service: 'database' | 'redis' | 'stripe' | 'worker',
    severity: 'critical' | 'warning',
    message: string,
    details?: any
  ): Promise<void> {
    try {
      await this.ensureTable();

      const id = 'alt_' + Math.random().toString(36).substring(2, 11);
      const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : '';

      // Log to Winston logger
      if (severity === 'critical') {
        logger.error(`[ALERT][CRITICAL] Subsystem failure: ${service.toUpperCase()} - ${message}`, detailsStr);
      } else {
        logger.warn(`[ALERT][WARNING] Subsystem issue: ${service.toUpperCase()} - ${message}`, detailsStr);
      }

      // Capture in Sentry if configured
      if (config.SENTRY_DSN) {
        Sentry.withScope((scope) => {
          scope.setLevel(severity === 'critical' ? 'error' : 'warning');
          scope.setTag('component', 'infrastructure');
          scope.setTag('service', service);
          Sentry.captureMessage(`[${service.toUpperCase()}] ${message}`, {
            extra: { details: detailsStr }
          });
        });
      }

      // Persist in DB for internal dashboards
      await run(
        `INSERT INTO system_alerts (id, service, severity, message, details) VALUES (?, ?, ?, ?, ?)`,
        [id, service, severity, message, detailsStr]
      );

    } catch (err: any) {
      logger.error('[AlertingService] Double failure: Failed to persist alert:', err.message);
    }
  }

  /**
   * Retrieve active or past system alerts
   */
  static async getAlerts(limit: number = 30, offset: number = 0): Promise<SystemAlert[]> {
    try {
      await this.ensureTable();
      return await all<SystemAlert>(
        `SELECT * FROM system_alerts ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
    } catch (err: any) {
      logger.error('[AlertingService] Error retrieving alerts:', err.message);
      return [];
    }
  }
}
