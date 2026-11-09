import React, { useState } from 'react';
import { ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { Vehicle } from '../../types/index.js';

interface VehicleTransferOwnershipTabProps {
  vehicle: Vehicle;
  loading: boolean;
  onTransfer: (email: string, retainAccess: boolean) => void;
}

export const VehicleTransferOwnershipTab: React.FC<VehicleTransferOwnershipTabProps> = ({
  vehicle,
  loading,
  onTransfer,
}) => {
  const [targetEmail, setTargetEmail] = useState('');
  const [retainAccess, setRetainAccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !targetEmail.includes('@')) return;
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    onTransfer(targetEmail.trim().toLowerCase(), retainAccess);
    setIsConfirming(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5">
        <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 text-xs font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Volledige overdracht aan nieuwe eigenaar</span>
        </div>
        <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
          Draag het eigendom van <strong>{vehicle.name}</strong> over aan een andere gebruiker op deze server.
          Alle onderhoudshistorie, APK-status, documenten, bandensets en tellerstanden verhuizen direct mee.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          E-mailadres van de koper / nieuwe eigenaar
        </label>
        <input
          type="email"
          required
          placeholder="koper@voorbeeld.nl"
          value={targetEmail}
          onChange={(e) => {
            setTargetEmail(e.target.value);
            setIsConfirming(false);
          }}
          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
        />
        <p className="text-[10px] text-slate-500">
          Als deze persoon nog geen account heeft, wordt er automatisch een account aangemaakt met een activatielink.
        </p>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <input
          type="checkbox"
          id="retainAccessCheckbox"
          checked={retainAccess}
          onChange={(e) => setRetainAccess(e.target.checked)}
          className="rounded border-slate-300 text-accent-600 focus:ring-accent-500"
        />
        <label htmlFor="retainAccessCheckbox" className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
          Houd zelf toegang tot dit voertuig als medebestuurder (bewerker)
        </label>
      </div>

      {isConfirming ? (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
          <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
            Weet je zeker dat je het eigendom van {vehicle.name} wilt overdragen aan {targetEmail}?
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Bezig met overdragen...' : 'Ja, overdragen bevestigen'}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Annuleren
            </button>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading || !targetEmail}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Eigendom Overdragen</span>
        </button>
      )}
    </form>
  );
};
