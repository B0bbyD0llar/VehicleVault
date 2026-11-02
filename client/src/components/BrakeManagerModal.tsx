import React, { useState } from 'react';
import { X, Plus, Trash2, Wrench } from 'lucide-react';
import { BrakeMeasurement } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { DatePicker } from './DatePicker.js';

interface BrakeManagerModalProps {
  vehicleId: string;
  vehicleName: string;
  measurements: BrakeMeasurement[];
  onClose: () => void;
  onRefresh: () => void;
  lang: 'nl' | 'en';
}

export const BrakeManagerModal: React.FC<BrakeManagerModalProps> = ({
  vehicleId,
  vehicleName,
  measurements,
  onClose,
  onRefresh,
  lang,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState('');
  const [padFl, setPadFl] = useState('');
  const [padFr, setPadFr] = useState('');
  const [padRl, setPadRl] = useState('');
  const [padRr, setPadRr] = useState('');
  const [discFl, setDiscFl] = useState<'good' | 'moderate' | 'worn' | 'critical'>('good');
  const [discFr, setDiscFr] = useState<'good' | 'moderate' | 'worn' | 'critical'>('good');
  const [discRl, setDiscRl] = useState<'good' | 'moderate' | 'worn' | 'critical'>('good');
  const [discRr, setDiscRr] = useState<'good' | 'moderate' | 'worn' | 'critical'>('good');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const odoNum = parseFloat(odometer);
    if (isNaN(odoNum) || odoNum < 0) {
      setError(lang === 'nl' ? 'Voer een geldige kilometerstand in.' : 'Enter a valid odometer reading.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await apiFetch(`/api/vehicles/${vehicleId}/brakes`, {
        method: 'POST',
        body: JSON.stringify({
          date,
          odometer: odoNum,
          pad_fl: padFl ? parseFloat(padFl) : null,
          pad_fr: padFr ? parseFloat(padFr) : null,
          pad_rl: padRl ? parseFloat(padRl) : null,
          pad_rr: padRr ? parseFloat(padRr) : null,
          disc_fl: discFl,
          disc_fr: discFr,
          disc_rl: discRl,
          disc_rr: discRr,
          notes: notes.trim() || null,
        }),
      });

      setShowAddForm(false);
      setPadFl('');
      setPadFr('');
      setPadRl('');
      setPadRr('');
      setNotes('');
      onRefresh();
    } catch (err: any) {
      setError(err?.message || (lang === 'nl' ? 'Fout bij opslaan van remmeting' : 'Failed to save brake measurement'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'nl' ? 'Weet je zeker dat je deze remmeting wilt verwijderen?' : 'Are you sure you want to delete this measurement?')) {
      return;
    }
    try {
      await apiFetch(`/api/vehicles/${vehicleId}/brakes/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'nl' ? 'Remmenbeheer & Inspectiehistorie' : 'Brake Inspection & Wear History'}
              </h3>
              <p className="text-[11px] text-slate-400">{vehicleName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {!showAddForm ? (
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3.5 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'nl' ? 'Nieuwe Inspectie Vastleggen' : 'Record New Inspection'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'nl' ? 'Nieuwe Remmeting Invoeren' : 'New Brake Measurement'}
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                {lang === 'nl' ? 'Annuleren' : 'Cancel'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'nl' ? 'Inspectiedatum' : 'Inspection Date'}
                </label>
                <DatePicker value={date} onChange={setDate} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'nl' ? 'Kilometerstand (km)' : 'Odometer (km)'}
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="bijv. 95000"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {lang === 'nl' ? 'Remblokdikte (mm) & Schijfconditie per Wiel' : 'Brake Pad Thickness (mm) & Disc Condition per Wheel'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* FL */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'nl' ? 'Linksvoor (LV)' : 'Front-Left (FL)'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="mm (bijv. 8.5)"
                      value={padFl}
                      onChange={(e) => setPadFl(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                    <select
                      value={discFl}
                      onChange={(e) => setDiscFl(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white"
                    >
                      <option value="good">{lang === 'nl' ? 'Schijf: Goed' : 'Disc: Good'}</option>
                      <option value="moderate">{lang === 'nl' ? 'Schijf: Matig' : 'Disc: Moderate'}</option>
                      <option value="worn">{lang === 'nl' ? 'Schijf: Versleten' : 'Disc: Worn'}</option>
                      <option value="critical">{lang === 'nl' ? 'Schijf: Kritiek' : 'Disc: Critical'}</option>
                    </select>
                  </div>
                </div>

                {/* FR */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'nl' ? 'Rechtsvoor (RV)' : 'Front-Right (FR)'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="mm (bijv. 8.5)"
                      value={padFr}
                      onChange={(e) => setPadFr(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                    <select
                      value={discFr}
                      onChange={(e) => setDiscFr(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white"
                    >
                      <option value="good">{lang === 'nl' ? 'Schijf: Goed' : 'Disc: Good'}</option>
                      <option value="moderate">{lang === 'nl' ? 'Schijf: Matig' : 'Disc: Moderate'}</option>
                      <option value="worn">{lang === 'nl' ? 'Schijf: Versleten' : 'Disc: Worn'}</option>
                      <option value="critical">{lang === 'nl' ? 'Schijf: Kritiek' : 'Disc: Critical'}</option>
                    </select>
                  </div>
                </div>

                {/* RL */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'nl' ? 'Linksachter (LA)' : 'Rear-Left (RL)'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="mm (bijv. 6.0)"
                      value={padRl}
                      onChange={(e) => setPadRl(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                    <select
                      value={discRl}
                      onChange={(e) => setDiscRl(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white"
                    >
                      <option value="good">{lang === 'nl' ? 'Schijf: Goed' : 'Disc: Good'}</option>
                      <option value="moderate">{lang === 'nl' ? 'Schijf: Matig' : 'Disc: Moderate'}</option>
                      <option value="worn">{lang === 'nl' ? 'Schijf: Versleten' : 'Disc: Worn'}</option>
                      <option value="critical">{lang === 'nl' ? 'Schijf: Kritiek' : 'Disc: Critical'}</option>
                    </select>
                  </div>
                </div>

                {/* RR */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'nl' ? 'Rechtsachter (RA)' : 'Rear-Right (RR)'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="mm (bijv. 6.0)"
                      value={padRr}
                      onChange={(e) => setPadRr(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                    <select
                      value={discRr}
                      onChange={(e) => setDiscRr(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white"
                    >
                      <option value="good">{lang === 'nl' ? 'Schijf: Goed' : 'Disc: Good'}</option>
                      <option value="moderate">{lang === 'nl' ? 'Schijf: Matig' : 'Disc: Moderate'}</option>
                      <option value="worn">{lang === 'nl' ? 'Schijf: Versleten' : 'Disc: Worn'}</option>
                      <option value="critical">{lang === 'nl' ? 'Schijf: Kritiek' : 'Disc: Critical'}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'nl' ? 'Notities / Bijzonderheden' : 'Notes / Remarks'}
              </label>
              <input
                type="text"
                placeholder={lang === 'nl' ? 'bijv. Remblokken vervangen bij beurt' : 'e.g. Pads replaced during service'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl"
              >
                {lang === 'nl' ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {saving ? (lang === 'nl' ? 'Opslaan...' : 'Saving...') : (lang === 'nl' ? 'Inspectie Opslaan' : 'Save Inspection')}
              </button>
            </div>
          </form>
        )}

        {/* History List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {lang === 'nl' ? 'Inspectiehistorie' : 'Inspection History'} ({measurements.length})
          </h4>

          {measurements.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              {lang === 'nl' ? 'Nog geen inspecties geregistreerd.' : 'No brake inspections recorded yet.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {measurements.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                      <span>{m.date}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">{m.odometer.toLocaleString()} km</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        LV: {m.pad_fl !== null && m.pad_fl !== undefined ? `${m.pad_fl}mm` : '—'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        RV: {m.pad_fr !== null && m.pad_fr !== undefined ? `${m.pad_fr}mm` : '—'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        LA: {m.pad_rl !== null && m.pad_rl !== undefined ? `${m.pad_rl}mm` : '—'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        RA: {m.pad_rr !== null && m.pad_rr !== undefined ? `${m.pad_rr}mm` : '—'}
                      </span>
                    </div>

                    {m.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{m.notes}</p>}
                  </div>

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title={lang === 'nl' ? 'Verwijderen' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
