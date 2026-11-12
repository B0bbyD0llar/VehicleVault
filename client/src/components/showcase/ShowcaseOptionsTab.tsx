import React, { useState } from 'react';
import { Plus, X, RotateCcw, Check, Sparkles, Trash2, FolderPlus } from 'lucide-react';
import { ShowcaseOptionGroup, DEFAULT_SHOWCASE_OPTIONS, SUGGESTED_OPTIONS_BY_CATEGORY } from './showcaseConstants.js';

interface ShowcaseOptionsTabProps {
  optionsList: ShowcaseOptionGroup[];
  onChange: (updated: ShowcaseOptionGroup[]) => void;
}

export const ShowcaseOptionsTab: React.FC<ShowcaseOptionsTabProps> = ({
  optionsList,
  onChange,
}) => {
  const [newInputs, setNewInputs] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const handleAddItem = (categoryIndex: number) => {
    const category = optionsList[categoryIndex];
    if (!category) return;
    const text = (newInputs[category.category] || '').trim();
    if (!text) return;

    const updated = optionsList.map((grp, idx) => {
      if (idx !== categoryIndex) return grp;
      if (grp.items.some((item) => item.toLowerCase() === text.toLowerCase())) return grp;
      return { ...grp, items: [...grp.items, text] };
    });

    onChange(updated);
    setNewInputs((prev) => ({ ...prev, [category.category]: '' }));
  };

  const handleAddSuggestion = (categoryIndex: number, suggestion: string) => {
    const updated = optionsList.map((grp, idx) => {
      if (idx !== categoryIndex) return grp;
      if (grp.items.includes(suggestion)) return grp;
      return { ...grp, items: [...grp.items, suggestion] };
    });
    onChange(updated);
  };

  const handleRemoveItem = (categoryIndex: number, itemIndex: number) => {
    const updated = optionsList.map((grp, idx) => {
      if (idx !== categoryIndex) return grp;
      return { ...grp, items: grp.items.filter((_, i) => i !== itemIndex) };
    });
    onChange(updated);
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (optionsList.some((grp) => grp.category.toLowerCase() === trimmed.toLowerCase())) {
      setNewCategoryName('');
      setIsAddingCategory(false);
      return;
    }
    onChange([...optionsList, { category: trimmed, items: [] }]);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (categoryIndex: number) => {
    const grp = optionsList[categoryIndex];
    if (!grp) return;
    if (grp.items.length > 0 && !window.confirm(`Categorie "${grp.category}" inclusief ${grp.items.length} opties verwijderen?`)) {
      return;
    }
    onChange(optionsList.filter((_, i) => i !== categoryIndex));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Weet je zeker dat je alle opties wilt herstellen naar de aanbevolen standaardset?')) {
      onChange(JSON.parse(JSON.stringify(DEFAULT_SHOWCASE_OPTIONS)));
    }
  };

  const totalCount = optionsList.reduce((acc, grp) => acc + grp.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-accent-500" />
            <span>Opties & Accessoires Beheer</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-100 dark:bg-accent-950/70 text-accent-700 dark:text-accent-300">
              {totalCount} {totalCount === 1 ? 'optie' : 'opties'}
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pas bestaande fabrieksopties aan, verwijder opties of voeg specifieke pakketten en accessoires toe.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition"
            title="Herstel naar de standaard suggesties"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Standaard Herstellen</span>
          </button>

          {!isAddingCategory ? (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="h-9 px-3 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Nieuwe Categorie</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Bijv. Audio & Navigatie..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="h-9 px-3 text-xs rounded-xl bg-white dark:bg-slate-800 border border-accent-500 text-slate-900 dark:text-white outline-none w-44"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="h-9 px-3 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold transition"
              >
                Toevoegen
              </button>
              <button
                type="button"
                onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }}
                className="h-9 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {optionsList.map((grp, catIdx) => {
          const suggestions = (SUGGESTED_OPTIONS_BY_CATEGORY[grp.category] || []).filter(
            (sug) => !grp.items.some((item) => item.toLowerCase() === sug.toLowerCase())
          );
          const inputValue = newInputs[grp.category] || '';

          return (
            <div
              key={catIdx}
              className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <span>{grp.category}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({grp.items.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(catIdx)}
                    className="text-slate-300 hover:text-red-500 transition p-1"
                    title="Categorie verwijderen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Items List */}
                <ul className="space-y-1.5 min-h-[60px]">
                  {grp.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="group flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(catIdx, itemIdx)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded opacity-60 group-hover:opacity-100 transition shrink-0 ml-1"
                        title="Verwijderen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                  {grp.items.length === 0 && (
                    <li className="text-center py-4 text-[11px] text-slate-400 italic">
                      Geen opties in deze categorie. Voeg er hieronder een toe!
                    </li>
                  )}
                </ul>
              </div>

              {/* Add item input & Quick suggestions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setNewInputs((prev) => ({ ...prev, [grp.category]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(catIdx)}
                    placeholder="Nieuwe optie..."
                    className="flex-1 h-8 px-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-accent-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem(catIdx)}
                    disabled={!inputValue.trim()}
                    className="h-8 px-2.5 bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1 transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Toevoegen</span>
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      + Suggesties (klik om toe te voegen):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {suggestions.slice(0, 6).map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleAddSuggestion(catIdx, sug)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-950 dark:hover:text-accent-300 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition text-left truncate max-w-full"
                          title={`Voeg "${sug}" toe`}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
