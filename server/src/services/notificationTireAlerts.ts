import { db } from '../db/database.js';
import { NotificationService, NotificationSettings } from './notificationService.js';

export class NotificationTireAlerts {
  public static async check(
    vehicles: any[],
    config: NotificationSettings
  ): Promise<{ alertsSent: number; details: string[] }> {
    const details: string[] = [];
    let count = 0;

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const isSpring = currentMonth === 3 || currentMonth === 4;
      const isAutumn = currentMonth === 10 || currentMonth === 11;

      for (const v of vehicles) {
        const vehicleNotifEnabled = v.notifications_enabled === undefined || v.notifications_enabled === null || Number(v.notifications_enabled) !== 0;
        if (!vehicleNotifEnabled) continue;

        // A. Seasonal Tire Swap
        const seasonalEnabled = config.enabledTireSwap !== false && (v.tire_notifications_enabled === undefined || v.tire_notifications_enabled === null || Number(v.tire_notifications_enabled) !== 0);
        if (seasonalEnabled && (isSpring || isAutumn)) {
          const currentSeason = isSpring ? 'spring' : 'autumn';
          const cacheKey = `notif_tire_season_${v.id}_${currentSeason}_${now.getFullYear()}`;
          const alreadySent = db.get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', [cacheKey]);

          if (!alreadySent) {
            const mountedSet = db.get<any>(
              "SELECT * FROM tire_sets WHERE vehicle_id = ? AND status = 'mounted'",
              [v.id]
            );

            let alertNeeded = false;
            let title = '';
            let msg = '';

            if (isSpring && mountedSet && mountedSet.season === 'winter') {
              alertNeeded = true;
              title = `🛞 Seizoenswissel Banden: ${v.name}`;
              msg = `Het voorjaar is begonnen! Op ${v.name} zijn momenteel nog winterbanden ("${mountedSet.name}") gemonteerd. Plan een wissel naar zomerbanden.`;
            } else if (isAutumn && mountedSet && mountedSet.season === 'summer') {
              alertNeeded = true;
              title = `🛞 Seizoenswissel Banden: ${v.name}`;
              msg = `Het najaar is begonnen! Op ${v.name} zijn momenteel nog zomerbanden ("${mountedSet.name}") gemonteerd. Plan tijdig een wissel naar winterbanden.`;
            }

            if (alertNeeded) {
              await NotificationService.send(title, msg, 'default', ['snowflake', 'car']);
              db.run('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
                cacheKey,
                'sent',
                now.toISOString(),
              ]);
              count++;
              details.push(`Bandenwissel alert verzonden voor ${v.name}`);
            }
          }
        }

        // B. Tire Tread Depth Warning (<= 3.0 mm advice, <= 1.6 mm critical)
        const treadEnabled = config.enabledTireTread !== false && (v.tire_tread_notifications_enabled === undefined || v.tire_tread_notifications_enabled === null || Number(v.tire_tread_notifications_enabled) !== 0);
        if (treadEnabled) {
          const activeTires = db.query<any>(
            "SELECT * FROM tire_sets WHERE vehicle_id = ? AND status = 'mounted'",
            [v.id]
          );

          for (const ts of activeTires) {
            const depths = [
              ts.tread_depth_fl,
              ts.tread_depth_fr,
              ts.tread_depth_rl,
              ts.tread_depth_rr,
            ].filter((d) => d !== null && d !== undefined && !isNaN(Number(d)) && Number(d) > 0).map(Number);

            if (depths.length > 0) {
              const minDepth = Math.min(...depths);
              if (minDepth <= 3.0) {
                const milestone = minDepth <= 1.6 ? 'critical' : 'warning';
                const cacheKey = `notif_tire_tread_${ts.id}_${milestone}`;
                const lastSent = db.get<{ value: string; updated_at?: string }>('SELECT value, updated_at FROM system_settings WHERE key = ?', [cacheKey]);

                let shouldSend = !lastSent;
                if (lastSent && milestone === 'critical' && lastSent.updated_at) {
                  const daysSince = (now.getTime() - new Date(lastSent.updated_at).getTime()) / (1000 * 60 * 60 * 24);
                  if (daysSince >= 14) shouldSend = true;
                }

                if (shouldSend) {
                  const isCritical = minDepth <= 1.6;
                  const urgency = isCritical ? 'urgent' : 'high';
                  const title = isCritical
                    ? `🚨 Bandenprofiel Kritiek: ${v.name} (${minDepth.toFixed(1)} mm)`
                    : `⚠️ Bandenprofiel Waarschuwing: ${v.name} (${minDepth.toFixed(1)} mm)`;
                  const msg = isCritical
                    ? `De bandenset "${ts.name}" op ${v.name} heeft een profieldiepte van ${minDepth.toFixed(1)} mm (onder de wettelijke grens van 1,6 mm!). Vervang deze banden direct.`
                    : `De bandenset "${ts.name}" op ${v.name} heeft nog ${minDepth.toFixed(1)} mm profiel (adviesgrens 3,0 mm). Plan vervanging in om grip en waterafvoer te behouden.`;

                  await NotificationService.send(title, msg, urgency, ['warning', 'car']);
                  db.run('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
                    cacheKey,
                    'sent',
                    now.toISOString(),
                  ]);
                  count++;
                  details.push(`Bandenprofiel alert verzonden voor ${v.name} (${minDepth.toFixed(1)} mm)`);
                }
              }
            }
          }
        }
      }
    } catch (tireErr: any) {
      console.error('Tire notification check error:', tireErr);
    }

    return { alertsSent: count, details };
  }
}
