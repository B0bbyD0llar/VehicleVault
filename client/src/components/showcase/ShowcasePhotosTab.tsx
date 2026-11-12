import React from 'react';
import { Camera, Plus, Star, Trash2 } from 'lucide-react';

interface ShowcasePhotosTabProps {
  photos: any[];
  uploadCategory: 'exterieur' | 'interieur' | 'details' | 'gebruikssporen';
  setUploadCategory: (v: 'exterieur' | 'interieur' | 'details' | 'gebruikssporen') => void;
  uploading: boolean;
  handleUploadPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSetPrimaryPhoto: (id: string) => void;
  handleDeletePhoto: (id: string) => void;
}

export const ShowcasePhotosTab: React.FC<ShowcasePhotosTabProps> = ({
  photos,
  uploadCategory,
  setUploadCategory,
  uploading,
  handleUploadPhotos,
  handleSetPrimaryPhoto,
  handleDeletePhoto,
}) => {
  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-accent-100 dark:bg-accent-950 text-accent-600 dark:text-accent-400 rounded-2xl flex items-center justify-center mx-auto">
          <Camera className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Meerdere Voertuigfoto's Uploaden
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Selecteer één of meerdere foto's tegelijk (JPG, PNG, WEBP).
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Toewijzen aan categorie:</span>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as any)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="exterieur">Exterieur</option>
              <option value="interieur">Interieur</option>
              <option value="details">Details & Opties</option>
              <option value="gebruikssporen">Gebruikssporen</option>
            </select>
          </div>

          <label className="cursor-pointer px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shadow-xs">
            <Plus className="w-4 h-4" />
            <span>{uploading ? 'Uploaden...' : 'Foto\'s Selecteren'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUploadPhotos}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Photo Cards Grid */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
          Aanwezige Foto's ({photos.length})
        </h4>

        {photos.length === 0 ? (
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            Nog geen foto's geüpload voor dit voertuig.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-800 border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                  p.is_primary === 1
                    ? 'border-accent-500 ring-2 ring-accent-500/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-900 relative group">
                  <img
                    src={`/uploads/vehicles/${p.file_path}`}
                    alt={p.title || 'Foto'}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/60 text-white">
                    {p.category}
                  </span>
                  {p.is_primary === 1 && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center space-x-0.5 shadow-xs">
                      <Star className="w-3 h-3 fill-slate-950" />
                      <span>Hoofdfoto</span>
                    </span>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {p.title || 'Voertuigfoto'}
                  </span>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    {p.is_primary !== 1 ? (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryPhoto(p.id)}
                        className="text-[11px] font-bold text-accent-600 dark:text-accent-400 hover:underline flex items-center space-x-1"
                      >
                        <Star className="w-3 h-3" />
                        <span>Als hoofdfoto</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-500">Hoofdfoto</span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      className="text-slate-400 hover:text-red-500 transition p-1"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
