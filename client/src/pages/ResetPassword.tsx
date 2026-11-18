import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export const ResetPassword: React.FC = () => {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError(t('resetNoToken'));
      return;
    }

    const checkToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || t('resetLinkInvalid'));
        }
        setTokenValid(true);
        setTokenEmail(data.email);
      } catch (err: any) {
        setTokenValid(false);
        setTokenError(err?.message || t('resetVerifyFailed'));
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 6) {
      setSubmitError(t('passwordMinLength', { min: 6 }));
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError(t('passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('resetUpdateFailed'));
      }

      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err?.message || t('genericError'));
    } finally {
      setSubmitting(false);
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
            {t('newPassword')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 text-center">
            {tokenEmail ? t('resetForAccount', { email: tokenEmail }) : t('resetChoosePassword')}
          </p>
        </div>

        {verifying ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>{t('verifyingLink')}</span>
          </div>
        ) : !tokenValid ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-rose-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{t('linkInvalidTitle')}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {tokenError || t('linkInvalidHint')}
              </p>
            </div>

            <div className="pt-2 text-center">
              <Link
                to="/forgot-password"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-md"
              >
                <span>{t('requestNewLink')}</span>
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{t('passwordChanged')}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {t('passwordChangedHint')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/60 hover:scale-[1.01]"
            >
              <span>{t('signInNow')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {submitError && (
              <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs p-3.5 rounded-2xl font-medium shadow-lg">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {t('newPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholderMin', { min: 6 })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 font-medium transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {t('authConfirmPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('repeatPassword')}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 font-medium transition shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/60 hover:scale-[1.01] mt-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{submitting ? t('saving') : t('savePassword')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
