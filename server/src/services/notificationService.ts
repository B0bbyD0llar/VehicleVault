import { db } from '../db/database.js';
import { EmailService } from './emailService.js';
import { PushService } from './pushService.js';
import { NotificationAlerts } from './notificationAlerts.js';

export interface NotificationSettings {
  provider: 'none' | 'email' | 'webpush' | 'pushover' | 'ntfy' | 'gotify' | 'webhook';
  pushoverUserKey?: string;
  pushoverApiToken?: string;
  pushoverDevice?: string;
  ntfyUrl: string;
  ntfyToken?: string;
  gotifyUrl: string;
  gotifyToken?: string;
  webhookUrl: string;
  enabledApk: boolean;
  enabledMaintenance: boolean;
  enabledTireSwap?: boolean;
  enabledTireTread?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpTo?: string;
}

export class NotificationService {
  public static getSettings(): NotificationSettings {
    const getVal = (key: string, def = '') => {
      try {
        const row = db.get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', [key]);
        return row?.value || def;
      } catch {
        return def;
      }
    };

    const smtp = EmailService.getSmtpConfig();

    return {
      provider: (getVal('notification_provider', 'none') as any) || 'none',
      pushoverUserKey: getVal('notification_pushover_user', ''),
      pushoverApiToken: getVal('notification_pushover_token', ''),
      pushoverDevice: getVal('notification_pushover_device', ''),
      ntfyUrl: getVal('notification_ntfy_url', ''),
      ntfyToken: getVal('notification_ntfy_token', ''),
      gotifyUrl: getVal('notification_gotify_url', ''),
      gotifyToken: getVal('notification_gotify_token', ''),
      webhookUrl: getVal('notification_webhook_url', ''),
      enabledApk: getVal('notification_enabled_apk', 'true') === 'true',
      enabledMaintenance: getVal('notification_enabled_maintenance', 'true') === 'true',
      enabledTireSwap: getVal('notification_enabled_tire_swap', 'true') === 'true',
      enabledTireTread: getVal('notification_enabled_tire_tread', 'true') === 'true',
      smtpHost: smtp.host,
      smtpPort: smtp.port,
      smtpSecure: smtp.secure,
      smtpUser: smtp.user,
      smtpPass: smtp.pass ? '••••••••' : '',
      smtpFrom: smtp.from,
      smtpTo: smtp.to,
    };
  }

  public static saveSettings(settings: Partial<NotificationSettings>): void {
    const now = new Date().toISOString();
    const setVal = (key: string, val: string) => {
      db.run(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, val, now]
      );
    };

    if (settings.provider !== undefined) setVal('notification_provider', settings.provider);
    if (settings.pushoverUserKey !== undefined) setVal('notification_pushover_user', settings.pushoverUserKey.trim());
    if (settings.pushoverApiToken !== undefined) setVal('notification_pushover_token', settings.pushoverApiToken.trim());
    if (settings.pushoverDevice !== undefined) setVal('notification_pushover_device', settings.pushoverDevice.trim());
    if (settings.ntfyUrl !== undefined) setVal('notification_ntfy_url', settings.ntfyUrl.trim());
    if (settings.ntfyToken !== undefined) setVal('notification_ntfy_token', settings.ntfyToken.trim());
    if (settings.gotifyUrl !== undefined) setVal('notification_gotify_url', settings.gotifyUrl.trim());
    if (settings.gotifyToken !== undefined) setVal('notification_gotify_token', settings.gotifyToken.trim());
    if (settings.webhookUrl !== undefined) setVal('notification_webhook_url', settings.webhookUrl.trim());
    if (settings.enabledApk !== undefined) setVal('notification_enabled_apk', settings.enabledApk ? 'true' : 'false');
    if (settings.enabledMaintenance !== undefined) setVal('notification_enabled_maintenance', settings.enabledMaintenance ? 'true' : 'false');
    if (settings.enabledTireSwap !== undefined) setVal('notification_enabled_tire_swap', settings.enabledTireSwap ? 'true' : 'false');
    if (settings.enabledTireTread !== undefined) setVal('notification_enabled_tire_tread', settings.enabledTireTread ? 'true' : 'false');

    // Save SMTP configurations if provided
    if (
      settings.smtpHost !== undefined ||
      settings.smtpPort !== undefined ||
      settings.smtpSecure !== undefined ||
      settings.smtpUser !== undefined ||
      settings.smtpPass !== undefined ||
      settings.smtpFrom !== undefined ||
      settings.smtpTo !== undefined
    ) {
      EmailService.saveSmtpConfig({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        user: settings.smtpUser,
        pass: settings.smtpPass,
        from: settings.smtpFrom,
        to: settings.smtpTo,
      });
    }
  }

  public static async send(
    title: string,
    message: string,
    priority: 'low' | 'default' | 'high' | 'urgent' = 'default',
    tags: string[] = ['car', 'wrench']
  ): Promise<{ success: boolean; message: string }> {
    const config = this.getSettings();
    if (config.provider === 'none') {
      return { success: false, message: 'Notificaties zijn momenteel uitgeschakeld in de instellingen.' };
    }

    try {
      if (config.provider === 'pushover') {
        if (!config.pushoverUserKey || !config.pushoverApiToken) {
          throw new Error('Pushover vereist zowel een User Key als een Application API Token');
        }
        const pushoverPriority =
          priority === 'urgent' || priority === 'high' ? 1 : priority === 'low' ? -1 : 0;
        const payload: Record<string, any> = {
          token: config.pushoverApiToken,
          user: config.pushoverUserKey,
          title,
          message,
          priority: pushoverPriority,
        };
        if (config.pushoverDevice && config.pushoverDevice.trim()) {
          payload.device = config.pushoverDevice.trim();
        }

        const res = await fetch('https://api.pushover.net/1/messages.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Pushover error (${res.status}): ${await res.text()}`);
        }
        return { success: true, message: 'Pushover notificatie succesvol verzonden' };
      }

      if (config.provider === 'ntfy') {
        if (!config.ntfyUrl) throw new Error('Geen Ntfy URL of topic ingesteld');
        const url = config.ntfyUrl.startsWith('http') ? config.ntfyUrl : `https://ntfy.sh/${config.ntfyUrl}`;
        const headers: Record<string, string> = {
          Title: title,
          Priority: priority === 'urgent' ? '5' : priority === 'high' ? '4' : '3',
          Tags: tags.join(','),
        };
        if (config.ntfyToken) {
          headers.Authorization = `Bearer ${config.ntfyToken}`;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: message,
        });

        if (!res.ok) {
          throw new Error(`Ntfy error (${res.status}): ${await res.text()}`);
        }
        return { success: true, message: 'Ntfy notificatie succesvol verzonden' };
      }

      if (config.provider === 'gotify') {
        if (!config.gotifyUrl || !config.gotifyToken) {
          throw new Error('Gotify vereist zowel een Server URL als een App Token');
        }
        const endpoint = `${config.gotifyUrl.replace(/\/$/, '')}/message?token=${encodeURIComponent(config.gotifyToken)}`;
        const gotifyPriority = priority === 'urgent' ? 9 : priority === 'high' ? 7 : 4;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            message,
            priority: gotifyPriority,
          }),
        });

        if (!res.ok) {
          throw new Error(`Gotify error (${res.status}): ${await res.text()}`);
        }
        return { success: true, message: 'Gotify notificatie succesvol verzonden' };
      }

      if (config.provider === 'webhook') {
        if (!config.webhookUrl) throw new Error('Geen Webhook URL geconfigureerd');

        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'vehiclevault_alert',
            title,
            message,
            priority,
            tags,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!res.ok) {
          throw new Error(`Webhook error (${res.status}): ${await res.text()}`);
        }
        return { success: true, message: 'Webhook alert succesvol verzonden' };
      }

      if (config.provider === 'webpush') {
        const res = await PushService.sendToAll(title, message, priority);
        return { success: res.success, message: res.message };
      }

      if (config.provider === 'email') {
        const res = await EmailService.sendNotificationEmail(title, message, priority);
        if (!res.success) {
          throw new Error(res.message);
        }
        return res;
      }

      return { success: false, message: 'Onbekende notificatie provider' };
    } catch (err: any) {
      console.error('Notification dispatch error:', err);
      return { success: false, message: err?.message || 'Fout bij verzenden van notificatie' };
    }
  }

  public static async testNotification(): Promise<{ success: boolean; message: string }> {
    const config = this.getSettings();
    if (config.provider === 'email') {
      return EmailService.sendTestEmail();
    }
    return this.send(
      '🚗 VehicleVault Testnotificatie',
      'Dit is een succesvolle testmelding vanuit VehicleVault. Uw notificatiekoppeling werkt perfect!',
      'default',
      ['white_check_mark', 'car']
    );
  }

  public static async checkAndDispatchAlerts(): Promise<{ alertsSent: number; details: string[] }> {
    return NotificationAlerts.checkAndDispatch();
  }
}
