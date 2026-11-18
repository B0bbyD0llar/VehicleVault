import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.js';

export const InitialSetupBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl mb-5 text-xs text-emerald-300 space-y-2 shadow-lg">
      <div className="font-bold flex items-center space-x-2">
        <span>👋 {t('initialSetupTitle')}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-emerald-300/90">
        {t('initialSetupHint')}
      </p>
      <Link
        to="/register"
        className="w-full inline-flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md"
      >
        {t('createAdminAccount')} →
      </Link>
    </div>
  );
};

