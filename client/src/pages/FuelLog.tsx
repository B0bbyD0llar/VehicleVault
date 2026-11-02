import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Fuel,
  Zap,
  Camera,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Vehicle, FuelEntry } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { ReceiptScannerModal } from '../components/ReceiptScannerModal.js';
import { useLanguage } from '../context/LanguageContext.js';
import { FuelEntryForm } from '../components/fuel/FuelEntryForm.js';
import { FuelHistoryTable } from '../components/fuel/FuelHistoryTable.js';
import { FuelEditModal } from '../components/fuel/FuelEditModal.js';

interface ContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  selectedVehicleId: string | null;
}

export const FuelLog: React.FC = () => {
  const { selectedVehicle } = useOutletContext<ContextType>();
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [towingFilter, setTowingFilter] = useState<'all' | 'solo' | 'towing'>('all');
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isEditOcrOpen, setIsEditOcrOpen] = useState(false);

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);

  // Export Dropdown State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleDownloadCsv = async () => {
    if (!selectedVehicle) return;
    try {
      setExportingType('csv');
      const blob = await apiFetch<Blob>(`/api/fuel/export/csv?vehicleId=${selectedVehicle.id}`);
      const plate = selectedVehicle.license_plate ? selectedVehicle.license_plate.replace(/[^a-zA-Z0-9]/g, '_') : 'tankbeurten';
      triggerDownload(blob, `Tankhistorie_${plate}.csv`);
    } catch (err: any) {
      alert(err?.message || 'Kon CSV niet downloaden');
    } finally {
      setExportingType(null);
      setIsExportMenuOpen(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedVehicle) return;
    try {
      setExportingType('excel');
      const blob = await apiFetch<Blob>(`/api/fuel/export/excel?vehicleId=${selectedVehicle.id}`);
      const plate = selectedVehicle.license_plate ? selectedVehicle.license_plate.replace(/[^a-zA-Z0-9]/g, '_') : 'tankbeurten';
      triggerDownload(blob, `Tankhistorie_${plate}.xlsx`);
    } catch (err: any) {
      alert(err?.message || 'Kon Excel niet downloaden');
    } finally {
      setExportingType(null);
      setIsExportMenuOpen(false);
    }
  };

  const loadEntries = async (vehicleId: string) => {
    try {
      const data = await apiFetch<{ entries: FuelEntry[] }>(`/api/fuel?vehicleId=${vehicleId}`);
      setEntries(data.entries);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (selectedVehicle) {
      loadEntries(selectedVehicle.id);
      window.dispatchEvent(new CustomEvent('vv_fuel_logged'));
    }

    const handleSynced = () => {
      if (selectedVehicle) loadEntries(selectedVehicle.id);
    };
    window.addEventListener('vv_offline_synced', handleSynced);
    return () => window.removeEventListener('vv_offline_synced', handleSynced);
  }, [selectedVehicle?.id]);

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDeleteFuel'))) {
      try {
        await apiFetch(`/api/fuel/${id}`, { method: 'DELETE' });
        if (selectedVehicle) loadEntries(selectedVehicle.id);
      } catch (err: any) {
        alert(err?.message || 'Delete failed');
      }
    }
  };

  const handleOpenEditModal = (entry: FuelEntry, autoRescan: boolean = false) => {
    setEditingEntry(entry);
    if (autoRescan) {
      setIsEditOcrOpen(true);
    }
  };

  if (!selectedVehicle) {
    return (
      <div className="p-8 text-center text-slate-500">
        {lang === 'nl' ? 'Selecteer eerst een voertuig.' : 'Please select a vehicle first.'}
      </div>
    );
  }

  const isElectric = selectedVehicle.fuel_type?.toLowerCase() === 'electric';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            {isElectric ? (
              <Zap className="w-5 h-5 text-cyan-500" />
            ) : (
              <Fuel className="w-5 h-5 text-amber-500" />
            )}
            <span>
              {isElectric
                ? (lang === 'nl' ? 'Laadsessies & Energiebeheer' : 'EV Charging Management')
                : t('fuelTitle')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isElectric
              ? (lang === 'nl' ? 'Laadbeurt invoeren voor' : 'Log charging session for')
              : (lang === 'nl' ? 'Tankbeurt invoeren voor' : 'Log fill-up for')}{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{selectedVehicle.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Export Dropdown */}
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition border border-slate-200 dark:border-slate-700 shadow-sm"
              title="Exporteer tankhistorie naar Excel of CSV"
            >
              {exportingType ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              )}
              <span>{lang === 'nl' ? 'Exporteren' : 'Export'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  {lang === 'nl' ? 'Tankhistorie Exporteren' : 'Export Format'}
                </div>

                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={!!exportingType}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center space-x-3 transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Excel (.xlsx)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'nl' ? 'Met KPI-totalen, opmaak & verbruik' : 'With totals, metrics & formatting'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={!!exportingType}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center space-x-3 transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      CSV Bestand (.csv)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'nl' ? 'Universeel UTF-8 met puntkomma' : 'Universal semicolon-separated'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOcrOpen(true)}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shadow-sm"
          >
            <Camera className="w-4 h-4 text-amber-500" />
            <span>{t('ocrReceiptScanner')}</span>
          </button>
        </div>
      </div>

      {/* Fuel Entry Form Card */}
      <FuelEntryForm
        selectedVehicle={selectedVehicle}
        entries={entries}
        onEntryAdded={async () => {
          await loadEntries(selectedVehicle.id);
        }}
      />

      {/* Fuel Entry Logs Table */}
      <FuelHistoryTable
        entries={entries}
        towingFilter={towingFilter}
        setTowingFilter={setTowingFilter}
        onEditEntry={handleOpenEditModal}
        onDeleteEntry={handleDelete}
        onAttachReceipt={(f) => {
          handleOpenEditModal(f);
          setIsEditOcrOpen(true);
        }}
      />

      {/* Edit Modal */}
      <FuelEditModal
        editingEntry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={async () => {
          await loadEntries(selectedVehicle.id);
        }}
        onRequestOcrScan={() => setIsEditOcrOpen(true)}
      />

      {/* OCR Scanner Modals */}
      <ReceiptScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onExtracted={async () => {
          setIsOcrOpen(false);
          await loadEntries(selectedVehicle.id);
        }}
      />

      <ReceiptScannerModal
        isOpen={isEditOcrOpen}
        onClose={() => setIsEditOcrOpen(false)}
        onExtracted={async () => {
          setIsEditOcrOpen(false);
          await loadEntries(selectedVehicle.id);
        }}
      />
    </div>
  );
};
export default FuelLog;
