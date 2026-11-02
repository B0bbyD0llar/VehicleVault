import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Wrench } from 'lucide-react';
import { BrakeMeasurement } from '../types/index.js';

interface BrakeStatusCardProps {
  latest: BrakeMeasurement | null;
  onOpenModal: () => void;
  lang: 'nl' | 'en';
}

export const BrakeStatusCard: React.FC<BrakeStatusCardProps> = ({ latest, onOpenModal, lang }) => {
  const getPadBadge = (pad: number | null | undefined) => {
    if (pad === null || pad === undefined) {
      return {
        text: '—',
        color: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
        status: 'unknown',
      };
    }
    if (pad < 2.5) {
      return {
        text: `${pad.toFixed(1)} mm`,
        color: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse',
        status: 'critical',
      };
    }
    if (pad <= 4.0) {
      return {
        text: `${pad.toFixed(1)} mm`,
        color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        status: 'warning',
      };
    }
    return {
      text: `${pad.toFixed(1)} mm`,
      color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      status: 'ok',
    };
  };

  const getDiscLabel = (condition: string) => {
    switch (condition) {
      case 'critical':
      case 'worn':
        return { text: lang === 'nl' ? 'Versleten' : 'Worn', color: 'text-rose-400' };
      case 'moderate':
        return { text: lang === 'nl' ? 'Matig' : 'Moderate', color: 'text-amber-400' };
      default:
        return { text: lang === 'nl' ? 'Goed' : 'Good', color: 'text-emerald-400' };
    }
  };

  const corners = [
    { key: 'fl', label: lang === 'nl' ? 'Linksvoor (LV)' : 'Front-Left (FL)', pad: latest?.pad_fl, disc: latest?.disc_fl },
    { key: 'fr', label: lang === 'nl' ? 'Rechtsvoor (RV)' : 'Front-Right (FR)', pad: latest?.pad_fr, disc: latest?.disc_fr },
    { key: 'rl', label: lang === 'nl' ? 'Linksachter (LA)' : 'Rear-Left (RL)', pad: latest?.pad_rl, disc: latest?.disc_rl },
    { key: 'rr', label: lang === 'nl' ? 'Rechtsachter (RA)' : 'Rear-Right (RR)', pad: latest?.pad_rr, disc: latest?.disc_rr },
  ];

  const hasCritical = corners.some((c) => c.pad !== null && c.pad !== undefined && c.pad < 2.5);
  const hasWarning = corners.some((c) => c.pad !== null && c.pad !== undefined && c.pad <= 4.0 && c.pad >= 2.5);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'nl' ? 'Remmen-status per Wielhoek' : 'Brake Status per Wheel Corner'}
              </h3>
              {hasCritical ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{lang === 'nl' ? 'Vervangen' : 'Replace Soon'}</span>
                </span>
              ) : hasWarning ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{lang === 'nl' ? 'Aandacht' : 'Attention'}</span>
                </span>
              ) : latest ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{lang === 'nl' ? 'In Orde' : 'All Good'}</span>
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {latest
                ? `${lang === 'nl' ? 'Laatste meting' : 'Last checked'}: ${latest.date} • ${latest.odometer.toLocaleString()} km`
                : (lang === 'nl' ? 'Nog geen reminspectie vastgelegd voor dit voertuig' : 'No brake inspection recorded yet')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition self-start sm:self-auto inline-flex items-center space-x-1.5 shadow-2xs"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>{lang === 'nl' ? 'Meting Vastleggen / Historie' : 'Log Measurement / History'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
        {corners.map((corner) => {
          const badge = getPadBadge(corner.pad);
          const disc = getDiscLabel(corner.disc || 'good');

          return (
            <div
              key={corner.key}
              className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-2"
            >
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {corner.label}
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  {lang === 'nl' ? 'Remblokdikte' : 'Pad Thickness'}
                </div>
                <div className="mt-1">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold inline-block ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] flex items-center justify-between text-slate-500">
                <span>{lang === 'nl' ? 'Schijf' : 'Disc'}:</span>
                <span className={`font-bold ${disc.color}`}>{disc.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
