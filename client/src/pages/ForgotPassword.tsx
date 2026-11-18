import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export const ForgotPassword: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    resetLink?: string;
    smtpConfigured?: boolean;
    emailSent?: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('resetRequestFailed'));
      }

      setResult(data);
    } catch (err: any) {
      setError(err?.message || t('resetRequestError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden text-slate-100">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {t('forgotPassword')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 text-center">
            {t('forgotPasswordHint')}
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs p-3.5 rounded-2xl mb-5 font-medium shadow-lg animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl space-y-2 text-emerald-300">
              <div className="flex items-center space-x-2 font-bold text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('requestProcessed')}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {result.message}
              </p>
            </div>

            {!result.smtpConfigured && (
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 block">
                  ℹ️ {t('noSmtpTitle')}
                </span>
                <p>
                  {t('noSmtpHint')}
                </p>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-bold hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('backToLogin')}</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 font-medium transition shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/60 hover:scale-[1.01] mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? t('sendingRequest') : t('requestResetLink')}</span>
            </button>

            <div className="pt-4 text-center border-t border-slate-800/80">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('backToLogin')}</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
