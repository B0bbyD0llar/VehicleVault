import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  LayoutGrid,
  Image as ImageIcon,
} from 'lucide-react';

export interface ShowcasePhoto {
  id: string;
  file_path: string;
  category: 'exterieur' | 'interieur' | 'details' | 'gebruikssporen';
  title?: string;
  description?: string;
  sort_order: number;
  is_primary: number;
}

interface ShowcaseGalleryProps {
  photos: ShowcasePhoto[];
  lang?: string;
  onOpenLightbox: (index: number) => void;
}

export const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({
  photos,
  lang = 'nl',
  onOpenLightbox,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'exterieur' | 'interieur' | 'details' | 'gebruikssporen'>('all');
  const [viewMode, setViewMode] = useState<'showroom' | 'grid'>('showroom');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const filteredPhotos = activeCategory === 'all'
    ? photos
    : photos.filter((p) => p.category === activeCategory);

  // Keep selected photo within bounds of filtered list
  const activePhoto = filteredPhotos[selectedPhotoIndex] || filteredPhotos[0] || photos[0];
  const globalIndex = activePhoto ? photos.findIndex((p) => p.id === activePhoto.id) : 0;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : filteredPhotos.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIndex((prev) => (prev < filteredPhotos.length - 1 ? prev + 1 : 0));
  };

  if (photos.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-400">
        {lang === 'nl' ? "Geen foto's beschikbaar voor dit voertuig." : 'No photos available for this vehicle.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Pills & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {(['all', 'exterieur', 'interieur', 'details', 'gebruikssporen'] as const).map((cat) => {
            const count = cat === 'all' ? photos.length : photos.filter((p) => p.category === cat).length;
            if (cat === 'gebruikssporen' && count === 0) return null;

            const labels: Record<string, string> = {
              all: lang === 'nl' ? "Alle foto's" : 'All photos',
              exterieur: lang === 'nl' ? 'Exterieur' : 'Exterior',
              interieur: lang === 'nl' ? 'Interieur' : 'Interior',
              details: lang === 'nl' ? 'Details & Opties' : 'Details & Options',
              gebruikssporen: lang === 'nl' ? 'Gebruikssporen' : 'Wear & Tear',
            };

            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setSelectedPhotoIndex(0);
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition shadow-xs ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {labels[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher: Showroom vs Grid */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 self-start sm:self-auto shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('showroom')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === 'showroom'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={lang === 'nl' ? 'Grote showroom-weergave met carrousel' : 'Showroom viewer with filmstrip'}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{lang === 'nl' ? 'Showroom' : 'Showroom'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={lang === 'nl' ? "Raster met alle foto's" : 'Grid of all photos'}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{lang === 'nl' ? 'Raster' : 'Grid'}</span>
          </button>
        </div>
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400">
          {lang === 'nl' ? "Geen foto's in deze categorie." : 'No photos found in this category.'}
        </div>
      ) : viewMode === 'showroom' && activePhoto ? (
        /* Showroom / Cinema Stage Mode */
        <div className="space-y-3.5">
          {/* Main Hero Stage */}
          <div
            onClick={() => onOpenLightbox(globalIndex)}
            className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[540px] w-full bg-slate-950 rounded-3xl overflow-hidden shadow-xl group cursor-pointer border border-slate-800/80 flex items-center justify-center"
          >
            {/* Ambient Background Blur to fill wide frame gracefully without cropping */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none transition-all duration-700"
              style={{ backgroundImage: `url('/uploads/vehicles/${activePhoto.file_path}')` }}
            />

            {/* Crisp High-Fidelity Main Photo */}
            <img
              src={`/uploads/vehicles/${activePhoto.file_path}`}
              alt={activePhoto.title || 'Voertuigfoto'}
              className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-[1.01]"
            />

            {/* Navigation Arrows */}
            {filteredPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 sm:left-5 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition shadow-lg hover:scale-105"
                  title={lang === 'nl' ? 'Vorige foto' : 'Previous photo'}
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 sm:right-5 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition shadow-lg hover:scale-105"
                  title={lang === 'nl' ? 'Volgende foto' : 'Next photo'}
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Top Bar Badges */}
            <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-md">
                {activePhoto.category}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-md">
                {selectedPhotoIndex + 1} / {filteredPhotos.length}
              </span>
            </div>

            {/* Bottom Caption Overlay */}
            <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-between pointer-events-none">
              <div className="min-w-0 pr-4">
                <span className="text-white font-extrabold text-sm sm:text-base block truncate drop-shadow-md">
                  {activePhoto.title && activePhoto.title !== 'Foto' ? activePhoto.title : 'Voertuigfoto'}
                </span>
                {activePhoto.description && (
                  <p className="text-white/80 text-xs mt-0.5 line-clamp-1 drop-shadow-sm font-medium">
                    {activePhoto.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition shadow-md pointer-events-auto">
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{lang === 'nl' ? 'Volledig scherm' : 'Fullscreen'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Filmstrip Thumbnails */}
          {filteredPhotos.length > 1 && (
            <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin">
              {filteredPhotos.map((photo, idx) => {
                const isSelected = idx === selectedPhotoIndex;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative shrink-0 w-20 sm:w-28 aspect-[16/10] rounded-xl overflow-hidden transition-all ${
                      isSelected
                        ? 'ring-3 ring-blue-600 ring-offset-2 scale-[1.03] shadow-md'
                        : 'opacity-65 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    <img
                      src={`/uploads/vehicles/${photo.file_path}`}
                      alt={photo.title || 'Thumbnail'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Modern Edge-to-Edge Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map((photo) => {
            const gIndex = photos.findIndex((p) => p.id === photo.id);
            const hasCustomInfo = (photo.title && photo.title !== 'Foto' && photo.title !== 'Hoofdfoto') || Boolean(photo.description);

            return (
              <div
                key={photo.id}
                onClick={() => onOpenLightbox(gIndex)}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden group cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300"
              >
                {/* 4:3 Camera Aspect Ratio for natural, un-chopped automotive views */}
                <div className="aspect-[4/3] bg-slate-900 overflow-hidden relative">
                  <img
                    src={`/uploads/vehicles/${photo.file_path}`}
                    alt={photo.title || 'Foto'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Top Right Category Pill */}
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white shadow-xs">
                    {photo.category}
                  </span>

                  {/* Hover Overlay with Expand Cue */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="px-3.5 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-extrabold flex items-center space-x-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{lang === 'nl' ? 'Bekijk foto' : 'View photo'}</span>
                    </span>
                  </div>
                </div>

                {/* Only render caption footer if user provided an actual title or description */}
                {hasCustomInfo && (
                  <div className="p-3.5 bg-white border-t border-slate-100">
                    <strong className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                      {photo.title}
                    </strong>
                    {photo.description && (
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
