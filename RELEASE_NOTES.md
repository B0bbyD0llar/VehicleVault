> 🤖 **Note:** *This is an AI-generated release note summarizing the release (`v3.0.0`) of VehicleVault.*

---

# 🚗 VehicleVault v3.0.0 — Modular Architecture & Proven Standards

**VehicleVault v3.0.0** is a major architectural milestone focused on scalability, maintainability, and enterprise-grade reliability. In this release, all large monolithic files across both the client and server have been systematically decomposed into focused, testable components with a strict constraint of **< 300 lines per file** (following the Single Responsibility Principle). Furthermore, custom and handwritten routines have been replaced by proven industry-standard libraries and protocols.

---

### 🛡️ 1. Replacement of Handwritten Solutions with Proven Standards

| Area | Previous Handwritten Implementation | New Proven Standard & Benefits |
| :--- | :--- | :--- |
| **Authentication & Sessions** | Handwritten JWT signing, ad-hoc token rotation, and custom session middleware. | **Better-Auth (`/api/auth/v3/*`)** integrated with SQLite Drizzle adapter. Delivers standardized authentication protocols, robust session persistence, hardened cookie security, and seamless support for multi-factor authentication and OAuth providers. |
| **Database Data Layer** | Raw SQL queries without compile-time type safety or centralized schema mapping. | **Drizzle ORM (`drizzle-orm`)** type-safe schema mapping (`server/src/db/schema.drizzle.ts` and `drizzle.ts`). Provides end-to-end type safety between TypeScript and the underlying SQLite WAL database. |
| **Input & Payload Validation** | Scattered manual `if (!req.body...)` checks and inconsistent error formats. | **Zod Schema Validation (`zod`)**: Universal declarative runtime validation with automatic TypeScript type inference and standardized error responses for all endpoints. |
| **Task Scheduling & Background Jobs** | Ad-hoc `setInterval` timers susceptible to event-loop lag and overlapping executions. | **ToadScheduler (`toadscheduler`)**: Robust in-process scheduler using `SimpleIntervalJob` and `AsyncTask` with error boundaries for inspection alerts, document expirations, and maintenance triggers. |
| **Application & HTTP Logging** | Unstructured `console.log` and `console.error` calls lacking context and levels. | **Pino High-Performance Logger (`pino` & `pino-http`)**: Structured JSON logging featuring automated token redaction and nanosecond request tracing. |
| **AI Receipt & Invoice Engine** | Monolithic service mixing multiple vendor APIs and document parsing heuristics. | **Modular AI Provider Architecture**: Decoupled providers (`geminiProvider`, `openAiProvider`, `localOcrProvider`) unified by a centralized `ocrNormalizer` implementing the Strategy Pattern. |
| **Push Notifications** | Custom cryptographic payload wrapping and ad-hoc Web Push endpoints. | **RFC-Compliant VAPID Web Push**: Standardized key management, cryptographic handshake, and provider-independent delivery (FCM, Mozilla, Apple). |
| **Reverse Proxy Security** | Permissive header extraction (`remote-user`, etc.) vulnerable to header injection. | **Hardened Trusted Proxy Engine**: Strict IP validation for loopback and standard RFC 1918 private subnets (10.x, 172.16-31.x, 192.168.x). |

---

### 🧱 2. Modular Decomposition of Monolithic Files (< 300 Lines)

Every oversized module has been decomposed into cohesive, single-responsibility units:

#### Frontend Components & Pages (Client):
- **Documents & Digital Glovebox (`Documents.tsx`):**
  - Reduced from >540 lines to **198 lines**.
  - Decomposed into:
    - `DocumentListView.tsx` (265 lines): List and grid views with quick document actions.
    - `DocumentUploadModal.tsx` (174 lines): Drag-and-drop upload with client-side image compression.
    - `DocumentEditModal.tsx` (123 lines): Metadata and expiration date editing.
    - `DocumentHeaderControls.tsx` (95 lines): Category filtering, sorting, and view toggles.
    - `useDocumentOperations.ts` (243 lines): Centralized hook for state, file transformation, and API mutations.
- **Vehicles Management (`Vehicles.tsx`):**
  - Reduced from >450 lines to **217 lines**.
  - Decomposed into:
    - `VehicleCard.tsx` (220 lines): Visual card with RDW status badges, APK expiration warnings, and quick actions.
    - `VehicleBasicSpecsFields.tsx` (277 lines): License plate, country selector, RDW autofill, and basic specs.
    - `VehiclePurchaseAndApkFields.tsx` (100 lines): Purchase details, TCO baseline, inspection dates, and notes.
    - `VehicleModal.tsx` (171 lines): Streamlined create/edit orchestrator.
    - `VehicleShareModal.tsx` (175 lines): Sharing dialog for co-drivers and family members.
    - `useVehicleForm.ts` (199 lines): Form state hook with RDW lookup and validation.
    - `useVehicleShare.ts` (89 lines): Access control and co-driver sharing hook.
- **Settings (`Settings.tsx`):**
  - Reduced from >3,000 lines to **162 lines**.
  - Decomposed into 7 specialized tab components: `GeneralSettingsTab`, `AiSettingsTab`, `NotificationsSettingsTab`, `BackupSettingsTab`, `UsersSettingsTab`, `HomeAssistantSettingsTab`, and `IntegrationsSettingsTab`.
- **Fuel Log (`FuelLog.tsx`):**
  - Reduced from >2,000 lines to **296 lines** via `FuelEntryForm`, `FuelHistoryTable`, and `FuelEditModal`.
- **Maintenance & Service (`Maintenance.tsx`):**
  - Reduced from >1,900 lines to modular components: `IntervalCardsGrid`, `ServiceRecordsTable`, `ServiceRecordModal`, `IntervalModal`, and `ServiceDetailsModal`.
- **Tire Management (`Tires.tsx`):**
  - Reduced from >1,300 lines to **258 lines** via `MountedTireCard`, `TireSetCard`, `TireSetModal`, `TireSwapModal`, and `TireTreadModal`.
- **Cost & TCO Analytics (`AnalyticsTco.tsx`):**
  - Reduced from >1,300 lines to **264 lines** via `TcoFilters`, `FleetAnalyticsView`, `VehicleKpiCards`, `VehicleMonthlyTable`, `VehicleFuelPriceStats`, and `VehicleTankDistanceStats`.
- **Trip Log (`Trips.tsx`):**
  - Reduced from >900 lines to **255 lines** via `TripSummaryCards`, `TripTable`, `TripModal`, and `TripExportDropdown`.

#### Backend Controllers & Services (Server):
- **Authentication Controller (`authController.ts`):**
  - Reduced to a 44-line facade delegating to specialized controllers:
    - `authSessionController.ts`: Registration, login, session initialization, refresh, and logout.
    - `authApiKeyController.ts`: Generation, revocation, and validation of `vkv_` API keys.
    - `authPasswordResetController.ts`: Password reset and token workflows.
    - `userManagementController.ts`: User administration, profiles, and roles.
- **AI Receipt & Invoice Engine (`aiReceiptService.ts`):**
  - Decomposed into pluggable providers (`geminiProvider`, `openAiProvider`, `localOcrProvider`) and a centralized `ocrNormalizer`.

---

### 📱 3. Mobile Navigation Enhancements
- **Dedicated "Vignettes & Badges" Tab:** Toll vignettes and environmental badges now have their own dedicated tab (`/vignettes`) in the mobile bottom bar with a ticket icon.
- **Clean Glovebox Separation:** The toll vignette tab switcher has been removed from the Documents page, keeping the digital glovebox cleanly focused on documents, invoices, and certificates.
- **Dedicated "Documents" Tab:** The Documents tab (`/documents`) is directly available on the mobile navigation bar.
- **Dedicated "Service" Tab:** Maintenance and service records (`/maintenance`) are also directly accessible from mobile.
- **Responsive Horizontal Scroll:** The bottom navigation bar supports smooth horizontal scrolling (`overflow-x-auto scrollbar-none`) with consistent minimum item widths, ensuring comfortable touch targets on screens of all sizes.

---

### 🧪 4. Verified Quality & Stability
- **201/201 Automated Tests Passing:** 100% test pass rate with 0 regressions.
- **End-to-End API Smoke Test Succeeded:** Verified on a clean database (Better-Auth, sessions, vehicles, fuel logs, TCO, trip logging).
- **Clean Clone Verification:** Fully validated via clean `git clone` direct from GitHub; both client and server compile with 0 errors.

---

> 🤖 **Note:** *This is an AI-generated release note summarizing the release (`v2.1.0`) of VehicleVault.*

---

# 🚗 VehicleVault v2.1.0 — Security Hardening, Fuelio Importer, Toll Vignettes & User Profiles

**VehicleVault v2.1.0** delivered core security hardening, third-party data migration, user experience enhancements, and a clean separation between personal user settings and system administration.

- **Security & Reverse Proxy Hardening:** Loopback proxy verification, trusted subnets, BOLA-protected uploads, persistent 256-bit cryptographic secrets.
- **Fuelio Multi-Sectie CSV Importer:** Complete import of multi-section Fuelio exports with deduplication.
- **Toll Vignettes & Badges Menu (`/vignettes`):** Dedicated navigation menu and detail overview with expiration alerts.
- **My Profile (`/profile`):** Personal user account management isolated from global system settings.
- **Trailer & Caravan Mode (`is_towing`):** Separate consumption statistics for towing mode.
- **Tire Purchase Price Tracking:** Recording of purchase prices and invoice linkage for tire sets.
- **Fleet TCO Analytics:** Aggregated metrics across all active vehicles in the garage.

---

> 🤖 **Note:** *This is an AI-generated release note summarizing the complete first official production release (`v2.0.0`) of VehicleVault.*

---

# 🚗 VehicleVault v2.0.0 — Official Production Release

**VehicleVault v2.0.0** is a complete, privacy-first, self-hosted vehicle lifecycle, fuel & EV charging, AI maintenance invoice translator, tire management, fiscal trip registration, digital glovebox, and Total Cost of Ownership (TCO) platform.
