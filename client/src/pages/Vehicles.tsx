import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Car } from 'lucide-react';
import { Vehicle, VehicleType } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import { compressImage } from '../utils/imageCompressor.js';
import { ShowcaseManagerModal } from '../components/ShowcaseManagerModal.js';
import { VehicleCard } from '../components/vehicles/VehicleCard.js';
import { VehicleModal } from '../components/vehicles/VehicleModal.js';
import { VehicleShareModal } from '../components/vehicles/VehicleShareModal.js';

interface ContextType {
  vehicles: Vehicle[];
  refreshVehicles: () => void;
}

export const Vehicles: React.FC = () => {
  const { vehicles, refreshVehicles } = useOutletContext<ContextType>();
  const { t, lang } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Vehicle Sharing State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingVehicle, setSharingVehicle] = useState<Vehicle | null>(null);
  const [shares, setShares] = useState<any[]>([]);
  const [shareableUsers, setShareableUsers] = useState<{ id: string; email: string }[]>([]);
  const [selectedShareEmail, setSelectedShareEmail] = useState('');
  const [selectedShareRole, setSelectedShareRole] = useState<'editor' | 'viewer'>('editor');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<VehicleType>('car');
  const [licensePlate, setLicensePlate] = useState('');
  const [plateCountry, setPlateCountry] = useState<'NL' | 'BE' | 'DE' | 'EU' | 'OTHER'>('NL');
  const [vin, setVin] = useState('');
  const [year, setYear] = useState<string>('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('Benzine');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('0');
  const [initialOdometer, setInitialOdometer] = useState<string>('0');
  const [apkDate, setApkDate] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwSuccess, setRdwSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Showcase state
  const [showcaseVehicle, setShowcaseVehicle] = useState<Vehicle | null>(null);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);

  const resetForm = () => {
    setName('');
    setType('car');
    setLicensePlate('');
    setPlateCountry('NL');
    setVin('');
    setYear('');
    setMake('');
    setModel('');
    setFuelType(lang === 'nl' ? 'Benzine' : 'Petrol');
    setPurchaseDate('');
    setPurchasePrice('0');
    setInitialOdometer('0');
    setApkDate('');
    setNotes('');
    setImageFile(null);
    setImagePreview(null);
    setEditingVehicle(null);
    setError(null);
    setRdwSuccess(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setName(v.name);
    setType(v.type);
    setLicensePlate(v.license_plate || '');
    setPlateCountry(((v.plate_country as any) || 'NL'));
    setVin(v.vin || '');
    setYear(v.year ? String(v.year) : '');
    setMake(v.make || '');
    setModel(v.model || '');
    setFuelType(v.fuel_type || 'Benzine');
    setPurchaseDate(v.purchase_date ? v.purchase_date.slice(0, 10) : '');
    setPurchasePrice(String(v.purchase_price || 0));
    setInitialOdometer(String(v.initial_odometer || 0));
    setApkDate(v.apk_expiration_date || '');
    setNotes(v.notes || '');
    setImageFile(null);
    setImagePreview(v.image_path ? `/uploads/vehicles/${v.image_path}` : null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleRdwLookup = async () => {
    if (!licensePlate) return;
    setRdwLoading(true);
    setError(null);
    setRdwSuccess(false);

    try {
      const data = await apiFetch<{ rdw: any }>(`/api/vehicles/rdw/${licensePlate}`);
      if (data && data.rdw) {
        if (data.rdw.merk) setMake(data.rdw.merk);
        if (data.rdw.handelsbenaming) setModel(data.rdw.handelsbenaming);
        if (data.rdw.vervaldatum_apk) setApkDate(data.rdw.vervaldatum_apk);
        if (data.rdw.datum_eerste_toelating) {
          const y = data.rdw.datum_eerste_toelating.substring(0, 4);
          setYear(y);
        }
        if (data.rdw.datum_tenaamstelling && !purchaseDate) {
          setPurchaseDate(data.rdw.datum_tenaamstelling);
        }
        if (data.rdw.brandstof_omschrijving) {
          setFuelType(data.rdw.brandstof_omschrijving);
        }
        if (!name) {
          setName(`${data.rdw.merk} ${data.rdw.handelsbenaming}`);
        }
        setRdwSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || t('rdwNotFound'));
    } finally {
      setRdwLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      type,
      license_plate: licensePlate || null,
      plate_country: plateCountry,
      vin: vin || null,
      year: year ? parseInt(year, 10) : null,
      make: make || null,
      model: model || null,
      fuel_type: fuelType || null,
      purchase_date: purchaseDate || null,
      purchase_price: parseFloat(purchasePrice) || 0,
      initial_odometer: parseFloat(initialOdometer) || 0,
      apk_expiration_date: apkDate || null,
      notes: notes || null,
    };

    try {
      let vehicleId = editingVehicle?.id;
      if (editingVehicle) {
        await apiFetch(`/api/vehicles/${editingVehicle.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const res = await apiFetch<{ id: string }>('/api/vehicles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        vehicleId = res.id;
      }

      if (imageFile && vehicleId) {
        const compressedImage = await compressImage(imageFile, 1200, 1200, 0.85);
        const formData = new FormData();
        formData.append('image', compressedImage);
        await apiFetch(`/api/vehicles/${vehicleId}/image`, {
          method: 'POST',
          body: formData,
        });
      }

      setIsModalOpen(false);
      resetForm();
      refreshVehicles();
    } catch (err: any) {
      setError(err?.message || 'Error saving vehicle');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDeleteVehicle'))) {
      try {
        await apiFetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        refreshVehicles();
      } catch (err: any) {
        alert(err?.message || 'Delete failed');
      }
    }
  };

  const handleToggleArchive = async (v: Vehicle) => {
    const newStatus = v.status === 'active' ? 'archived' : 'active';
    try {
      await apiFetch(`/api/vehicles/${v.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      refreshVehicles();
    } catch {
      // ignore
    }
  };

  const openShareModal = async (v: Vehicle) => {
    setSharingVehicle(v);
    setIsShareModalOpen(true);
    setShareError(null);
    setShareSuccess(null);
    setSelectedShareEmail('');
    setSelectedShareRole('editor');
    setShareLoading(true);

    try {
      const [sharesRes, usersRes] = await Promise.all([
        apiFetch<{ shares: any[] }>(`/api/vehicles/${v.id}/shares`),
        apiFetch<{ users: { id: string; email: string }[] }>('/api/auth/users/shareable').catch(() => ({ users: [] })),
      ]);
      setShares(sharesRes?.shares || []);
      setShareableUsers(usersRes?.users || []);
      if (usersRes?.users && usersRes.users.length > 0) {
        setSelectedShareEmail(usersRes.users[0].email);
      }
    } catch (err: any) {
      setShareError(err?.message || 'Fout bij het ophalen van gedeelde gebruikers');
    } finally {
      setShareLoading(false);
    }
  };

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingVehicle || !selectedShareEmail) return;
    setShareLoading(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      const res = await apiFetch(`/api/vehicles/${sharingVehicle.id}/shares`, {
        method: 'POST',
        body: JSON.stringify({ email: selectedShareEmail, role: selectedShareRole }),
      });
      setShareSuccess(res?.message || 'Voertuig succesvol gedeeld');
      const updated = await apiFetch<{ shares: any[] }>(`/api/vehicles/${sharingVehicle.id}/shares`);
      setShares(updated?.shares || []);
    } catch (err: any) {
      setShareError(err?.message || 'Delen mislukt');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRemoveShare = async (userId: string) => {
    if (!sharingVehicle) return;
    try {
      await apiFetch(`/api/vehicles/${sharingVehicle.id}/shares/${userId}`, { method: 'DELETE' });
      setShares((prev) => prev.filter((s) => s.user_id !== userId));
      setShareSuccess('Toegang ingetrokken');
    } catch (err: any) {
      setShareError(err?.message || 'Toegang intrekken mislukt');
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filterStatus === 'all') return true;
    return v.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Car className="w-5 h-5 text-sky-500" />
            <span>{t('myGarage')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('garageSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Tabs */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex text-xs font-semibold">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'active'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('active')} ({vehicles.filter((v) => v.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'archived'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('archived')} ({vehicles.filter((v) => v.status === 'archived').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('all')}
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addVehicle')}</span>
          </button>
        </div>
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400">
          {t('noVehiclesFound')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onToggleArchive={handleToggleArchive}
              onOpenShare={openShareModal}
              onOpenShowcase={(veh) => {
                setShowcaseVehicle(veh);
                setIsShowcaseModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* VEHICLE SHARING MODAL */}
      {isShareModalOpen && sharingVehicle && (
        <VehicleShareModal
          vehicle={sharingVehicle}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shares={shares}
          shareableUsers={shareableUsers}
          selectedShareEmail={selectedShareEmail}
          setSelectedShareEmail={setSelectedShareEmail}
          selectedShareRole={selectedShareRole}
          setSelectedShareRole={setSelectedShareRole}
          shareLoading={shareLoading}
          shareError={shareError}
          shareSuccess={shareSuccess}
          onAddShare={handleAddShare}
          onRemoveShare={handleRemoveShare}
        />
      )}

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <VehicleModal
          isOpen={isModalOpen}
          editingVehicle={editingVehicle}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          error={error}
          name={name}
          setName={setName}
          type={type}
          setType={setType}
          licensePlate={licensePlate}
          setLicensePlate={setLicensePlate}
          plateCountry={plateCountry}
          setPlateCountry={setPlateCountry}
          vin={vin}
          setVin={setVin}
          year={year}
          setYear={setYear}
          make={make}
          setMake={setMake}
          model={model}
          setModel={setModel}
          fuelType={fuelType}
          setFuelType={setFuelType}
          purchaseDate={purchaseDate}
          setPurchaseDate={setPurchaseDate}
          purchasePrice={purchasePrice}
          setPurchasePrice={setPurchasePrice}
          initialOdometer={initialOdometer}
          setInitialOdometer={setInitialOdometer}
          apkDate={apkDate}
          setApkDate={setApkDate}
          notes={notes}
          setNotes={setNotes}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          setImageFile={setImageFile}
          rdwLoading={rdwLoading}
          rdwSuccess={rdwSuccess}
          onRdwLookup={handleRdwLookup}
        />
      )}

      {/* SHOWCASE & DIGITAL SALES DOSSIER MODAL */}
      {isShowcaseModalOpen && showcaseVehicle && (
        <ShowcaseManagerModal
          vehicleId={showcaseVehicle.id}
          vehicleName={showcaseVehicle.name}
          isOpen={isShowcaseModalOpen}
          onClose={() => {
            setIsShowcaseModalOpen(false);
            setShowcaseVehicle(null);
          }}
          onVehicleUpdated={refreshVehicles}
        />
      )}
    </div>
  );
};
