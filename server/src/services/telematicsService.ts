import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { logger } from '../utils/logger.js';
import { MaintenanceService } from './maintenanceService.js';

import { HaSensorItem, fetchHaSensorsList } from './telematicsSensorHelper.js';
import { TelematicsLogService } from './telematicsLogService.js';
export { HaSensorItem } from './telematicsSensorHelper.js';

export function validateSafeExternalUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Ongeldige URL indeling. Gebruik bijvoorbeeld http://homeassistant.local:8123');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Alleen HTTP en HTTPS protocollen zijn toegestaan');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === '169.254.169.254' ||
    hostname.startsWith('169.254.') ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.metadata.google.internal') ||
    hostname === 'instance-data' ||
    hostname === '100.100.100.200'
  ) {
    throw new Error('Toegang tot cloud metadata endpoints is om veiligheidsredenen geblokkeerd');
  }

  return rawUrl.trim().replace(/\/+$/, '');
}

export class TelematicsService {
  public static getHaConfig(userId?: string): { baseUrl: string; token: string } {
    let baseUrl = '';
    let token = '';

    if (userId) {
      const userRow = db.get<{ ha_base_url: string; ha_access_token: string }>(
        'SELECT ha_base_url, ha_access_token FROM user_ha_configs WHERE user_id = ?',
        [userId]
      );
      if (userRow?.ha_base_url) {
        baseUrl = userRow.ha_base_url.trim().replace(/\/+$/, '');
        token = (userRow.ha_access_token || '').trim();
      }
    }

    if (!baseUrl || !token) {
      const dbUrl = db.get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['ha_base_url'])?.value;
      const dbToken = db.get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['ha_access_token'])?.value;

      baseUrl = baseUrl || (dbUrl || process.env.HA_BASE_URL || process.env.HOME_ASSISTANT_URL || '').trim().replace(/\/+$/, '');
      token = token || (dbToken || process.env.HA_ACCESS_TOKEN || process.env.HOME_ASSISTANT_TOKEN || '').trim();
    }

    return { baseUrl, token };
  }

  public static saveHaConfig(baseUrl: string, token?: string, userId?: string): void {
    const cleanUrl = validateSafeExternalUrl(baseUrl);
    const now = new Date().toISOString();

    if (userId) {
      const existing = db.get<{ ha_access_token: string }>('SELECT ha_access_token FROM user_ha_configs WHERE user_id = ?', [userId]);
      const finalToken = token !== undefined && token.trim().length > 0 ? token.trim() : (existing?.ha_access_token || '');
      db.run(
        `INSERT INTO user_ha_configs (user_id, ha_base_url, ha_access_token, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET ha_base_url = excluded.ha_base_url, ha_access_token = excluded.ha_access_token, updated_at = excluded.updated_at`,
        [userId, cleanUrl, finalToken, now]
      );
      return;
    }

    db.run(
      'INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      ['ha_base_url', cleanUrl, now]
    );

    if (token !== undefined && token.trim().length > 0) {
      db.run(
        'INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
        ['ha_access_token', token.trim(), now]
      );
    }
  }

  public static async testHaConnection(userId?: string): Promise<{ success: boolean; message: string; haVersion?: string }> {
    const { baseUrl, token } = this.getHaConfig(userId);
    if (!baseUrl || !token) {
      return {
        success: false,
        message: 'Home Assistant URL en Long-Lived Access Token zijn vereist.',
      };
    }

    try {
      const cleanBase = validateSafeExternalUrl(baseUrl);
      const res = await fetch(`${cleanBase}/api/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return {
          success: false,
          message: `Home Assistant gaf foutcode ${res.status}: ${res.statusText}`,
        };
      }

      const data: any = await res.json();
      return {
        success: true,
        message: data.message || 'Succesvol verbonden met Home Assistant API.',
        haVersion: data.version,
      };
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Telematics: testHaConnection error');
      return {
        success: false,
        message: `Kon geen verbinding maken met Home Assistant: ${err?.message || 'Timeout of netwerkfout'}`,
      };
    }
  }

  public static async getHaSensors(userId?: string): Promise<HaSensorItem[]> {
    const { baseUrl, token } = this.getHaConfig(userId);
    if (!baseUrl || !token) return [];
    return fetchHaSensorsList(baseUrl, token);
  }

  public static async syncVehicleOdometer(
    vehicleId: string,
    triggerSource: 'manual' | 'scheduler' = 'manual'
  ): Promise<{
    success: boolean;
    odometer?: number;
    updated?: boolean;
    previousOdometer?: number;
    error?: string;
  }> {
    const vehicle = db.get<any>('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    if (!vehicle) return { success: false, error: 'Voertuig niet gevonden' };
    if (!vehicle.telematics_ha_entity_id) {
      const err = 'Geen Home Assistant sensor-entiteit geconfigureerd voor dit voertuig';
      TelematicsLogService.recordLog({ vehicleId, status: 'error', message: err, triggerSource });
      return { success: false, error: err };
    }

    const { baseUrl, token } = this.getHaConfig(vehicle.user_id);
    if (!baseUrl || !token) {
      const msg = 'Home Assistant URL of Access Token ontbreekt in instellingen';
      db.run('UPDATE vehicles SET telematics_last_status = ?, updated_at = ? WHERE id = ?', [`error: ${msg}`, new Date().toISOString(), vehicleId]);
      TelematicsLogService.recordLog({ vehicleId, entityId: vehicle.telematics_ha_entity_id, status: 'error', message: msg, triggerSource });
      return { success: false, error: msg };
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    try {
      const url = `${baseUrl}/api/states/${encodeURIComponent(vehicle.telematics_ha_entity_id.trim())}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        const errorMsg = `Home Assistant HTTP ${res.status}: Entiteit ${vehicle.telematics_ha_entity_id} niet gevonden of ontoegankelijk`;
        db.run('UPDATE vehicles SET telematics_last_status = ?, telematics_last_sync_at = ? WHERE id = ?', [`error: ${errorMsg}`, now, vehicleId]);
        TelematicsLogService.recordLog({ vehicleId, entityId: vehicle.telematics_ha_entity_id, status: 'error', message: errorMsg, triggerSource });
        return { success: false, error: errorMsg };
      }

      const stateData: any = await res.json();
      const rawState = String(stateData?.state ?? '').trim();
      if (!rawState || rawState === 'unavailable' || rawState === 'unknown') {
        const errorMsg = `Sensorwaarde is momenteel niet beschikbaar (${rawState})`;
        db.run('UPDATE vehicles SET telematics_last_status = ?, telematics_last_sync_at = ? WHERE id = ?', [`warning: ${errorMsg}`, now, vehicleId]);
        TelematicsLogService.recordLog({ vehicleId, entityId: vehicle.telematics_ha_entity_id, status: 'warning', message: errorMsg, triggerSource });
        return { success: false, error: errorMsg };
      }

      const odoVal = parseFloat(rawState.replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (isNaN(odoVal) || odoVal <= 0) {
        const errorMsg = `Ongeldige numerieke kilometerstand ontvangen: "${rawState}"`;
        db.run('UPDATE vehicles SET telematics_last_status = ?, telematics_last_sync_at = ? WHERE id = ?', [`error: ${errorMsg}`, now, vehicleId]);
        TelematicsLogService.recordLog({ vehicleId, entityId: vehicle.telematics_ha_entity_id, status: 'error', message: errorMsg, triggerSource });
        return { success: false, error: errorMsg };
      }

      const maxRow = db.get<{ max_val: number }>(
        `SELECT MAX(val) as max_val FROM (
          SELECT MAX(odometer) as val FROM fuel_entries WHERE vehicle_id = ?
          UNION ALL SELECT MAX(odometer) as val FROM service_records WHERE vehicle_id = ?
          UNION ALL SELECT MAX(odometer) as val FROM odometer_logs WHERE vehicle_id = ?
          UNION ALL SELECT MAX(end_odometer) as val FROM trips WHERE vehicle_id = ?
          UNION ALL SELECT initial_odometer as val FROM vehicles WHERE id = ?
        )`, [vehicleId, vehicleId, vehicleId, vehicleId, vehicleId]
      );

      const prevOdo = maxRow?.max_val ?? vehicle.initial_odometer ?? 0;
      let isUpdated = false;

      if (odoVal > prevOdo) {
        db.run(
          `INSERT INTO odometer_logs (id, vehicle_id, odometer, source, date, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), vehicleId, odoVal, 'ha_telematics', today, now]
        );
        isUpdated = true;
        MaintenanceService.getVehicleMaintenanceStatus(vehicleId);
      }

      db.run(
        `UPDATE vehicles SET telematics_last_sync_at = ?, telematics_last_status = 'ok', telematics_last_odometer = ?, updated_at = ? WHERE id = ?`,
        [now, odoVal, now, vehicleId]
      );

      const logMsg = isUpdated
        ? `Kilometerstand bijgewerkt: ${odoVal.toLocaleString()} km (+${Math.round(odoVal - prevOdo)} km)`
        : `Kilometerstand uitgelezen: ${odoVal.toLocaleString()} km (ongewijzigd)`;

      TelematicsLogService.recordLog({
        vehicleId,
        entityId: vehicle.telematics_ha_entity_id,
        status: 'success',
        odometer: odoVal,
        previousOdometer: prevOdo,
        odometerChanged: isUpdated,
        message: logMsg,
        triggerSource,
      });

      return { success: true, odometer: odoVal, updated: isUpdated, previousOdometer: prevOdo };
    } catch (err: any) {
      const errorMsg = err?.message || 'Onbekende fout tijdens ophalen sensor';
      db.run('UPDATE vehicles SET telematics_last_status = ?, telematics_last_sync_at = ? WHERE id = ?', [`error: ${errorMsg}`, now, vehicleId]);
      TelematicsLogService.recordLog({ vehicleId, entityId: vehicle?.telematics_ha_entity_id, status: 'error', message: errorMsg, triggerSource });
      return { success: false, error: errorMsg };
    }
  }

  public static async syncAllVehicles(forUserId?: string, triggerSource: 'manual' | 'scheduler' = 'manual'): Promise<{ total: number; synced: number; errors: number }> {
    const whereUser = forUserId ? 'AND user_id = ?' : '';
    const params = forUserId ? [forUserId] : [];

    const vehicles = db.query<any>(
      `SELECT id, user_id, name, telematics_ha_entity_id
       FROM vehicles
       WHERE status = 'active'
         AND telematics_enabled = 1
         AND telematics_ha_entity_id IS NOT NULL
         AND TRIM(telematics_ha_entity_id) != ''
         ${whereUser}`,
      params
    );

    let synced = 0;
    let errors = 0;

    for (const v of vehicles) {
      try {
        const res = await this.syncVehicleOdometer(v.id, triggerSource);
        if (res.success) synced++;
        else errors++;
      } catch {
        errors++;
      }
    }

    logger.info({ total: vehicles.length, synced, errors, forUserId }, 'Telematics: Finished batch vehicle sync');
    return { total: vehicles.length, synced, errors };
  }
}

