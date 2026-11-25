import React, { useEffect, useState } from 'react';
import { X, BadgeEuro } from 'lucide-react';
import { Vehicle } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface SellVehicleModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onConfirm: (
    vehicle: Vehicle,
    soldDate: string,
    soldPrice: number | null,
    keepShowcaseOpen: boolean
  ) => Promise<void>;
}

export const SellVehicleModal: React.FC<SellVehicleModalProps> = ({
  vehicle,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [soldDate, setSoldDate] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [keepShowcaseOpen, setKeepShowcaseOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setSoldDate(vehicle.sold_date || new Date().toISOString().split('T')[0]);
      setSoldPrice(vehicle.sold_price !== undefined && vehicle.sold_price !== null ? String(vehicle.sold_price) : '');
      setKeepShowcaseOpen(false);
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedPrice = soldPrice.trim() !== '' ? Number(soldPrice) : null;
      await onConfirm(
        vehicle,
        soldDate,
        parsedPrice !== null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
        keepShowcaseOpen
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <BadgeEuro className="w-5 h-5 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('sellVehicleTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-white">{vehicle.name}</span> — {t('sellVehicleHint')}
          </p>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('soldDateLabel')}
            </label>
            <input
              type="date"
              value={soldDate}
              onChange={(e) => setSoldDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('soldPriceLabel')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          {vehicle.is_showcase_active && (
            <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={keepShowcaseOpen}
                onChange={(e) => setKeepShowcaseOpen(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200 leading-snug">
                {t('keepShowcaseOpenLabel')}
              </span>
            </label>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold disabled:opacity-50"
            >
              {saving ? t('saving') : t('confirmSold')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
