import React from 'react';
import { Radio, Gauge, ShieldCheck, Sparkles, Cpu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

export const LoginHeroSection: React.FC = () => {
  const { lang } = useLanguage();

  return (
    <div className="relative hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-12 bg-slate-950 text-white overflow-hidden select-none border-r border-slate-800/80">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Decorative Grid / Cockpit HUD Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      ></div>

      {/* Top Header / Branding */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src="/icon-512.png"
              alt="VehicleVault"
              className="w-12 h-12 object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white block">VehicleVault</span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold tracking-wide">
              v3.1 Telematics &amp; TCO
            </span>
          </div>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 backdrop-blur-md text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Self-Hosted &amp; MCP</span>
        </div>
      </div>

      {/* Center Cinematic Content */}
      <div className="relative z-10 my-auto py-8 max-w-xl space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'nl' ? 'Nieuw in v3.1: Automatische Telematica' : 'New in v3.1: Live Telematics'}</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
            {lang === 'nl' ? (
              <>
                Volledige controle over je wagenpark,{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  kilometers &amp; kosten.
                </span>
              </>
            ) : (
              <>
                Complete control over your fleet,{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  mileage &amp; TCO.
                </span>
              </>
            )}
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            {lang === 'nl'
              ? 'Beheer al je auto’s en motoren op één privacy-vriendelijke plek. Realtime tellersynchronisatie, slimme factuur-OCR, seizoensverbruik en APK-bewaking.'
              : 'Manage all your vehicles in one privacy-friendly, self-hosted vault. Live odometer syncing, receipt OCR, seasonal statistics and inspection tracking.'}
          </p>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Card 1: Telematics */}
          <div className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md transition-all group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">
              {lang === 'nl' ? 'Live Telematica' : 'Live Telematics'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'nl' ? 'Home Assistant, Kia Connect & Mercedes' : 'Home Assistant, Kia Connect & Mercedes'}
            </p>
          </div>

          {/* Card 2: TCO Analytics */}
          <div className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md transition-all group">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Gauge className="w-4 h-4 text-sky-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">
              {lang === 'nl' ? 'TCO & Seizoen' : 'TCO Analytics'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'nl' ? 'Zomer vs. winter verbruik en wagenpark-benchmarks' : 'Seasonal fuel stats and fleet benchmarks'}
            </p>
          </div>

          {/* Card 3: Security & Passkeys */}
          <div className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md transition-all group">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">
              {lang === 'nl' ? 'Biometrisch' : 'Passkey Ready'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'nl' ? 'Inloggen met TouchID, FaceID of Windows Hello' : 'FIDO2 biometric login & zero-tracking'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer / Trust Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-5 gap-2">
        <span>© {new Date().getFullYear()} VehicleVault • Open Source &amp; Self-Hosted</span>
        <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
          <span>Privacy First</span>
          <span>•</span>
          <span>Offline Ready</span>
          <span>•</span>
          <span>SQLite Native</span>
        </div>
      </div>
    </div>
  );
};

