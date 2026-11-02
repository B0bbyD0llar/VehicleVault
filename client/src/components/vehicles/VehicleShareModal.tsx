import React from 'react';
import { Users, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Vehicle } from '../../types/index.js';
import { formatDisplayDate } from '../../utils/format.js';

interface VehicleShareModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  shares: any[];
  shareableUsers: { id: string; email: string }[];
  selectedShareEmail: string;
  setSelectedShareEmail: (email: string) => void;
  selectedShareRole: 'editor' | 'viewer';
  setSelectedShareRole: (role: 'editor' | 'viewer') => void;
  shareLoading: boolean;
  shareError: string | null;
  shareSuccess: string | null;
  onAddShare: (e: React.FormEvent) => void;
  onRemoveShare: (userId: string) => void;
}

export const VehicleShareModal: React.FC<VehicleShareModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  shares,
  shareableUsers,
  selectedShareEmail,
  setSelectedShareEmail,
  selectedShareRole,
  setSelectedShareRole,
  shareLoading,
  shareError,
  shareSuccess,
  onAddShare,
  onRemoveShare,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-950/70 text-accent-600 dark:text-accent-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Voertuig Delen: {vehicle.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                Geef gezinsleden of mede-bestuurders toegang tot dit voertuig
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {shareError && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{shareError}</span>
          </div>
        )}

        {shareSuccess && (
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{shareSuccess}</span>
          </div>
        )}

        {/* Add share form */}
        <form onSubmit={onAddShare} className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Nieuw account toevoegen
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Gebruiker (E-mail)
              </label>
              {shareableUsers.length > 0 ? (
                <select
                  value={selectedShareEmail}
                  onChange={(e) => setSelectedShareEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-accent-500"
                >
                  {shareableUsers.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="email"
                  required
                  placeholder="bijv. vrouw@voorbeeld.nl"
                  value={selectedShareEmail}
                  onChange={(e) => setSelectedShareEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-accent-500"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Toegangsrechten
              </label>
              <select
                value={selectedShareRole}
                onChange={(e) => setSelectedShareRole(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-accent-500"
              >
                <option value="editor">Bewerker (Tanken, ritten & onderhoud)</option>
                <option value="viewer">Alleen-lezen (Alleen inzien)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={shareLoading || !selectedShareEmail}
              className="px-3.5 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Toegang Verlenen</span>
            </button>
          </div>
        </form>

        {/* List of active shares */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Actieve delingen ({shares.length})
          </span>
          {shares.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              Dit voertuig is momenteel nog met niemand gedeeld.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 max-h-48 overflow-y-auto">
              {shares.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{s.email}</span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      Rol: {s.role === 'editor' ? 'Bewerker' : 'Alleen-lezen'} • Gedeeld op {formatDisplayDate(s.created_at)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveShare(s.user_id)}
                    className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-semibold px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  >
                    Intrekken
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

