import { db } from '../db/database.js';
import { RdwService } from './rdwService.js';
import { MaintenanceService } from './maintenanceService.js';
import { NotificationService } from './notificationService.js';
import { NotificationTireAlerts } from './notificationTireAlerts.js';

export class NotificationAlerts {
  public static async checkAndDispatch(): Promise<{ alertsSent: number; details: string[] }> {
    const config = NotificationService.getSettings();
    if (config.provider === 'none') {
      return { alertsSent: 0, details: ['Notificaties zijn uitgeschakeld'] };
    }

    const details: string[] = [];
    let count = 0;

    const vehicles = db.query<any>(`
      SELECT v.*,
        MAX(COALESCE(f.max_f, 0), COALESCE(s.max_s, 0), COALESCE(o.max_o, 0), v.initial_odometer) as current_odometer
      FROM vehicles v
      LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_f FROM fuel_entries GROUP BY vehicle_id) f ON f.vehicle_id = v.id
      LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_s FROM service_records GROUP BY vehicle_id) s ON s.vehicle_id = v.id
      LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_o FROM odometer_logs GROUP BY vehicle_id) o ON o.vehicle_id = v.id
      WHERE v.status = 'active'
      GROUP BY v.id
    `);

    for (const v of vehicles) {
      const vehicleNotifEnabled = v.notifications_enabled === undefined || v.notifications_enabled === null || Number(v.notifications_enabled) !== 0;
      if (!vehicleNotifEnabled) continue;

      // 1. APK Expiration Check (milestones: 30d, 14d, 7d, expired + 14d cooldown)
      const vehicleApkEnabled = v.apk_notifications_enabled === undefined || v.apk_notifications_enabled === null || Number(v.apk_notifications_enabled) !== 0;
      if (config.enabledApk && vehicleApkEnabled && v.apk_expiration_date) {
        const apk = RdwService.evaluateApkStatus(v.apk_expiration_date);
        if (apk.daysRemaining !== null && apk.daysRemaining <= 30) {
          let milestone = '30d';
          if (apk.daysRemaining < 0) milestone = 'expired';
          else if (apk.daysRemaining <= 7) milestone = '7d';
          else if (apk.daysRemaining <= 14) milestone = '14d';

          const cacheKey = `notif_apk_${v.id}_${milestone}`;
          const lastSent = db.get<{ updated_at: string }>('SELECT updated_at FROM system_settings WHERE key = ?', [cacheKey]);

          let shouldSend = !lastSent;
          if (lastSent && milestone === 'expired') {
            const daysSince = (new Date().getTime() - new Date(lastSent.updated_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince >= 14) shouldSend = true;
          }

          if (shouldSend) {
            const urgency = apk.daysRemaining <= 7 ? 'urgent' : 'high';
            const title = `⚠️ APK Herinnering: ${v.name} (${v.license_plate || 'Onbekend'})`;
            const msg = apk.daysRemaining < 0
              ? `De APK van ${v.name} is ${Math.abs(apk.daysRemaining)} dagen verlopen (${v.apk_expiration_date}). Regel direct een keuring!`
              : `De APK van ${v.name} verloopt over ${apk.daysRemaining} dagen (${v.apk_expiration_date}).`;

            await NotificationService.send(title, msg, urgency, ['car', 'clipboard']);
            db.run('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
              cacheKey,
              'sent',
              new Date().toISOString(),
            ]);
            count++;
            details.push(`APK alert verzonden voor ${v.name}`);
          }
        }
      }

      // 2. Overdue Maintenance Check (consolidated single alert per vehicle + 14-day anti-spam cooldown)
      const vehicleMaintEnabled = v.maintenance_notifications_enabled === undefined || v.maintenance_notifications_enabled === null || Number(v.maintenance_notifications_enabled) !== 0;
      if (config.enabledMaintenance && vehicleMaintEnabled) {
        const maintStatuses = MaintenanceService.getVehicleMaintenanceStatus(v.id);
        const overdueItems = maintStatuses.filter((s) => s.status === 'overdue');

        if (overdueItems.length > 0) {
          const cacheKey = `notif_maint_veh_${v.id}`;
          const lastSent = db.get<{ updated_at: string }>(
            'SELECT updated_at FROM system_settings WHERE key = ?',
            [cacheKey]
          );

          const now = new Date();
          let shouldSend = true;
          if (lastSent?.updated_at) {
            const daysSince = (now.getTime() - new Date(lastSent.updated_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < 14) {
              shouldSend = false;
            }
          }

          if (shouldSend) {
            const title = `🔧 Onderhoud Vereist: ${v.name}`;
            let msg: string;
            if (overdueItems.length === 1) {
              const item = overdueItems[0];
              const itemName = item.customName || item.categoryName;
              const reason = item.triggerReason === 'distance'
                ? `${Math.abs(item.kmRemaining ?? 0)} km overschreden`
                : 'tijdsinterval verstreken';
              msg = `Het onderhoudsinterval voor "${itemName}" is overschreden (${reason}).`;
            } else {
              const names = overdueItems.map((i) => i.customName || i.categoryName).slice(0, 3).join(', ');
              const more = overdueItems.length > 3 ? ` en ${overdueItems.length - 3} andere` : '';
              msg = `${overdueItems.length} onderhoudspunten zijn overschreden: ${names}${more}.`;
            }

            await NotificationService.send(title, msg, 'high', ['wrench', 'car']);
            db.run('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
              cacheKey,
              'sent',
              now.toISOString(),
            ]);
            count++;
            details.push(`Onderhoud alert verzonden voor ${v.name} (${overdueItems.length} items)`);
          }
        }
      }
    }

    // 3. Expiring Documents Check (milestone-based)
    const expiringDocs = db.query<any>(`
      SELECT d.*, v.name as vehicle_name, v.license_plate
      FROM vehicle_documents d
      JOIN vehicles v ON v.id = d.vehicle_id
      WHERE d.expires_at IS NOT NULL
        AND d.expires_at != ''
        AND v.status = 'active'
    `);

    for (const doc of expiringDocs) {
      if (config.enabledApk) {
        const diffMs = new Date(doc.expires_at).getTime() - new Date().getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 30) {
          let docMilestone = '30d';
          if (daysRemaining < 0) docMilestone = 'expired';
          else if (daysRemaining <= 7) docMilestone = '7d';
          else if (daysRemaining <= 14) docMilestone = '14d';

          const cacheKey = `notif_doc_${doc.id}_${docMilestone}`;
          const lastSent = db.get<{ value: string; updated_at?: string }>('SELECT value, updated_at FROM system_settings WHERE key = ?', [cacheKey]);

          let shouldSend = !lastSent;
          if (lastSent && docMilestone === 'expired' && lastSent.updated_at) {
            const daysSince = (new Date().getTime() - new Date(lastSent.updated_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince >= 14) shouldSend = true;
          }

          if (shouldSend) {
            const urgency = daysRemaining <= 7 ? 'urgent' : 'high';
            const title = `📑 Document Herinnering: ${doc.name} (${doc.vehicle_name})`;
            const msg = daysRemaining < 0
              ? `Het document "${doc.name}" voor ${doc.vehicle_name} is verlopen op ${doc.expires_at}.`
              : `Het document "${doc.name}" voor ${doc.vehicle_name} verloopt over ${daysRemaining} dagen (${doc.expires_at}).`;

            await NotificationService.send(title, msg, urgency, ['page_facing_up', 'car']);
            db.run('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
              cacheKey,
              'sent',
              new Date().toISOString(),
            ]);
            count++;
            details.push(`Document alert verzonden voor ${doc.name} (${doc.vehicle_name})`);
          }
        }
      }
    }

    // 4. Vignettes / Environmental Badges Check (milestone-based)
    try {
      const expiringVignettes = db.query<any>(`
        SELECT vg.*, v.name as vehicle_name, v.license_plate
        FROM vignettes vg
        JOIN vehicles v ON v.id = vg.vehicle_id
        WHERE vg.end_date IS NOT NULL
          AND vg.end_date != ''
          AND v.status = 'active'
      `);

      for (const vig of expiringVignettes) {
        const diffMs = new Date(vig.end_date).getTime() - new Date().getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 30) {
          let vigMilestone = '30d';
          if (daysRemaining < 0) vigMilestone = 'expired';
          else if (daysRemaining <= 7) vigMilestone = '7d';

          const cacheKey = `notif_vignette_${vig.id}_${vigMilestone}`;
          const lastSent = db.get<{ value: string; updated_at?: string }>('SELECT value, updated_at FROM system_settings WHERE key = ?', [cacheKey]);

          let shouldSend = !lastSent;
          if (lastSent && vigMilestone === 'expired' && lastSent.updated_at) {
            const daysSince = (new Date().getTime() - new Date(lastSent.updated_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince >= 14) shouldSend = true;
          }

          if (shouldSend) {
            const urgency = daysRemaining <= 7 ? 'urgent' : 'high';
            const title = `🏷️ Vignet Verlopen / Herinnering: ${vig.name} (${vig.vehicle_name})`;
            const msg = daysRemaining < 0
              ? `Het vignet/milieusticker "${vig.name}" (${vig.country}) voor ${vig.vehicle_name} is verlopen op ${vig.end_date}.`
              : `Het vignet/milieusticker "${vig.name}" (${vig.country}) voor ${vig.vehicle_name} verloopt over ${daysRemaining} dagen (${vig.end_date}).`;

            await NotificationService.send(title, msg, urgency, ['ticket', 'car']);
            db.run('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
              cacheKey,
              'sent',
              new Date().toISOString(),
            ]);
            count++;
            details.push(`Vignet alert verzonden voor ${vig.name} (${vig.vehicle_name})`);
          }
        }
      }
    } catch (vigErr: any) {
      console.error('Vignette notification check error:', vigErr);
    }

    // 5. Tire Seasonal & Tread Depth Check
    const tireResults = await NotificationTireAlerts.check(vehicles, config);
    count += tireResults.alertsSent;
    details.push(...tireResults.details);

    return { alertsSent: count, details };
  }
}
