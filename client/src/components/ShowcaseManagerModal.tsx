import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Link as LinkIcon,
  Camera,
  ShieldCheck,
  ListChecks,
  AlertCircle,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { ShowcaseLinkTab } from './showcase/ShowcaseLinkTab.js';
import { ShowcasePhotosTab } from './showcase/ShowcasePhotosTab.js';
import { ShowcaseOptionsTab } from './showcase/ShowcaseOptionsTab.js';
import { useShowcaseManager } from './showcase/useShowcaseManager.js';

interface ShowcaseManagerModalProps {
  vehicleId: string;
  vehicleName: string;
  isOpen: boolean;
  onClose: () => void;
  onVehicleUpdated?: () => void;
}

export const ShowcaseManagerModal: React.FC<ShowcaseManagerModalProps> = ({
  vehicleId,
  vehicleName,
  isOpen,
  onClose,
  onVehicleUpdated,
}) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'link' | 'photos' | 'options' | 'content'>('link');

  const mgr = useShowcaseManager({ vehicleId, isOpen, onVehicleUpdated });

  if (!isOpen) return null;

  const totalOptionsCount = mgr.optionsList.reduce((acc, grp) => acc + grp.items.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-accent-100 dark:bg-accent-950/70 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0 border border-accent-200/80 dark:border-accent-800 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {lang === 'nl' ? 'Verkooppagina & Showcase Dossier' : 'Sales Showcase & Vehicle Dossier'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300 border border-accent-200/70 dark:border-accent-800">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {vehicleName} • {lang === 'nl' ? 'Beheer openbare pagina, opties, foto\'s en ZIP export' : 'Manage showcase, options, photos, and ZIP export'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title={lang === 'nl' ? 'Sluiten' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center space-x-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
              activeTab === 'link'
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{lang === 'nl' ? 'Link & Verkoop' : 'Public Link'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('options')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
              activeTab === 'options'
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>{lang === 'nl' ? `Opties & Accessoires (${totalOptionsCount})` : `Options (${totalOptionsCount})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
              activeTab === 'photos'
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{lang === 'nl' ? `Foto's (${mgr.photos.length})` : `Photos (${mgr.photos.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
              activeTab === 'content'
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'nl' ? 'Tekst & Historie' : 'Text & History'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {mgr.error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mgr.error}</span>
            </div>
          )}

          {mgr.saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Instellingen en opties succesvol opgeslagen!</span>
            </div>
          )}

          {/* TAB 1: Publieke Link & Verkoop */}
          {activeTab === 'link' && (
            <ShowcaseLinkTab
              isActive={mgr.isActive}
              togglingActive={mgr.togglingActive}
              loading={mgr.loading}
              handleToggleActive={mgr.handleToggleActive}
              publicSlug={mgr.publicSlug}
              setPublicSlug={mgr.setPublicSlug}
              publicUrl={mgr.publicUrl}
              copiedLink={mgr.copiedLink}
              handleCopyLink={mgr.handleCopyLink}
              handleDownloadZip={mgr.handleDownloadZip}
              priceLabel={mgr.priceLabel}
              setPriceLabel={mgr.setPriceLabel}
              askingPrice={mgr.askingPrice}
              setAskingPrice={mgr.setAskingPrice}
              contactWhatsapp={mgr.contactWhatsapp}
              setContactWhatsapp={mgr.setContactWhatsapp}
              contactPhone={mgr.contactPhone}
              setContactPhone={mgr.setContactPhone}
              contactEmail={mgr.contactEmail}
              setContactEmail={mgr.setContactEmail}
              contactLocation={mgr.contactLocation}
              setContactLocation={mgr.setContactLocation}
            />
          )}

          {/* TAB 2: Opties & Accessoires */}
          {activeTab === 'options' && (
            <ShowcaseOptionsTab
              optionsList={mgr.optionsList}
              onChange={mgr.setOptionsList}
            />
          )}

          {/* TAB 3: Fotogalerij */}
          {activeTab === 'photos' && (
            <ShowcasePhotosTab
              photos={mgr.photos}
              uploadCategory={mgr.uploadCategory}
              setUploadCategory={mgr.setUploadCategory}
              uploading={mgr.uploading}
              handleUploadPhotos={mgr.handleUploadPhotos}
              handleSetPrimaryPhoto={mgr.handleSetPrimaryPhoto}
              handleDeletePhoto={mgr.handleDeletePhoto}
            />
          )}

          {/* TAB 4: Teksten & Transparantie */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Paginatitel
                </label>
                <input
                  type="text"
                  value={mgr.title}
                  onChange={(e) => mgr.setTitle(e.target.value)}
                  placeholder="Merk, model en uitvoering"
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Korte Samenvatting / Subtitel
                </label>
                <textarea
                  rows={2}
                  value={mgr.subtitle}
                  onChange={(e) => mgr.setSubtitle(e.target.value)}
                  placeholder="Korte pakkende omschrijving van de staat en uitvoering van de auto..."
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Eerlijke Transparantie & Gebruikssporen (Bouwt vertrouwen op bij kopers)
                </label>
                <textarea
                  rows={5}
                  value={mgr.transparencyNotes}
                  onChange={(e) => mgr.setTransparencyNotes(e.target.value)}
                  placeholder="Vermeld hier eerlijk eventuele lichte gebruikerssporen, de staat van onderhoud en dat facturen ter inzage liggen..."
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <a
              href={mgr.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 inline-flex items-center space-x-1.5 hover:underline"
            >
              <span>Live Verkooppagina Openen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Sluiten
            </button>
            <button
              type="button"
              onClick={mgr.handleSaveShowcase}
              disabled={mgr.loading}
              className="h-10 px-5 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-2"
            >
              {mgr.loading ? (
                <span>Opslaan...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Wijzigingen Opslaan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
