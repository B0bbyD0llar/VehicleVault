import React from 'react';
import { Eye, EyeOff, Copy, ExternalLink, Download, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface ShowcaseLinkTabProps {
  isActive: boolean;
  togglingActive: boolean;
  loading: boolean;
  handleToggleActive: () => void;
  publicSlug: string;
  setPublicSlug: (v: string) => void;
  publicUrl: string;
  copiedLink: boolean;
  handleCopyLink: () => void;
  handleDownloadZip: () => void;
  priceLabel: string;
  setPriceLabel: (v: string) => void;
  askingPrice: string;
  setAskingPrice: (v: string) => void;
  contactWhatsapp: string;
  setContactWhatsapp: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactLocation: string;
  setContactLocation: (v: string) => void;
}

export const ShowcaseLinkTab: React.FC<ShowcaseLinkTabProps> = ({
  isActive,
  togglingActive,
  loading,
  handleToggleActive,
  publicSlug,
  setPublicSlug,
  publicUrl,
  copiedLink,
  handleCopyLink,
  handleDownloadZip,
  priceLabel,
  setPriceLabel,
  askingPrice,
  setAskingPrice,
  contactWhatsapp,
  setContactWhatsapp,
  contactPhone,
  setContactPhone,
  contactEmail,
  setContactEmail,
  contactLocation,
  setContactLocation,
}) => {
  const { lang } = useLanguage();

  return (
    <div className="space-y-5">
      {/* Online / Offline Status Banner */}
      <div
        className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition ${
          isActive
            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
            : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isActive
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Status: {isActive ? (lang === 'nl' ? 'Openbaar Online' : 'Publicly Online') : (lang === 'nl' ? 'Uitgeschakeld (Privé)' : 'Disabled (Private)')}
              </h4>
              {isActive && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lang === 'nl' ? 'Zichtbaar' : 'Live'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isActive
                ? (lang === 'nl'
                    ? 'Iedereen met de unieke link kan dit verkoopdossier zonder inlogaccount bekijken.'
                    : 'Anyone with this unique link can view this showcase dossier without logging in.')
                : (lang === 'nl'
                    ? 'De pagina is momenteel niet toegankelijk voor bezoekers (geeft 404).'
                    : 'This public page is currently disabled.')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={togglingActive || loading}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 ${
              isActive
                ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {togglingActive ? (
              <span>Bezig...</span>
            ) : isActive ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Offline Halen</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Nu Live Zetten</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Shareable Link Box */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Openbare Verkooppagina Link & Unieke URL
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent-500/20 focus-within:border-accent-500 h-10 transition">
            <span className="px-3 text-xs text-slate-400 dark:text-slate-500 font-mono select-none shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800 h-full flex items-center">
              {typeof window !== 'undefined' ? `${window.location.origin}/showcase/` : '/showcase/'}
            </span>
            <input
              type="text"
              value={publicSlug}
              onChange={(e) => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
              placeholder="unieke-naam"
              className="flex-1 h-full px-3 text-xs font-mono font-bold text-slate-900 dark:text-white bg-transparent outline-none min-w-0"
            />
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition border border-slate-200 dark:border-slate-700 shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Gekopieerd!' : 'Kopiëren'}</span>
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shrink-0 shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{lang === 'nl' ? 'Bekijken' : 'View Public'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 1-Click Standalone Website ZIP Download */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-blue-950 dark:text-blue-100 flex items-center space-x-2">
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{lang === 'nl' ? 'Standalone Website Exporteren (ZIP)' : 'Export Standalone Website (ZIP)'}</span>
          </h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-300 mt-1 max-w-xl leading-relaxed">
            {lang === 'nl'
              ? "Download een kant-en-klaar HTML/CSS/JS pakket inclusief alle foto's. Direct geschikt om op een eigen domein, hosting of dealerportal te uploaden."
              : "Download a static zero-dependency HTML/CSS/JS package including all photos. Ready to host on GitHub Pages or any web server."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadZip}
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 shadow-xs hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          <span>{lang === 'nl' ? 'Download ZIP Pakket' : 'Download Static Website (ZIP)'}</span>
        </button>
      </div>

      {/* Pricing & Contact Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Prijslabel</label>
          <select
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
            className="w-full h-10 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          >
            <option value="Vraagprijs">Vraagprijs</option>
            <option value="Bieden vanaf">Bieden vanaf</option>
            <option value="Vaste meeneemprijs">Vaste meeneemprijs</option>
            <option value="Inruilprijs">Inruilprijs</option>
            <option value="Prijs op aanvraag">Prijs op aanvraag</option>
            <option value="Geen prijs tonen">Geen prijs tonen (verbergen)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Vraagprijs (€)</label>
          <input
            type="number"
            value={priceLabel === 'Geen prijs tonen' ? '' : askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            disabled={priceLabel === 'Geen prijs tonen' || priceLabel === 'Prijs op aanvraag'}
            placeholder={
              priceLabel === 'Geen prijs tonen'
                ? 'Geen prijs zichtbaar op pagina'
                : priceLabel === 'Prijs op aanvraag'
                ? 'Prijs op aanvraag'
                : 'bijv. 8950 (leeg laten = geen prijs tonen)'
            }
            className="w-full h-10 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">WhatsApp Nummer</label>
          <input
            type="text"
            value={contactWhatsapp}
            onChange={(e) => setContactWhatsapp(e.target.value)}
            placeholder="bijv. +31612345678"
            className="w-full h-10 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Telefoonnummer</label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="bijv. 06-12345678"
            className="w-full h-10 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Contact E-mailadres</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="bijv. koper@domein.nl"
            className="w-full h-10 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Locatie Bezichtiging</label>
          <input
            type="text"
            value={contactLocation}
            onChange={(e) => setContactLocation(e.target.value)}
            placeholder="Woonplaats of regio"
            className="w-full h-10 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>
      </div>
    </div>
  );
};
