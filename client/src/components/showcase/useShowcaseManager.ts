import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { ShowcaseOptionGroup } from './showcaseConstants.js';

interface UseShowcaseManagerProps {
  vehicleId: string;
  isOpen: boolean;
  onVehicleUpdated?: () => void;
}

export function useShowcaseManager({ vehicleId, isOpen, onVehicleUpdated }: UseShowcaseManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  // Showcase state
  const [showcase, setShowcase] = useState<any>(null);
  const [isActive, setIsActive] = useState(true);
  const [publicSlug, setPublicSlug] = useState('');
  const [askingPrice, setAskingPrice] = useState<string>('');
  const [priceLabel, setPriceLabel] = useState('Vraagprijs');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactLocation, setContactLocation] = useState('');
  const [transparencyNotes, setTransparencyNotes] = useState('');
  const [optionsList, setOptionsList] = useState<ShowcaseOptionGroup[]>([]);

  // Photos state
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploadCategory, setUploadCategory] = useState<'exterieur' | 'interieur' | 'details' | 'gebruikssporen'>('exterieur');
  const [uploading, setUploading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen || !vehicleId) return;
    loadData();
  }, [isOpen, vehicleId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [showcaseRes, photosRes] = await Promise.all([
        apiFetch<{ showcase: any }>(`/api/vehicles/${vehicleId}/showcase`),
        apiFetch<{ photos: any[] }>(`/api/vehicles/${vehicleId}/photos`),
      ]);

      const sc = showcaseRes.showcase;
      setShowcase(sc);
      setIsActive(sc.is_active);
      setPublicSlug(sc.public_slug);
      setAskingPrice(sc.asking_price ? String(sc.asking_price) : '');
      setPriceLabel(sc.price_label || 'Vraagprijs');
      setTitle(sc.title || '');
      setSubtitle(sc.subtitle || '');
      setContactWhatsapp(sc.contact_whatsapp || '');
      setContactPhone(sc.contact_phone || '');
      setContactEmail(sc.contact_email || '');
      setContactLocation(sc.contact_location || '');
      setTransparencyNotes(sc.transparency_notes || '');
      setOptionsList(Array.isArray(sc.options_list) ? sc.options_list : []);
      setPhotos(photosRes.photos || []);
    } catch (err: any) {
      setError(err?.message || 'Fout bij het laden van showcase gegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShowcase = async () => {
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const payload = {
        is_active: isActive,
        public_slug: publicSlug,
        asking_price: askingPrice ? parseFloat(askingPrice) : null,
        price_label: priceLabel,
        title,
        subtitle,
        contact_whatsapp: contactWhatsapp,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        contact_location: contactLocation,
        transparency_notes: transparencyNotes,
        options_list: optionsList,
      };

      const res = await apiFetch<{ showcase: any }>(`/api/vehicles/${vehicleId}/showcase`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setShowcase(res.showcase);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onVehicleUpdated) onVehicleUpdated();
      window.dispatchEvent(new CustomEvent('showcase:changed'));
      window.dispatchEvent(new CustomEvent('vehicle:refresh'));
    } catch (err: any) {
      setError(err?.message || 'Opslaan mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setTogglingActive(true);
    setError(null);
    const newStatus = !isActive;
    try {
      const res = await apiFetch<{ showcase: any }>(`/api/vehicles/${vehicleId}/showcase`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: newStatus }),
      });
      setIsActive(newStatus);
      setShowcase(res.showcase);
      if (onVehicleUpdated) onVehicleUpdated();
      window.dispatchEvent(new CustomEvent('showcase:changed'));
      window.dispatchEvent(new CustomEvent('vehicle:refresh'));
    } catch (err: any) {
      setError(err?.message || 'Status wijzigen mislukt');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
      }
      formData.append('category', uploadCategory);

      await apiFetch(`/api/vehicles/${vehicleId}/photos`, { method: 'POST', body: formData });
      const updated = await apiFetch<{ photos: any[] }>(`/api/vehicles/${vehicleId}/photos`);
      setPhotos(updated.photos || []);
      if (onVehicleUpdated) onVehicleUpdated();
    } catch (err: any) {
      setError(err?.message || 'Fout bij het uploaden van foto\'s');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSetPrimaryPhoto = async (photoId: string) => {
    try {
      await apiFetch(`/api/vehicles/${vehicleId}/photos/${photoId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_primary: 1 }),
      });
      const updated = await apiFetch<{ photos: any[] }>(`/api/vehicles/${vehicleId}/photos`);
      setPhotos(updated.photos || []);
      if (onVehicleUpdated) onVehicleUpdated();
    } catch (err: any) {
      setError(err?.message || 'Hoofdfoto instellen mislukt');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Weet je zeker dat je deze foto wilt verwijderen?')) return;
    try {
      await apiFetch(`/api/vehicles/${vehicleId}/photos/${photoId}`, { method: 'DELETE' });
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (onVehicleUpdated) onVehicleUpdated();
    } catch (err: any) {
      setError(err?.message || 'Foto verwijderen mislukt');
    }
  };

  const handleDownloadZip = () => {
    window.open(`/api/vehicles/${vehicleId}/showcase/export-zip`, '_blank');
  };

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/showcase/${publicSlug || showcase?.public_slug || ''}`
    : `/showcase/${publicSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return {
    loading,
    error,
    saveSuccess,
    togglingActive,
    showcase,
    isActive,
    publicSlug,
    setPublicSlug,
    askingPrice,
    setAskingPrice,
    priceLabel,
    setPriceLabel,
    title,
    setTitle,
    subtitle,
    setSubtitle,
    contactWhatsapp,
    setContactWhatsapp,
    contactPhone,
    setContactPhone,
    contactEmail,
    setContactEmail,
    contactLocation,
    setContactLocation,
    transparencyNotes,
    setTransparencyNotes,
    optionsList,
    setOptionsList,
    photos,
    uploadCategory,
    setUploadCategory,
    uploading,
    copiedLink,
    handleSaveShowcase,
    handleToggleActive,
    handleUploadPhotos,
    handleSetPrimaryPhoto,
    handleDeletePhoto,
    handleDownloadZip,
    publicUrl,
    handleCopyLink,
  };
}
