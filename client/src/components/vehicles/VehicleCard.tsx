import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Archive,
  Edit2,
  Trash2,
  Users,
  Landmark,
} from 'lucide-react';
import { Vehicle, VehicleType } from '../../types/index.js';
import { StatusBadge } from '../StatusBadge.js';
import { LicensePlateBadge } from '../LicensePlateBadge.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { formatDisplayDate } from '../../utils/format.js';
import { getInspectionTerm } from '../../utils/inspectionTerms.js';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (v: Vehicle) => void;
  onDelete: (id: string) => void;
  onToggleArchive: (v: Vehicle) => void;
  onOpenShare: (v: Vehicle) => void;
  onOpenShowcase: (v: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle: v,
  onEdit,
  onDelete,
  onToggleArchive,
  onOpenShare,
  onOpenShowcase,
}) => {
  const { t, lang } = useLanguage();

  const getVehicleTypeName = (vType: VehicleType) => {
    switch (vType) {
      case 'motorcycle': return t('motorcycle');
      case 'van': return t('van');
      case 'trailer': return t('trailer');
      default: return t('car');
    }
  };

  const getDefaultPurchaseDate = (veh: Vehicle): string => {
    if (veh.purchase_date && veh.purchase_date.trim()) {
      return veh.purchase_date.trim().slice(0, 10);
    }
    if (veh.rdw_data) {
      try {
        const parsed = typeof veh.rdw_data === 'string' ? JSON.parse(veh.rdw_data) : veh.rdw_data;
        const rawTenaam = parsed?.datum_tenaamstelling || parsed?.raw?.datum_tenaamstelling;
        if (rawTenaam) {
          const s = String(rawTenaam).trim();
          if (/^\d{8}$/.test(s)) {
            return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
          }
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            return s.slice(0, 10);
          }
        }
      } catch {}
    }
    return '';
  };

  const purchaseDate = getDefaultPurchaseDate(v);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden">
      <div>
        {/* Vehicle Photo Banner */}
        {v.image_path ? (
          <div className="w-full h-44 rounded-xl overflow-hidden mb-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 relative group shadow-xs">
            <img
              src={`/uploads/vehicles/${v.image_path}`}
              alt={v.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-100 dark:border-sky-900/40">
              {getVehicleTypeName(v.type)}
            </span>
            {v.is_owner === false && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/60 px-2 py-0.5 rounded-full border border-accent-200 dark:border-accent-800/40">
                <Users className="w-3 h-3 text-accent-500" />
                <span>Gedeeld{v.owner_email ? ` (${v.owner_email})` : ''}</span>
              </span>
            )}
          </div>
          <StatusBadge status={v.status} />
        </div>

        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{v.name}</h3>
          {v.license_plate && (
            <LicensePlateBadge plate={v.license_plate} country={v.plate_country} size="xs" className="shrink-0" />
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
          {v.year ? `${v.year} ` : ''}
          {v.make || ''} {v.model || ''}
        </p>

        <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'nl' ? 'Huidige stand' : t('odometer')}</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {(v.current_odometer || v.initial_odometer || 0).toLocaleString()} km
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'nl' ? 'Aankoopstand' : t('initialOdometer')}</span>
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              {(v.initial_odometer || 0).toLocaleString()} km
            </span>
          </div>
          {(v.current_odometer || v.initial_odometer || 0) > (v.initial_odometer || 0) && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>{lang === 'nl' ? 'Gereden na aankoop' : 'Driven since purchase'}</span>
              <span className="font-mono font-bold">
                +{((v.current_odometer || v.initial_odometer || 0) - (v.initial_odometer || 0)).toLocaleString()} km
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">{getInspectionTerm(v.plate_country, lang).dateLabel}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatDisplayDate(v.apk_expiration_date)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t('fuelType')}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{v.fuel_type || '—'}</span>
          </div>
          {purchaseDate && (
            <div className="flex justify-between">
              <span className="text-slate-500">{t('purchaseDate')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDisplayDate(purchaseDate)}
              </span>
            </div>
          )}
          {v.purchase_price > 0 && (
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800/80 pt-1.5">
              <span className="text-slate-500">{t('purchasePrice')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                € {v.purchase_price.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-4 text-xs">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onEdit(v)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title={t('editVehicle')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {v.is_owner !== false && (
            <button
              onClick={() => onOpenShowcase(v)}
              className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Verkooppagina & Showcase Dossier"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>
          )}
          {v.is_owner !== false && (
            <button
              onClick={() => onOpenShare(v)}
              className="p-1.5 text-slate-500 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title={lang === 'nl' ? 'Voertuig delen met gezinslid/gebruiker' : 'Share vehicle'}
            >
              <Users className="w-4 h-4" />
            </button>
          )}
          {v.is_owner !== false && (
            <button
              onClick={() => onToggleArchive(v)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title={v.status === 'active' ? t('archiveVehicle') : t('restoreVehicle')}
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          {v.is_owner !== false && (
            <button
              onClick={() => onDelete(v.id)}
              className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title={t('deleteVehicle')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/fixed-expenses"
            onClick={() => {
              localStorage.setItem('vv_active_vehicle', v.id);
              window.dispatchEvent(new CustomEvent('vehicle:changed', { detail: { vehicleId: v.id } }));
            }}
            className="text-slate-500 hover:text-accent-600 dark:hover:text-accent-400 font-semibold text-xs flex items-center space-x-1 transition"
            title="Vaste lasten bekijken"
          >
            <Landmark className="w-3.5 h-3.5 text-accent-500" />
            <span>Lasten</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link
            to={`/analytics?vehicleId=${v.id}`}
            className="text-accent-600 dark:text-accent-400 font-bold hover:underline flex items-center space-x-1 text-xs"
          >
            <span>{t('tcoStats')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

