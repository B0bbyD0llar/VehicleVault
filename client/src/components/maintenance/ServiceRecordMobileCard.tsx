import React from 'react';
import {
  FileText,
  Trash2,
  Edit2,
  Paperclip,
  Languages,
  MapPin,
  Building2,
  Sparkles,
} from 'lucide-react';
import { ServiceRecord, InvoiceLineItem } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { formatDisplayDate } from '../../utils/format.js';

interface ServiceRecordMobileCardProps {
  record: ServiceRecord;
  isPreOwnership: boolean;
  attachingId: string | null;
  onViewDetails: (record: ServiceRecord) => void;
  onEditRecord: (record: ServiceRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onPreviewInvoice: (doc: { title: string; url: string; date?: string; notes?: string }) => void;
  onFileChange: (recordId: string, file: File) => void;
}

export const ServiceRecordMobileCard: React.FC<ServiceRecordMobileCardProps> = ({
  record: r,
  isPreOwnership,
  attachingId,
  onViewDetails,
  onEditRecord,
  onDeleteRecord,
  onPreviewInvoice,
  onFileChange,
}) => {
  const { t, lang } = useLanguage();

  let lineItems: InvoiceLineItem[] = [];
  if (r.line_items) {
    try {
      lineItems = JSON.parse(r.line_items);
    } catch {}
  }

  return (
    <div className="p-3.5 space-y-2.5 bg-white dark:bg-slate-900 transition-colors">
      {/* Top Header: Date, Odometer, Cost */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-900 dark:text-white text-xs">
            {formatDisplayDate(r.date)}
          </span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
            {r.odometer.toLocaleString()} km
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className={`font-mono font-bold text-xs ${isPreOwnership ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
            € {r.cost.toFixed(2)}
          </span>
          {isPreOwnership && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
              {lang === 'nl' ? 'Vorige eigenaar' : 'Pre-ownership'}
            </span>
          )}
        </div>
      </div>

      {/* Service item title */}
      <div>
        <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
          {r.service_item}
        </div>

        {lineItems.length > 0 && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => onViewDetails(r)}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 text-[10px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 transition shadow-2xs"
            >
              <Languages className="w-3 h-3 text-sky-500" />
              <span>
                {lang === 'nl'
                  ? `Bekijk ${lineItems.length} vertaalde onderdelen`
                  : `View ${lineItems.length} translated items`}
              </span>
            </button>
          </div>
        )}

        {r.notes && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {r.notes}
          </div>
        )}
      </div>

      {/* Performing party & address */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
            r.performing_party === 'self'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
          }`}
        >
          {r.performing_party === 'garage' ? (
            <>
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{r.garage_name || t('garage')}</span>
            </>
          ) : (
            t('self')
          )}
        </span>

        {r.performing_party === 'garage' && r.garage_address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${r.garage_name ? r.garage_name + ', ' : ''}${r.garage_address}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 underline decoration-dotted truncate max-w-[200px]"
          >
            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="truncate">{r.garage_address}</span>
          </a>
        )}

        {r.performing_party === 'self' && (
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{t('diySavings')}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions: Invoice Button & Edit/Delete */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <div>
          {r.invoice_path ? (
            <button
              type="button"
              onClick={() =>
                onPreviewInvoice({
                  title: `${r.service_item} — ${r.garage_name || (lang === 'nl' ? 'Factuur' : 'Invoice')}`,
                  url: `/uploads/invoices/${r.invoice_path}`,
                  date: formatDisplayDate(r.date),
                  notes: r.notes || undefined,
                })
              }
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 font-bold text-[11px] transition shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>{lang === 'nl' ? 'Factuur bekijken' : 'View invoice'}</span>
            </button>
          ) : (
            <label
              className={`inline-flex items-center space-x-1 text-[11px] text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 font-semibold cursor-pointer transition ${
                attachingId === r.id ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Paperclip className="w-3 h-3" />
              <span>
                {attachingId === r.id
                  ? (lang === 'nl' ? 'Uploaden...' : 'Uploading...')
                  : (lang === 'nl' ? '+ Factuur koppelen' : '+ Attach invoice')}
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFileChange(r.id, f);
                }}
              />
            </label>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEditRecord(r)}
            className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={lang === 'nl' ? 'Bewerken' : 'Edit'}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteRecord(r.id)}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={t('delete')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
