import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import { Vehicle } from '../../types/index.js';
import { apiFetch } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface FuelDataExportCardProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
}

export const FuelDataExportCard: React.FC<FuelDataExportCardProps> = ({
  vehicles,
  selectedVehicleId,
}) => {
  const { lang } = useLanguage();
  const [targetId, setTargetId] = useState(selectedVehicleId || vehicles[0]?.id || '');
  const [exportingType, setExportingType] = useState<'csv' | 'excel' | null>(null);

  const selectedVeh = vehicles.find((v) => v.id === targetId) || vehicles[0];

  const triggerDownload = (blob: Blob, defaultFilename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (!selectedVeh) return;
    try {
      setExportingType(format);
      const endpoint = format === 'csv' ? '/api/fuel/export/csv' : '/api/fuel/export/excel';
      const blob = await apiFetch<Blob>(`${endpoint}?vehicleId=${selectedVeh.id}`);
      const plate = selectedVeh.license_plate
        ? selectedVeh.license_plate.replace(/[^a-zA-Z0-9]/g, '_')
        : 'tankhistorie';
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      triggerDownload(blob, `Tankhistorie_${plate}.${ext}`);
    } catch (err: any) {
      alert(err?.message || (lang === 'nl' ? 'Kon export niet voltooien' : 'Failed to export'));
    } finally {
      setExportingType(null);
    }
  };

  if (vehicles.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'nl' ? 'Tank- en Laadhistorie Exporteren' : 'Export Fuel & Charging History'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'nl'
              ? 'Download de complete historie inclusief datums, tellerstanden, kosten en verbruik.'
              : 'Download full history including dates, odometers, costs, and consumption.'}
          </p>
        </div>

        {vehicles.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">{lang === 'nl' ? 'Voertuig:' : 'Vehicle:'}</span>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-accent-500"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.license_plate ? `(${v.license_plate})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleExport('excel')}
          disabled={exportingType !== null}
          className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {exportingType === 'excel' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center space-x-1.5">
              <span>Excel (.xlsx)</span>
              <Download className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              {lang === 'nl' ? 'Met opgemaakte tabellen, KPI-totalen en verbruiksberekening' : 'Formatted tables with KPI metrics and totals'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleExport('csv')}
          disabled={exportingType !== null}
          className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {exportingType === 'csv' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 flex items-center space-x-1.5">
              <span>CSV Bestand (.csv)</span>
              <Download className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              {lang === 'nl' ? 'Universeel UTF-8 CSV formaat voor import in andere programma’s' : 'Universal UTF-8 CSV separated for import in tools'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
