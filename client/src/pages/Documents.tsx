import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FolderLock,
  Plus,
  LayoutList,
  LayoutGrid,
  Tag,
} from 'lucide-react';
import { Vehicle, VehicleDocument } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import { compressImage } from '../utils/imageCompressor.js';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal.js';
import { VignetteManager } from '../components/VignetteManager.js';
import { DocumentListView } from '../components/documents/DocumentListView.js';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal.js';
import { DocumentEditModal } from '../components/documents/DocumentEditModal.js';

interface ContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
}

type DocCategory = 'all' | 'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other';

export const Documents: React.FC = () => {
  const { selectedVehicle } = useOutletContext<ContextType>();
  const { t, lang } = useLanguage();

  const [activeSection, setActiveSection] = useState<'documents' | 'vignettes'>('documents');
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<DocCategory>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('vv_documents_view') as 'list' | 'grid') || 'list';
  });

  const handleSetViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('vv_documents_view', mode);
  };

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    date?: string;
    fileSize?: number;
    notes?: string;
  } | null>(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other'>('registration');
  const [docNotes, setDocNotes] = useState('');
  const [docExpiresAt, setDocExpiresAt] = useState('');
  const [docDate, setDocDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionRatio, setCompressionRatio] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Edit Document Modal state
  const [editingDoc, setEditingDoc] = useState<VehicleDocument | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other'>('invoice');
  const [editDate, setEditDate] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (selectedVehicle) {
      loadDocuments(selectedVehicle.id);
    }
  }, [selectedVehicle?.id]);

  const loadDocuments = async (vehicleId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ documents: VehicleDocument[] }>(`/api/documents/${vehicleId}`);
      setDocuments(res.documents);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const processSelectedFile = async (file: File) => {
    setCompressionRatio(null);
    if (!docName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setDocName(cleanName);
    }
    if (!docDate) {
      const dmy = file.name.match(/\b([0-3]?[0-9])[-/.]([0-1]?[0-9])[-/.]([12][0-9]{3})\b/);
      if (dmy) {
        setDocDate(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`);
      } else {
        const ymd = file.name.match(/\b([12][0-9]{3})[-/.]([0-1]?[0-9])[-/.]([0-3]?[0-9])\b/);
        if (ymd) {
          setDocDate(`${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`);
        } else {
          setDocDate(new Date().toISOString().split('T')[0]);
        }
      }
    }
    if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
      setCompressing(true);
      try {
        const origKb = (file.size / 1024).toFixed(0);
        const compressed = await compressImage(file, 1600, 2200, 0.82);
        const compKb = (compressed.size / 1024).toFixed(0);
        setDocFile(compressed);
        setCompressionRatio(`${origKb} KB → ${compKb} KB`);
      } catch (err) {
        console.warn('Compression error, using raw file', err);
        setDocFile(file);
      } finally {
        setCompressing(false);
      }
    } else {
      setDocFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic'];
      const lower = file.name.toLowerCase();
      const isSupported = validExtensions.some((ext) => lower.endsWith(ext)) || file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isSupported) {
        alert(
          lang === 'nl'
            ? 'Alleen PDF- of afbeeldingsbestanden (.pdf, .jpg, .png, .webp) zijn toegestaan.'
            : 'Only PDF or image files (.pdf, .jpg, .png, .webp) are supported.'
        );
        return;
      }
      await processSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !docFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('document', docFile);
      formData.append('name', docName || docFile.name);
      formData.append('category', docCategory);
      if (docNotes) formData.append('notes', docNotes);
      if (docExpiresAt) formData.append('expires_at', docExpiresAt);
      if (docDate) formData.append('document_date', docDate);

      await apiFetch(`/api/documents/${selectedVehicle.id}`, {
        method: 'POST',
        body: formData,
      });

      setIsUploadModalOpen(false);
      setDocFile(null);
      setDocName('');
      setDocNotes('');
      setDocExpiresAt('');
      setDocDate('');
      setCompressionRatio(null);
      setDocCategory('registration');
      setIsDragging(false);
      await loadDocuments(selectedVehicle.id);
    } catch (err: any) {
      alert(err?.message || 'Upload mislukt. Controleer bestandsformaat (PDF, JPG, PNG) en bestandsgrootte (max 30MB).');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm(t('confirmDeleteDocument'))) return;
    try {
      await apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (selectedVehicle) {
        await loadDocuments(selectedVehicle.id);
      }
    } catch {
      // ignore
    }
  };

  const extractDocumentDate = (doc: VehicleDocument): string => {
    if (doc.document_date && /^\d{4}-\d{2}-\d{2}$/.test(doc.document_date)) {
      return doc.document_date;
    }
    const dmyMatch = doc.name ? doc.name.match(/\b([0-3]?[0-9])[-/.]([0-1]?[0-9])[-/.]([12][0-9]{3})\b/) : null;
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }
    const ymdMatch = doc.name ? doc.name.match(/\b([12][0-9]{3})[-/.]([0-1]?[0-9])[-/.]([0-3]?[0-9])\b/) : null;
    if (ymdMatch) {
      return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
    }
    return doc.created_at ? doc.created_at.split('T')[0] : '1970-01-01';
  };

  const openEditModal = (doc: VehicleDocument) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditCategory(doc.category);
    setEditDate(extractDocumentDate(doc));
    setEditExpiresAt(doc.expires_at || '');
    setEditNotes(doc.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    try {
      setIsSavingEdit(true);
      await apiFetch(`/api/documents/${editingDoc.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          category: editCategory,
          document_date: editDate || null,
          expires_at: editExpiresAt || null,
          notes: editNotes.trim() || null,
        }),
      });
      setIsEditModalOpen(false);
      setEditingDoc(null);
      if (selectedVehicle) {
        await loadDocuments(selectedVehicle.id);
      }
    } catch (err: any) {
      alert(err.message || 'Fout bij opslaan document');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredDocuments = documents
    .filter((doc) => {
      if (activeCategory === 'all') return true;
      return doc.category === activeCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      const dateA = extractDocumentDate(a);
      const dateB = extractDocumentDate(b);
      if (sortBy === 'date_asc') {
        return dateA.localeCompare(dateB) || a.created_at.localeCompare(b.created_at);
      }
      return dateB.localeCompare(dateA) || b.created_at.localeCompare(a.created_at);
    });

  const categories: { key: DocCategory; label: string }[] = [
    { key: 'all', label: t('docCatAll') },
    { key: 'registration', label: t('docCatRegistration') },
    { key: 'insurance', label: t('docCatInsurance') },
    { key: 'apk', label: t('docCatApk') },
    { key: 'invoice', label: t('docCatInvoices') },
    { key: 'manual', label: t('docCatManual') },
    { key: 'other', label: t('docCatOther') },
  ];

  if (!selectedVehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <FolderLock className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          {lang === 'nl' ? 'Geen voertuig geselecteerd' : 'No vehicle selected'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          {lang === 'nl'
            ? 'Selecteer een voertuig in het menu hierboven om de digitale handschoenenkast te bekijken.'
            : 'Select a vehicle from the top menu to access the digital glovebox.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section Switcher: Documenten vs Tolvignetten */}
      <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveSection('documents')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            activeSection === 'documents'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderLock className="w-3.5 h-3.5 text-sky-500" />
          <span>{lang === 'nl' ? 'Documenten & Facturen' : 'Documents & Invoices'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono">
            {documents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('vignettes')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            activeSection === 'vignettes'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'nl' ? 'Tolvignetten & Milieustickers' : 'Vignettes & Badges'}</span>
        </button>
      </div>

      {activeSection === 'vignettes' ? (
        <VignetteManager vehicle={selectedVehicle} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
                <FolderLock className="w-5 h-5 text-sky-500" />
                <span>{t('documentsTitle')}</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('documentsSubtitle')} • <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedVehicle.name}</span>
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm hover:scale-[1.02] self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t('uploadDocument')}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const count = cat.key === 'all' ? documents.length : documents.filter((d) => d.category === cat.key).length;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
              >
                <option value="date_desc">{lang === 'nl' ? 'Datum: Nieuwste eerst' : 'Date: Newest first'}</option>
                <option value="date_asc">{lang === 'nl' ? 'Datum: Oudste eerst' : 'Date: Oldest first'}</option>
                <option value="name_asc">{lang === 'nl' ? 'Naam (A-Z)' : 'Name (A-Z)'}</option>
              </select>

              <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === 'list'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === 'grid'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {t('loading')}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <FolderLock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {t('noDocumentsFound')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Bewaar al je belangrijke autopapieren, groene kaart, kentekencard scans en garagefacturen digitaal op één veilige plek.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t('uploadDocument')}</span>
              </button>
            </div>
          ) : (
            <DocumentListView
              documents={filteredDocuments}
              viewMode={viewMode}
              onPreview={(doc) => setPreviewDoc({ ...doc, isOpen: true })}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
          docFile={docFile}
          docName={docName}
          setDocName={setDocName}
          docCategory={docCategory}
          setDocCategory={setDocCategory}
          docNotes={docNotes}
          setDocNotes={setDocNotes}
          docExpiresAt={docExpiresAt}
          setDocExpiresAt={setDocExpiresAt}
          docDate={docDate}
          setDocDate={setDocDate}
          isUploading={isUploading}
          compressing={compressing}
          compressionRatio={compressionRatio}
          isDragging={isDragging}
          onFileChange={handleFileChange}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onRemoveFile={() => {
            setDocFile(null);
            setCompressionRatio(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <DocumentEditModal
          isOpen={isEditModalOpen}
          editingDoc={editingDoc}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingDoc(null);
          }}
          onSave={handleSaveEdit}
          editName={editName}
          setEditName={setEditName}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
          editDate={editDate}
          setEditDate={setEditDate}
          editExpiresAt={editExpiresAt}
          setEditExpiresAt={setEditExpiresAt}
          editNotes={editNotes}
          setEditNotes={setEditNotes}
          isSavingEdit={isSavingEdit}
        />
      )}

      {/* Document In-App Preview Modal */}
      {previewDoc?.isOpen && (
        <DocumentPreviewModal
          isOpen={previewDoc.isOpen}
          title={previewDoc.title}
          url={previewDoc.url}
          fileSize={previewDoc.fileSize}
          notes={previewDoc.notes}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
