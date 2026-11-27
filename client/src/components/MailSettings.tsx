import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, Mail, ShieldCheck, Send, CheckCircle2, AlertCircle, Save, Copy, Check, LogIn, Trash2, X } from 'lucide-react';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import { EMAIL_PRESETS, applyEmailPreset } from '../utils/emailPresets.js';
import { fillSlots } from '../utils/fillSlots.js';

type Transport = 'microsoft' | 'gmail' | 'smtp' | 'graph';

interface MailConfig {
  transport: Transport;
  configured: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    to: string;
    ignoreTlsErrors: boolean;
    requireTls: boolean;
  };
  graph: { tenantId: string; clientId: string; clientSecret: string; sender: string };
  microsoft: { signedIn: boolean; mailbox?: string; tenantId?: string; clientId?: string; ownApp: boolean };
  google: {
    signedIn: boolean;
    account?: string;
    clientId?: string;
    hasClientSecret: boolean;
    redirectUri: string;
    lastResult?: { ok: boolean; message: string };
  };
}

interface DeviceSignIn {
  id: string;
  userCode: string;
  verificationUri: string;
  expiresAt: string;
}

const inputClass =
  'w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono';
const labelClass = 'font-semibold text-slate-700 dark:text-slate-300 block mb-1';

/**
 * Mail settings shared by the notification provider "E-mail" and the password-reset mails: SMTP (with presets
 * for Gmail / Microsoft 365 / Outlook.com) or Microsoft Graph. It saves on its own, before it checks or sends.
 */
export const MailSettings: React.FC = () => {
  const { lang, t } = useLanguage();

  const [transport, setTransport] = useState<Transport>('microsoft');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ignoreTlsErrors, setIgnoreTlsErrors] = useState(false);
  const [requireTls, setRequireTls] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [preset, setPreset] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [sender, setSender] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const [msStatus, setMsStatus] = useState<MailConfig['microsoft']>({ signedIn: false, ownApp: false });
  const [msTenant, setMsTenant] = useState('');
  const [msClient, setMsClient] = useState('');
  const [device, setDevice] = useState<DeviceSignIn | null>(null);

  const [googleStatus, setGoogleStatus] = useState<MailConfig['google']>({ signedIn: false, hasClientSecret: false, redirectUri: '' });
  const [gClientId, setGClientId] = useState('');
  const [gClientSecret, setGClientSecret] = useState('');
  const [showGSecret, setShowGSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<'save' | 'verify' | 'test' | 'signin' | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<MailConfig>('/api/notifications/mail');
      setTransport(res.transport);
      setHost(res.smtp.host);
      setPort(res.smtp.port || 587);
      setSecure(res.smtp.secure);
      setUser(res.smtp.user);
      setPass(res.smtp.pass);
      setFrom(res.smtp.from);
      setTo(res.smtp.to);
      setIgnoreTlsErrors(res.smtp.ignoreTlsErrors);
      setRequireTls(res.smtp.requireTls);
      setTenantId(res.graph.tenantId);
      setClientId(res.graph.clientId);
      setClientSecret(res.graph.clientSecret);
      setSender(res.graph.sender);
      setMsStatus(res.microsoft);
      setMsTenant(res.microsoft.ownApp ? (res.microsoft.tenantId ?? '') : '');
      setMsClient(res.microsoft.ownApp ? (res.microsoft.clientId ?? '') : '');
      setGoogleStatus(res.google);
      setGClientId(res.google.clientId ?? '');
      setGClientSecret(res.google.hasClientSecret ? '••••••••' : '');
      if (new URLSearchParams(window.location.search).has('mail')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('mail');
        window.history.replaceState({}, '', url.toString());
      }
      // Back from Google: the server keeps the outcome, shown once.
      if (res.google.lastResult) setResult({ ok: res.google.lastResult.ok, text: res.google.lastResult.message });
    } catch (err: any) {
      setResult({ ok: false, text: err?.message || t('mailLoadFailed') });
    } finally {
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    await apiFetch('/api/notifications/mail', {
      method: 'PUT',
      body: JSON.stringify({
        transport,
        smtp: { host, port: Number(port) || 587, secure, user, pass, from, to, ignoreTlsErrors, requireTls },
        graph: { tenantId, clientId, clientSecret, sender },
        google: { clientId: gClientId, clientSecret: gClientSecret },
      }),
    });
  };

  // ---- Microsoft 365: sign in with a device code ----

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
  };
  useEffect(() => stopPolling, []);

  const startMicrosoft = async () => {
    setBusy('signin');
    setResult(null);
    stopPolling();
    try {
      const started = await apiFetch<DeviceSignIn>('/api/notifications/mail/microsoft/signin', {
        method: 'POST',
        body: JSON.stringify({ tenantId: msTenant.trim(), clientId: msClient.trim() }),
      });
      setDevice(started);
      pollTimer.current = setInterval(async () => {
        try {
          const res = await apiFetch<{ state: 'pending' | 'failed' | 'done'; message?: string }>('/api/notifications/mail/microsoft/signin/status', {
            method: 'POST',
            body: JSON.stringify({ id: started.id }),
          });
          if (res.state === 'pending') return;
          stopPolling();
          setDevice(null);
          setResult({ ok: res.state === 'done', text: res.message ?? '' });
          if (res.state === 'done') await load();
        } catch (err: any) {
          stopPolling();
          setDevice(null);
          setResult({ ok: false, text: err?.message || t('somethingWentWrong') });
        }
      }, 3000);
    } catch (err: any) {
      setResult({ ok: false, text: err?.message || t('mailMsSignInStartFailed') });
    } finally {
      setBusy(null);
    }
  };

  const cancelMicrosoft = async () => {
    stopPolling();
    const id = device?.id;
    setDevice(null);
    if (id) await apiFetch('/api/notifications/mail/microsoft/signin/cancel', { method: 'POST', body: JSON.stringify({ id }) }).catch(() => undefined);
  };

  const removeConnection = async (kind: 'microsoft' | 'google') => {
    if (!confirm(t('mailConfirmRemoveConnection'))) return;
    try {
      const res = await apiFetch<{ message: string }>(`/api/notifications/mail/${kind}`, { method: 'DELETE' });
      setResult({ ok: true, text: res.message });
      await load();
    } catch (err: any) {
      setResult({ ok: false, text: err?.message || t('somethingWentWrong') });
    }
  };

  // ---- Gmail: sign in with Google ----

  const connectGoogle = async () => {
    setBusy('signin');
    setResult(null);
    try {
      await save();
      const { url } = await apiFetch<{ url: string }>('/api/notifications/mail/google/start', { method: 'POST' });
      window.location.assign(url);
    } catch (err: any) {
      setResult({ ok: false, text: err?.message || t('mailGoogleConnectFailed') });
      setBusy(null);
    }
  };

  const copyRedirect = async () => {
    try {
      await navigator.clipboard.writeText(googleStatus.redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const run = (kind: 'save' | 'verify' | 'test') => async () => {
    setBusy(kind);
    setResult(null);
    try {
      await save();
      if (kind === 'save') {
        setResult({ ok: true, text: t('mailSaved') });
      } else {
        const res = await apiFetch<{ message: string }>(
          kind === 'verify' ? '/api/notifications/mail/verify' : '/api/notifications/mail/test',
          { method: 'POST', body: kind === 'test' ? JSON.stringify({}) : undefined }
        );
        setResult({ ok: true, text: res.message });
      }
    } catch (err: any) {
      setResult({ ok: false, text: err?.message || t('somethingWentWrong') });
    } finally {
      setBusy(null);
    }
  };

  const activePreset = EMAIL_PRESETS.find((p) => p.id === preset && p.host === host);

  if (!loaded) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 space-y-4 text-xs">
      <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-sky-800 dark:text-sky-300">
        <span className="font-bold block">{t('mailInfoTitle')}</span>
        <span className="text-[11px] block mt-0.5">{t('mailInfoText')}</span>
      </div>

      {/* Transport */}
      <div>
        <span className={labelClass}>{t('mailSendThrough')}</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              { id: 'microsoft', label: 'Microsoft 365', sub: t('mailTransportMicrosoftSub') },
              { id: 'gmail', label: 'Gmail', sub: t('mailTransportGmailSub') },
              { id: 'smtp', label: 'SMTP', sub: t('mailTransportSmtpSub') },
              { id: 'graph', label: t('mailTransportGraph'), sub: t('mailTransportGraphSub') },
            ] as const
          ).map((tr) => (
            <button
              key={tr.id}
              type="button"
              onClick={() => setTransport(tr.id)}
              className={`p-3 rounded-xl border text-left transition ${
                transport === tr.id
                  ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="font-bold block text-slate-900 dark:text-white">{tr.label}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{tr.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {transport === 'microsoft' && (
        <div className="space-y-3">
          {msStatus.signedIn && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
              <span>
                <strong>{t('mailMsSignedInAs', { mailbox: msStatus.mailbox ?? '' })}</strong>
                <span className="block text-[11px] opacity-80">
                  {msStatus.ownApp ? t('mailMsOwnApp', { clientId: msStatus.clientId ?? '' }) : t('mailMsDefaultApp')}
                </span>
              </span>
              <button type="button" onClick={() => removeConnection('microsoft')} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/50">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('mailRemoveFromApp')}</span>
              </button>
            </div>
          )}

          {device ? (
            <div role="status" className="p-4 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 space-y-2">
              <p className="text-sky-900 dark:text-sky-200">
                {fillSlots(t('mailMsEnterCodeAt'), {
                  enterCode: <strong>{t('mailMsEnterCode')}</strong>,
                  url: (
                    <a href={device.verificationUri} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                      {device.verificationUri}
                    </a>
                  ),
                })}
              </p>
              <p className="text-2xl font-mono font-bold tracking-widest text-slate-900 dark:text-white select-all">{device.userCode}</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {t('mailMsCodeHint', {
                  time: new Date(device.expiresAt).toLocaleTimeString(lang === 'en' ? 'en-GB' : lang, { hour: '2-digit', minute: '2-digit' }),
                })}
              </p>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('mailMsWaiting')}</span>
                <button type="button" onClick={cancelMicrosoft} className="ml-auto inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-3.5 h-3.5" />
                  <span>{t('cancel')}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>{t('mailMsStep1')}</li>
                <li>{t('mailMsStep2')}</li>
                <li>{t('mailMsStep3')}</li>
              </ol>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t('mailMsPermissionHint')}</p>
              <button
                type="button"
                onClick={startMicrosoft}
                disabled={busy !== null}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
              >
                {busy === 'signin' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>{msStatus.signedIn ? t('mailMsSignInAgain') : t('mailMsSignIn')}</span>
              </button>
              <details className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">{t('mailMsAdvanced')}</summary>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Tenant ID ({t('optional')})</label>
                    <input type="text" value={msTenant} onChange={(e) => setMsTenant(e.target.value)} placeholder="contoso.onmicrosoft.com" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Client ID ({t('optional')})</label>
                    <input type="text" value={msClient} onChange={(e) => setMsClient(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className={inputClass} />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t('mailMsAdvancedHint')}</p>
              </details>
            </>
          )}
        </div>
      )}

      {transport === 'gmail' && (
        <div className="space-y-3">
          {googleStatus.signedIn && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
              <strong>{t('mailGoogleConnectedAs', { account: googleStatus.account ?? '' })}</strong>
              <button type="button" onClick={() => removeConnection('google')} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/50">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('mailRemoveFromApp')}</span>
              </button>
            </div>
          )}

          <details className="rounded-lg border border-slate-200 dark:border-slate-800 p-3" open={!googleStatus.hasClientSecret}>
            <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">{t('mailGoogleSetupTitle')}</summary>
            <ol className="mt-3 list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>{t('mailGoogleStep1')}</li>
              <li>{t('mailGoogleStep2')}</li>
              <li>{t('mailGoogleStep3')}</li>
              <li>{t('mailGoogleStep4')}</li>
            </ol>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-900 dark:text-white">{googleStatus.redirectUri}</code>
              <button type="button" onClick={copyRedirect} aria-label={t('mailCopyUrl')} className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {googleStatus.redirectUri.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(googleStatus.redirectUri) && (
              <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">{t('mailGoogleHttpsOnly')}</p>
            )}
            <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">{t('mailGooglePasteCredentials')}</p>
          </details>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Client ID *</label>
              <input type="text" value={gClientId} onChange={(e) => setGClientId(e.target.value)} placeholder="123456789012-abc….apps.googleusercontent.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('mailClientSecretRequired')}</label>
              <div className="relative">
                <input type={showGSecret ? 'text' : 'password'} value={gClientSecret} onChange={(e) => setGClientSecret(e.target.value)} className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowGSecret(!showGSecret)} aria-label={showGSecret ? t('mailHideSecret') : t('mailShowSecret')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showGSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t('mailGooglePermissionHint')}</p>
          <button
            type="button"
            onClick={connectGoogle}
            disabled={busy !== null || !gClientId || !gClientSecret}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
          >
            {busy === 'signin' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
            <span>{googleStatus.signedIn ? t('mailGoogleReconnect') : t('mailGoogleConnect')}</span>
          </button>
        </div>
      )}

      {transport === 'smtp' && (
        <>
          <div>
            <span className={`${labelClass} mb-1.5`}>{t('mailPresetsLabel')}</span>
            <div className="flex flex-wrap gap-2">
              {EMAIL_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const next = applyEmailPreset(p, { user, from });
                    setHost(next.host);
                    setPort(next.port);
                    setSecure(next.secure);
                    setFrom(next.from);
                    setPreset(p.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition ${
                    host === p.host && port === p.port
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-slate-900 dark:text-white ring-1 ring-purple-500'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {activePreset && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{t(activePreset.hintKey)}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>{t('mailSmtpHost')}</label>
              <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('mailPort')}</label>
              <input
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value, 10) || 587)}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={secure}
              onChange={(e) => setSecure(e.target.checked)}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-300">{t('mailSecure')}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('mailUser')}</label>
              <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="vault@example.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('mailPassword')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? t('mailHidePassword') : t('mailShowPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('mailFrom')}</label>
            <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="VehicleVault <vault@example.com>" className={inputClass} />
          </div>

          <details className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">{t('mailAdvancedTls')}</summary>
            <div className="mt-3 space-y-2.5">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireTls}
                  onChange={(e) => setRequireTls(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>{t('mailRequireTls')}</strong>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">{t('mailRequireTlsHint')}</span>
                </span>
              </label>
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ignoreTlsErrors}
                  onChange={(e) => setIgnoreTlsErrors(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>{t('mailIgnoreTlsErrors')}</strong>
                  <span className="block text-[11px] text-amber-700 dark:text-amber-400">{t('mailIgnoreTlsErrorsHint')}</span>
                </span>
              </label>
            </div>
          </details>
        </>
      )}

      {transport === 'graph' && (
        <>
          <details className="rounded-lg border border-slate-200 dark:border-slate-800 p-3" open={!tenantId}>
            <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">{t('mailGraphSetupTitle')}</summary>
            <ol className="mt-3 list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>{t('mailGraphStep1')}</li>
              <li>{t('mailGraphStep2')}</li>
              <li>{t('mailGraphStep3')}</li>
              <li>{t('mailGraphStep4')}</li>
              <li>{t('mailGraphStep5')}</li>
            </ol>
            <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">{t('mailGraphPolicyHint')}</p>
          </details>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tenant ID *</label>
              <input type="text" value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Client ID *</label>
              <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('mailClientSecretRequired')}</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  aria-label={showSecret ? t('mailHideSecret') : t('mailShowSecret')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('mailSenderMailbox')}</label>
              <input type="text" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="vehiclevault@contoso.com" className={inputClass} />
            </div>
          </div>
        </>
      )}

      <div>
        <label className={labelClass}>{t('mailRecipients')}</label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder={t('mailRecipientsPlaceholder')}
          className={inputClass}
        />
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('mailRecipientsHint')}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={run('save')}
          disabled={busy !== null}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold disabled:opacity-50"
        >
          {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{t('save')}</span>
        </button>
        <button
          type="button"
          onClick={run('verify')}
          disabled={busy !== null}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {busy === 'verify' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{t('mailVerify')}</span>
        </button>
        <button
          type="button"
          onClick={run('test')}
          disabled={busy !== null}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-50 dark:hover:bg-purple-950/40 disabled:opacity-50"
        >
          {busy === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{t('mailSendTest')}</span>
        </button>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center space-x-1">
          <Mail className="w-3 h-3" />
          <span>{t('mailSaveFirstHint')}</span>
        </span>
      </div>

      {result && (
        <div
          role="status"
          className={`flex items-start space-x-2 p-3 rounded-lg border ${
            result.ok
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
          }`}
        >
          {result.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span className="leading-relaxed break-words">{result.text}</span>
        </div>
      )}
    </div>
  );
};
