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

interface ServiceRecordTableRowProps {
  record: ServiceRecord;
  isPreOwnership: boolean;
  attachingId: string | null;
  onViewDetails: (record: ServiceRecord) => void;
  onEditRecord: (record: ServiceRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onPreviewInvoice: (doc: { title: string; url: string; date?: string; notes?: string }) => void;
  onFileChange: (recordId: string, file: File) => void;
}

export const ServiceRecordTableRow: React.FC<ServiceRecordTableRowProps> = ({
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
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition align-top">
      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
        {formatDisplayDate(r.date)}
      </td>
      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
        {r.odometer.toLocaleString()} km
      </td>
      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 max-w-md">
        <div className="font-bold text-slate-900 dark:text-white">{r.service_item}</div>

        {lineItems.length > 0 && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => onViewDetails(r)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 transition shadow-2xs"
            >
              <Languages className="w-3.5 h-3.5 text-sky-500" />
              <span>
                {lang === 'nl'
                  ? `Bekijk ${lineItems.length} uitgelezen & vertaalde onderdelen`
                  : `View ${lineItems.length} extracted & translated items`}
              </span>
            </button>
          </div>
        )}

        {r.notes && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line line-clamp-2">
            {r.notes}
          </div>
        )}
      </td>
      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
        <div className="flex flex-col items-start gap-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
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
              className="inline-flex items-start gap-1 text-[10px] text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition max-w-[220px]"
              title={lang === 'nl' ? 'Open garage-adres in Google Maps' : 'Open garage address in Google Maps'}
            >
              <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
              <span className="underline decoration-dotted">{r.garage_address}</span>
            </a>
          )}

          {r.performing_party === 'self' && (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{t('diySavings')}</span>
            </div>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold ${
              isPreOwnership
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            € {r.cost.toFixed(2)}
          </span>
          {isPreOwnership && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
              title={
                lang === 'nl'
                  ? 'Historische onderhoudsbeurt van vóór aankoop — telt niet mee in jouw eigen TCO-kosten'
                  : 'Pre-ownership maintenance record — excluded from your TCO costs'
              }
            >
              {lang === 'nl' ? 'Vorige eigenaar' : 'Pre-ownership'}
            </span>
          )}
        </div>
        {(r.parts_cost !== undefined || r.labor_cost !== undefined) && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            <span>{t('partsCostShort')}: €{(r.parts_cost ?? (r.performing_party === 'self' ? r.cost : 0)).toFixed(0)}</span>
            <span className="mx-1">•</span>
            <span>{t('laborCostShort')}: €{(r.labor_cost || 0).toFixed(0)}</span>
          </div>
        )}
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
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
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 font-bold text-xs transition shadow-2xs group"
            title={lang === 'nl' ? 'Bekijk factuur direct in-app' : 'View invoice in-app'}
          >
            <FileText className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
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
      </td>
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <div className="inline-flex items-center space-x-1">
          <button
            onClick={() => onEditRecord(r)}
            className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 p-1 rounded transition"
            title={lang === 'nl' ? 'Bewerken' : 'Edit'}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteRecord(r.id)}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition"
            title={t('delete')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
