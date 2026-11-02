import { useState } from 'react';
import { Vehicle, VehicleDocument } from '../../types/index.js';
import { apiFetch } from '../../api/client.js';
import { compressImage } from '../../utils/imageCompressor.js';
import { useLanguage } from '../../context/LanguageContext.js';

export function useDocumentOperations(
  selectedVehicle: Vehicle | null,
  loadDocuments: (vehicleId: string) => Promise<void>
) {
  const { t, lang } = useLanguage();

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

  // Edit modal state
  const [editingDoc, setEditingDoc] = useState<VehicleDocument | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other'>('invoice');
  const [editDate, setEditDate] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  return {
    isUploadModalOpen,
    setIsUploadModalOpen,
    docFile,
    setDocFile,
    docName,
    setDocName,
    docCategory,
    setDocCategory,
    docNotes,
    setDocNotes,
    docExpiresAt,
    setDocExpiresAt,
    docDate,
    setDocDate,
    isUploading,
    compressing,
    compressionRatio,
    setCompressionRatio,
    isDragging,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleUpload,
    editingDoc,
    setEditingDoc,
    isEditModalOpen,
    setIsEditModalOpen,
    editName,
    setEditName,
    editCategory,
    setEditCategory,
    editDate,
    setEditDate,
    editExpiresAt,
    setEditExpiresAt,
    editNotes,
    setEditNotes,
    isSavingEdit,
    openEditModal,
    handleSaveEdit,
    handleDelete,
    extractDocumentDate,
  };
}
