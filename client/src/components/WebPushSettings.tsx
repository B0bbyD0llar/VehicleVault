import React, { useCallback, useEffect, useState } from 'react';
import { BellRing, BellOff, Smartphone, Trash2, Loader2, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  PushDevice,
  describeDevice,
  disablePush,
  enablePush,
  getBrowserSubscription,
  pushUnsupportedReason,
  removeDevice,
} from '../utils/webPush.js';

interface PushStatus {
  subscriptions: PushDevice[];
  totalDevices: number;
}

/** Per-device Web Push: every person enables it on their own phone / computer; the provider choice is global. */
export const WebPushSettings: React.FC = () => {
  const { lang, t } = useLanguage();

  const [status, setStatus] = useState<PushStatus | null>(null);
  const [thisEndpoint, setThisEndpoint] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const unsupported = pushUnsupportedReason();

  const load = useCallback(async () => {
    try {
      setStatus(await apiFetch<PushStatus>('/api/notifications/push/status'));
      if (!pushUnsupportedReason()) {
        setThisEndpoint((await getBrowserSubscription())?.endpoint ?? null);
      }
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const thisDeviceEnabled = Boolean(thisEndpoint && status?.subscriptions.some((s) => s.endpoint === thisEndpoint));

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setFeedback(null);
    try {
      await action();
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setFeedback({ ok: false, text: t('webPushBlocked') });
      } else {
        setFeedback({ ok: false, text: err?.message || t('somethingWentWrong') });
      }
    } finally {
      if (typeof Notification !== 'undefined') setPermission(Notification.permission);
      await load();
      setBusy(false);
    }
  };

  const handleEnable = () =>
    run(async () => {
      await enablePush();
      setFeedback({ ok: true, text: t('webPushEnabled') });
    });

  const handleDisable = () =>
    run(async () => {
      await disablePush();
      setFeedback({ ok: true, text: t('webPushDisabled') });
    });

  const handleTest = () =>
    run(async () => {
      const res = await apiFetch<{ message: string }>('/api/notifications/push/test', { method: 'POST' });
      setFeedback({ ok: true, text: res.message });
    });

  const handleRemove = (device: PushDevice) => {
    if (!confirm(t('webPushConfirmRemove'))) return;
    run(async () => {
      await removeDevice(device.endpoint);
      // Removing the current browser's registration also drops its local subscription.
      if (device.endpoint === thisEndpoint) await (await getBrowserSubscription())?.unsubscribe();
    });
  };

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : lang) : '';

  const deviceLabel = (userAgent: string | null) => {
    const { browser, os } = describeDevice(userAgent);
    if (browser && os) return t('webPushDeviceLabel', { browser, os });
    return browser || os || t('webPushUnknownDevice');
  };

  const unsupportedText = (() => {
    if (unsupported === 'insecure') return t('webPushInsecure');
    if (unsupported === 'ios-not-installed') return t('webPushIosNotInstalled');
    return t('webPushUnsupported');
  })();

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 space-y-4 text-xs">
      <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-sky-800 dark:text-sky-300">
        <span className="font-bold block">{t('webPushInfoTitle')}</span>
        <span className="text-[11px] block mt-0.5 leading-relaxed">{t('webPushInfoText')}</span>
      </div>

      {unsupported ? (
        <div className="flex items-start space-x-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="leading-relaxed">{unsupportedText}</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {thisDeviceEnabled ? (
              <button
                type="button"
                onClick={handleDisable}
                disabled={busy}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
                <span>{t('webPushTurnOff')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnable}
                disabled={busy || permission === 'denied'}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                <span>{t('webPushTurnOn')}</span>
              </button>
            )}

            {thisDeviceEnabled && (
              <button
                type="button"
                onClick={handleTest}
                disabled={busy}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-50 dark:hover:bg-purple-950/40 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('webPushSendTest')}</span>
              </button>
            )}
          </div>

          {permission === 'denied' && !thisDeviceEnabled && (
            <p className="text-amber-700 dark:text-amber-400 leading-relaxed">{t('webPushBlockedReload')}</p>
          )}
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-start space-x-2 p-3 rounded-lg border ${
            feedback.ok
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span className="leading-relaxed">{feedback.text}</span>
        </div>
      )}

      <div>
        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {t('webPushMyDevices')}
          {status && (
            <span className="font-normal text-slate-500 dark:text-slate-400">
              {' · '}
              {t('webPushTotalDevices', { count: status.totalDevices })}
            </span>
          )}
        </div>
        {status && status.subscriptions.length > 0 ? (
          <ul className="space-y-1.5">
            {status.subscriptions.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Smartphone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {deviceLabel(d.userAgent)}
                      {d.endpoint === thisEndpoint && (
                        <span className="ml-1.5 text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">
                          {t('webPushThisDevice')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('webPushEnabledOn', { date: formatDate(d.createdAt) })}
                      {d.lastUsedAt ? ` · ${t('webPushLastAlert', { date: formatDate(d.lastUsedAt) })}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(d)}
                  disabled={busy}
                  aria-label={t('webPushRemoveDevice')}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">
            {t('webPushNoDevices')}
          </p>
        )}
      </div>
    </div>
  );
};
