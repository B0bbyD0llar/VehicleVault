import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface EmailLoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  rememberMe: boolean;
  setRememberMe: (rememberMe: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const EmailLoginForm: React.FC<EmailLoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  loading,
  onSubmit,
}) => {
  const { t } = useLanguage();

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <div>
        <label className="block text-slate-300 font-semibold mb-1.5">
          {t('emailAddress')}
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 font-medium transition shadow-inner"
          />
        </div>
      </div>

      <div>
        <label className="block text-slate-300 font-semibold mb-1.5">
          {t('passwordLabel')}
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-inner"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center space-x-2 text-slate-400 hover:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
          />
          <span className="text-[11px] font-medium">{t('rememberMe')}</span>
        </label>

        <Link
          to="/forgot-password"
          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
        >
          {t('forgotPassword')}
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/60 hover:scale-[1.01] mt-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        <span>
          {loading ? t('signingIn') : t('signInToVault')}
        </span>
      </button>
    </form>
  );
};

