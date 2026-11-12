import React, { useState } from 'react';
import { AlertCircle, X, Car, Landmark, Bell, Radio } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { VehicleBasicSpecsFields } from './VehicleBasicSpecsFields.js';
import { VehiclePurchaseAndApkFields } from './VehiclePurchaseAndApkFields.js';
import { VehicleNotificationSettingsFields } from './VehicleNotificationSettingsFields.js';
import { VehicleTelematicsFields } from './VehicleTelematicsFields.js';
import { VehicleModalProps } from './vehicleModalTypes.js';

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  editingVehicle,
  onClose,
  onSave,
  error,
  name,
  setName,
  type,
  setType,
  licensePlate,
  setLicensePlate,
  plateCountry,
  setPlateCountry,
  vin,
  setVin,
  year,
  setYear,
  make,
  setMake,
  model,
  setModel,
  fuelType,
  setFuelType,
  transmission,
  setTransmission,
  purchaseDate,
  setPurchaseDate,
  purchasePrice,
  setPurchasePrice,
  initialOdometer,
  setInitialOdometer,
  apkDate,
  setApkDate,
  notes,
  setNotes,
  notificationsEnabled,
  setNotificationsEnabled,
  maintenanceNotificationsEnabled,
  setMaintenanceNotificationsEnabled,
  apkNotificationsEnabled,
  setApkNotificationsEnabled,
  tireSwapNotificationsEnabled,
  setTireSwapNotificationsEnabled,
  tireTreadNotificationsEnabled,
  setTireTreadNotificationsEnabled,
  telematicsEnabled,
  setTelematicsEnabled,
  telematicsHaEntityId,
  setTelematicsHaEntityId,
  telematicsLastSyncAt,
  telematicsLastStatus,
  telematicsLastOdometer,
  imagePreview,
  setImagePreview,
  setImageFile,
  rdwLoading,
  rdwSuccess,
  onRdwLookup,
}) => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'specs' | 'purchase' | 'notifications' | 'telematics'>('specs');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 text-slate-900 dark:text-slate-100 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingVehicle ? t('editVehicle') : t('addVehicle')}
              </h3>
              {editingVehicle && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingVehicle.name} {editingVehicle.license_plate ? `• ${editingVehicle.license_plate}` : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shrink-0 ${
                activeTab === 'specs'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{lang === 'nl' ? 'Basis & Specificaties' : 'Basic & Specs'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('purchase')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shrink-0 ${
                activeTab === 'purchase'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>{lang === 'nl' ? 'Aankoop & Keuring' : 'Purchase & Inspection'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{lang === 'nl' ? 'Meldingen' : 'Notifications'}</span>
            </button>

            {setTelematicsEnabled && setTelematicsHaEntityId && (
              <button
                type="button"
                onClick={() => setActiveTab('telematics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shrink-0 ${
                  activeTab === 'telematics'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Home Assistant</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSave} className="space-y-4 text-xs">
            <div className={activeTab === 'specs' ? 'block space-y-4' : 'hidden'}>
              <VehicleBasicSpecsFields
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                setImageFile={setImageFile}
                plateCountry={plateCountry}
                setPlateCountry={setPlateCountry}
                licensePlate={licensePlate}
                setLicensePlate={setLicensePlate}
                onRdwLookup={onRdwLookup}
                rdwLoading={rdwLoading}
                rdwSuccess={rdwSuccess}
                name={name}
                setName={setName}
                type={type}
                setType={setType}
                make={make}
                setMake={setMake}
                model={model}
                setModel={setModel}
                year={year}
                setYear={setYear}
                fuelType={fuelType}
                setFuelType={setFuelType}
                transmission={transmission}
                setTransmission={setTransmission}
                vin={vin}
                setVin={setVin}
              />
            </div>

            <div className={activeTab === 'purchase' ? 'block space-y-4' : 'hidden'}>
              <VehiclePurchaseAndApkFields
                plateCountry={plateCountry}
                purchaseDate={purchaseDate}
                setPurchaseDate={setPurchaseDate}
                initialOdometer={initialOdometer}
                setInitialOdometer={setInitialOdometer}
                purchasePrice={purchasePrice}
                setPurchasePrice={setPurchasePrice}
                apkDate={apkDate}
                setApkDate={setApkDate}
                notes={notes}
                setNotes={setNotes}
              />
            </div>

            <div className={activeTab === 'notifications' ? 'block space-y-4' : 'hidden'}>
              <VehicleNotificationSettingsFields
                type={type}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                maintenanceNotificationsEnabled={maintenanceNotificationsEnabled}
                setMaintenanceNotificationsEnabled={setMaintenanceNotificationsEnabled}
                apkNotificationsEnabled={apkNotificationsEnabled}
                setApkNotificationsEnabled={setApkNotificationsEnabled}
                tireSwapNotificationsEnabled={tireSwapNotificationsEnabled}
                setTireSwapNotificationsEnabled={setTireSwapNotificationsEnabled}
                tireTreadNotificationsEnabled={tireTreadNotificationsEnabled}
                setTireTreadNotificationsEnabled={setTireTreadNotificationsEnabled}
              />
            </div>

            {setTelematicsEnabled && setTelematicsHaEntityId && (
              <div className={activeTab === 'telematics' ? 'block space-y-4' : 'hidden'}>
                <VehicleTelematicsFields
                  vehicleId={editingVehicle?.id}
                  telematicsEnabled={Boolean(telematicsEnabled)}
                  setTelematicsEnabled={setTelematicsEnabled}
                  telematicsHaEntityId={telematicsHaEntityId || ''}
                  setTelematicsHaEntityId={setTelematicsHaEntityId}
                  telematicsLastSyncAt={telematicsLastSyncAt}
                  telematicsLastStatus={telematicsLastStatus}
                  telematicsLastOdometer={telematicsLastOdometer}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span>Tab:</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {activeTab === 'specs'
                    ? (lang === 'nl' ? '1. Basis' : '1. Basic')
                    : activeTab === 'purchase'
                    ? (lang === 'nl' ? '2. Aankoop & Keuring' : '2. Purchase')
                    : activeTab === 'notifications'
                    ? (lang === 'nl' ? '3. Meldingen' : '3. Notifications')
                    : '4. Home Assistant'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl font-bold transition shadow-sm"
                >
                  {editingVehicle ? t('save') : t('create')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
