import crypto from 'crypto';
import { db } from '../db/database.js';
import { logger } from '../utils/logger.js';

export interface TelematicsSyncLog {
  id: string;
  vehicle_id: string;
  entity_id: string | null;
  status: 'success' | 'warning' | 'error';
  odometer: number | null;
  previous_odometer: number | null;
  odometer_changed: number;
  message: string | null;
  trigger_source: 'manual' | 'scheduler';
  created_at: string;
}

export interface RecordTelematicsLogParams {
  vehicleId: string;
  entityId?: string | null;
  status: 'success' | 'warning' | 'error';
  odometer?: number | null;
  previousOdometer?: number | null;
  odometerChanged?: boolean;
  message?: string | null;
  triggerSource?: 'manual' | 'scheduler';
}

export class TelematicsLogService {
  public static recordLog(params: RecordTelematicsLogParams): TelematicsSyncLog {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const changed = params.odometerChanged ? 1 : 0;
    const trigger = params.triggerSource || 'manual';

    try {
      db.run(
        `INSERT INTO telematics_sync_logs (
          id, vehicle_id, entity_id, status, odometer, previous_odometer,
          odometer_changed, message, trigger_source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          params.vehicleId,
          params.entityId || null,
          params.status,
          params.odometer ?? null,
          params.previousOdometer ?? null,
          changed,
          params.message || null,
          trigger,
          now,
        ]
      );

      // Keep maximum 100 entries per vehicle to prevent unbounded log growth
      db.run(
        `DELETE FROM telematics_sync_logs
         WHERE vehicle_id = ?
           AND id NOT IN (
             SELECT id FROM telematics_sync_logs
             WHERE vehicle_id = ?
             ORDER BY created_at DESC
             LIMIT 100
           )`,
        [params.vehicleId, params.vehicleId]
      );
    } catch (err: any) {
      logger.error({ err: err?.message, vehicleId: params.vehicleId }, 'TelematicsLog: Failed to persist sync log');
    }

    return {
      id,
      vehicle_id: params.vehicleId,
      entity_id: params.entityId || null,
      status: params.status,
      odometer: params.odometer ?? null,
      previous_odometer: params.previousOdometer ?? null,
      odometer_changed: changed,
      message: params.message || null,
      trigger_source: trigger,
      created_at: now,
    };
  }

  public static getLogs(vehicleId: string, limit = 50): TelematicsSyncLog[] {
    try {
      return db.query<TelematicsSyncLog>(
        `SELECT * FROM telematics_sync_logs
         WHERE vehicle_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [vehicleId, Math.min(Math.max(1, limit), 100)]
      );
    } catch (err: any) {
      logger.error({ err: err?.message, vehicleId }, 'TelematicsLog: Failed to fetch sync logs');
      return [];
    }
  }

  public static clearLogs(vehicleId: string): void {
    try {
      db.run('DELETE FROM telematics_sync_logs WHERE vehicle_id = ?', [vehicleId]);
    } catch (err: any) {
      logger.error({ err: err?.message, vehicleId }, 'TelematicsLog: Failed to clear sync logs');
    }
  }
}
