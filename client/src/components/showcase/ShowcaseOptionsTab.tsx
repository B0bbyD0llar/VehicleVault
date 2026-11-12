import React, { useState } from 'react';
import { Plus, X, RotateCcw, Check, Sparkles, Trash2 } from 'lucide-react';
import { ShowcaseOptionGroup, DEFAULT_SHOWCASE_OPTIONS, SUGGESTED_OPTIONS_BY_CATEGORY } from './showcaseConstants.js';

interface ShowcaseOptionsTabProps {
  optionsList: ShowcaseOptionGroup[];
  onChange: (updated: ShowcaseOptionGroup[]) => void;
}

export const ShowcaseOptionsTab: React.FC<ShowcaseOptionsTabProps> = ({
  optionsList,
  onChange,
}) => {
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);
  const [newInputText, setNewInputText] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Safe selected category index
  const activeIdx = selectedCatIdx >= 0 && selectedCatIdx < optionsList.length ? selectedCatIdx : 0;
  const currentCategory = optionsList[activeIdx];

  const handleAddItem = () => {
    if (!currentCategory) return;
    const text = newInputText.trim();
    if (!text) return;

    const updated = optionsList.map((grp, idx) => {
      if (idx !== activeIdx) return grp;
      if (grp.items.some((item) => item.toLowerCase() === text.toLowerCase())) return grp;
      return { ...grp, items: [...grp.items, text] };
    });

    onChange(updated);
    setNewInputText('');
  };

  const handleAddSuggestion = (suggestion: string) => {
    if (!currentCategory) return;
    const updated = optionsList.map((grp, idx) => {
      if (idx !== activeIdx) return grp;
      if (grp.items.includes(suggestion)) return grp;
      return { ...grp, items: [...grp.items, suggestion] };
    });
    onChange(updated);
  };

  const handleRemoveItem = (itemIndex: number) => {
    const updated = optionsList.map((grp, idx) => {
      if (idx !== activeIdx) return grp;
      return { ...grp, items: grp.items.filter((_, i) => i !== itemIndex) };
    });
    onChange(updated);
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (optionsList.some((grp) => grp.category.toLowerCase() === trimmed.toLowerCase())) {
      setNewCategoryName(''); setIsAddingCategory(false); return;
    }
    const updated = [...optionsList, { category: trimmed, items: [] }];
    onChange(updated);
    setSelectedCatIdx(updated.length - 1);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (idxToDelete: number) => {
    const grp = optionsList[idxToDelete];
    if (!grp) return;
    if (grp.items.length > 0 && !window.confirm(`Categorie "${grp.category}" inclusief ${grp.items.length} opties verwijderen?`)) {
      return;
    }
    const updated = optionsList.filter((_, i) => i !== idxToDelete);
    onChange(updated);
    if (selectedCatIdx >= updated.length) setSelectedCatIdx(Math.max(0, updated.length - 1));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Weet je zeker dat je alle opties wilt herstellen naar de aanbevolen standaardset?')) {
      onChange(JSON.parse(JSON.stringify(DEFAULT_SHOWCASE_OPTIONS)));
      setSelectedCatIdx(0);
    }
  };

  const totalCount = optionsList.reduce((acc, grp) => acc + grp.items.length, 0);

  const suggestions = currentCategory
    ? (SUGGESTED_OPTIONS_BY_CATEGORY[currentCategory.category] || []).filter(
        (sug) => !currentCategory.items.some((item) => item.toLowerCase() === sug.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-5">
      {/* Top Banner with Stats & Reset */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-accent-500" />
            <span>Opties & Accessoires Beheer</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-100 dark:bg-accent-950/70 text-accent-700 dark:text-accent-300">
              {totalCount} {totalCount === 1 ? 'optie actief' : 'opties actief'}
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Selecteer hieronder een categorie om opties in te zien, te verwijderen of met 1 klik toe te voegen.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition shrink-0"
          title="Herstel naar de standaard fabrieksopties"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Standaard Herstellen</span>
        </button>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {optionsList.map((grp, idx) => {
          const isSelected = idx === activeIdx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedCatIdx(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 border ${
                isSelected
                  ? 'bg-accent-600 text-white border-accent-600 shadow-xs'
                  : 'bg-white hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{grp.category}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {grp.items.length}
              </span>
            </button>
          );
        })}

        {!isAddingCategory ? (
          <button
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/50 transition inline-flex items-center space-x-1 shrink-0 border border-dashed border-accent-300 dark:border-accent-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nieuwe Categorie</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 shrink-0">
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Naam categorie..."
              className="h-8 px-3 text-xs rounded-xl bg-white dark:bg-slate-800 border border-accent-500 text-slate-900 dark:text-white outline-none w-36 shadow-xs"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="h-8 px-3 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              Toevoegen
            </button>
            <button
              type="button"
              onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }}
              className="h-8 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Active Category Panel */}
      {currentCategory && (
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
          {/* Category Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {currentCategory.category}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentCategory.items.length === 1 ? '1 actieve optie' : `${currentCategory.items.length} actieve opties`} in deze categorie
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteCategory(activeIdx)}
              className="text-xs text-slate-400 hover:text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition inline-flex items-center space-x-1"
              title="Verwijder deze gehele categorie"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Categorie Wissen</span>
            </button>
          </div>

          {/* Active Items in a Spacious 2-Column Grid */}
          <div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentCategory.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="group flex items-center justify-between p-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words">
                      {item}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(itemIdx)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition shrink-0 ml-1"
                    title="Optie verwijderen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            {currentCategory.items.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                Nog geen opties aanwezig in deze categorie. Voeg er hieronder direct een toe!
              </div>
            )}
          </div>

          {/* Add Custom Item Input Field */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              value={newInputText}
              onChange={(e) => setNewInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder={`Nieuwe optie typen voor ${currentCategory.category}...`}
              className="flex-1 h-10 px-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-accent-500 transition shadow-2xs"
            />
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newInputText.trim()}
              className="h-10 px-4 bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Toevoegen</span>
            </button>
          </div>

          {/* Clean Suggestion Chips (Without vertical scrollbar) */}
          {suggestions.length > 0 && (
            <div className="bg-slate-50/80 dark:bg-slate-950/40 rounded-xl p-3.5 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Aanbevolen toevoegingen (klik om direct toe te voegen):</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {suggestions.map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleAddSuggestion(sug)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-850 hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-950 dark:hover:text-accent-300 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition shadow-2xs inline-flex items-center space-x-1"
                    title={`Voeg "${sug}" toe`}
                  >
                    <Plus className="w-3 h-3 text-accent-500 shrink-0" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
