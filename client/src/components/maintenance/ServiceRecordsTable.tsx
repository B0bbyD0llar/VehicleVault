import React, { useState } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Vehicle, ServiceRecord } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { ServiceRecordMobileCard } from './ServiceRecordMobileCard.js';
import { ServiceRecordTableRow } from './ServiceRecordTableRow.js';

interface ServiceRecordsTableProps {
  records: ServiceRecord[];
  selectedVehicle: Vehicle | null;
  onViewDetails: (record: ServiceRecord) => void;
  onEditRecord: (record: ServiceRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onPreviewInvoice: (doc: { title: string; url: string; date?: string; notes?: string }) => void;
  onAttachInvoice: (recordId: string, file: File) => Promise<void>;
}

export const ServiceRecordsTable: React.FC<ServiceRecordsTableProps> = ({
  records,
  selectedVehicle,
  onViewDetails,
  onEditRecord,
  onDeleteRecord,
  onPreviewInvoice,
  onAttachInvoice,
}) => {
  const { t } = useLanguage();
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const totalPages = Math.ceil(records.length / itemsPerPage) || 1;
  const displayedRecords = records.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isPreOwnership = (rec: ServiceRecord): boolean => {
    if (!selectedVehicle) return false;
    if (rec.exclude_from_tco === 1 || rec.exclude_from_tco === true) return true;
    if (selectedVehicle.purchase_date && rec.date) {
      return rec.date < selectedVehicle.purchase_date.slice(0, 10);
    }
    return false;
  };

  const handleFileChange = async (recordId: string, file: File) => {
    setAttachingId(recordId);
    try {
      await onAttachInvoice(recordId, file);
    } finally {
      setAttachingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('servicePassport')} ({records.length})
          </h3>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-xs text-slate-400 text-center py-10">
          {t('noMaintenanceHistory')}
        </div>
      ) : (
        <>
          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
            {displayedRecords.map((r) => (
              <ServiceRecordMobileCard
                key={r.id}
                record={r}
                isPreOwnership={isPreOwnership(r)}
                attachingId={attachingId}
                onViewDetails={onViewDetails}
                onEditRecord={onEditRecord}
                onDeleteRecord={onDeleteRecord}
                onPreviewInvoice={onPreviewInvoice}
                onFileChange={handleFileChange}
              />
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">{t('date')}</th>
                  <th className="py-2.5 px-4">{t('odometer')}</th>
                  <th className="py-2.5 px-4">{t('partName')}</th>
                  <th className="py-2.5 px-4">{t('performingParty')}</th>
                  <th className="py-2.5 px-4">{t('cost')}</th>
                  <th className="py-2.5 px-4">{t('invoiceAttachment')}</th>
                  <th className="py-2.5 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {displayedRecords.map((r) => (
                  <ServiceRecordTableRow
                    key={r.id}
                    record={r}
                    isPreOwnership={isPreOwnership(r)}
                    attachingId={attachingId}
                    onViewDetails={onViewDetails}
                    onEditRecord={onEditRecord}
                    onDeleteRecord={onDeleteRecord}
                    onPreviewInvoice={onPreviewInvoice}
                    onFileChange={handleFileChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Pagina {currentPage} van {totalPages}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
