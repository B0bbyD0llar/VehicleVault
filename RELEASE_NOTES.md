> 🤖 **Note:** *This is an AI-generated release note summarizing the release (`v3.2.1`) of VehicleVault.*

---

# 🚗 VehicleVault v3.2.1 — Reverse Proxy SSO Auto-Session & Settings Toggle Fix

**VehicleVault v3.2.1** is a critical stability patch resolving issues with reverse proxy single sign-on (SSO) and settings management:

- **Reverse Proxy SSO Full Session Issuance:** Fixed an issue where visiting VehicleVault through Pangolin or other reverse proxies recognized the user on `/api/auth/status` but did not issue an application access token. VehicleVault now generates a full JWT access token and secure session cookie upon reverse proxy header recognition, ensuring users are seamlessly logged into their dashboard without seeing a redundant login screen.
- **Admin Settings SSO Switch Fix:** Fixed a bug where the Reverse Proxy SSO toggle in **Settings → Users** could not be turned off when container environment defaults were present. The database setting now takes absolute priority over environment defaults, allowing the toggle to switch on and off cleanly.
- **Robust Subnet & Header Compatibility:** Enhanced IP normalization for IPv4-mapped IPv6 addresses (`::ffff:`), Carrier-Grade NAT (CGNAT), Tailscale, and Pangolin Gerbil tunnels (`100.64.0.0/10`), and expanded support for both email and username header matching.
- **228/228 Automated Tests Passing:** 100% test coverage with dedicated test suites for proxy authentication and security hardening.

---

> 🤖 **Note:** *This is an AI-generated release note summarizing the release (`v3.2.0`) of VehicleVault.*

---

# 🚗 VehicleVault v3.2.0 — Self-Hosted Community Release, 1-Click Guest Sandbox, Reverse Proxy SSO & Cockpit Telemetry HUD

**VehicleVault v3.2.0** is a major community and accessibility release designed for self-hosters and public demonstrations. This version introduces **1-Click Guest & Proef Sandbox Mode** (enabling new users to test-drive VehicleVault in an isolated sandbox and convert to a permanent account with one click), **Hardened Reverse Proxy SSO with an Admin UI Toggle** (supporting Pangolin, Authelia, Authentik, and Traefik with loopback and private CIDR protection), **Adaptive Theme & Language Auto-Detection** (zero-flash dark/light mode following system preference, and automatic Dutch/English browser localization), an animated **Cockpit Telemetry HUD**, and high-precision **Recurring Fixed Costs** calculations.

---

### 🌟 1. 1-Click Guest & Proef Sandbox Mode
- **Zero-Barrier Trial Sandbox:** Visitors can explore VehicleVault immediately via **`Probeer Proefmodus (1-Click)`** on the login screen or by opening any URL with `?guest=1`, `?proef=1`, `?invite=...`, or `?token=...`.
- **Full-Featured Sandbox Session:** Guest users can add test vehicles, log fuel fill-ups, scan receipts and invoices, configure tire sets, and explore TCO analytics in their own isolated sandbox.
- **1-Click Permanent Account Conversion:** A persistent, non-intrusive floating trial banner allows guests to preserve everything they created. Clicking **`Bewaar Mijn Account`** prompts for an email and password and instantly converts the guest session into a permanent user account without data loss.
- **Admin Control:** Administrators can enable or disable guest trial access with a toggle in **Settings → Users** or via the `ALLOW_GUEST_ACCESS=false` environment variable.

---

### 🛡️ 2. Hardened Reverse Proxy SSO & Header Authentication
- **Full Compatibility with Self-Hosted Gateways:** Native support for **Pangolin**, **Authelia**, **Authentik**, **Traefik Forward-Auth**, and **Cloudflare Access** using standard authentication headers (`Remote-Email`, `X-Forwarded-Email`, `Remote-User`, `X-Pangolin-User`).
- **Dedicated Admin UI Toggle:** Reverse Proxy SSO can now be toggled on or off directly from the web UI under **Settings → Gebruikers & Toegang** (or configured via `ENABLE_PROXY_AUTH`).
- **Loopback & RFC 1918 Private CIDR Verification:** VehicleVault validates that incoming requests containing proxy headers originate strictly from trusted loopback (`127.0.0.1`, `::1`) or private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). Public clients cannot inject spoofed headers.
- **Coexistence with Direct Login:** Local password sign-ins, passkeys, and guest trials continue to work harmoniously alongside reverse proxy SSO.

---

### 🎨 3. Adaptive Visitor Experience (Theme & Language Auto-Detection)
- **Zero-Flash System Theme:** Automatically detects the visitor's operating system and browser preference (`prefers-color-scheme`). Dark mode or light mode is activated instantly before page render, eliminating white/dark screen flashes.
- **Smart Browser Language Localization:** Automatically inspects `navigator.language` and `navigator.languages`. Dutch visitors are greeted in **Nederlands (`nl`)**, while international visitors automatically receive the interface in **English (`en`)**.
- **Persistent Manual Override:** Any explicit user selection via the theme switcher or language flag toggle is saved in `localStorage` and respected across sessions.

---

### 🏎️ 4. Cockpit Telemetry HUD & Modern Login UI
- **Animated Instrument Cluster:** A sleek, responsive SVG telemetry HUD on the authentication screen showcasing live animated speed, RPM gauge, fuel meter, and vehicle diagnostics.
- **Bilingual Visual Labels:** All cockpit HUD visual readouts, speed indicators, and fuel levels dynamically translate in real time between Dutch and English.
- **Glassmorphic Authentication Card:** Polished, responsive card design featuring tabbed switching between standard email/password login, passkey biometric sign-in, and 1-click guest trial access.

---

### 💸 5. High-Precision Recurring Fixed Costs Engine
- **Ownership-Bound Calculations:** Recurring fixed expenses (road tax, insurance, roadside assistance, subscriptions) are now strictly calculated from the date of active vehicle ownership, preventing pre-ownership months from skewing monthly and annual TCO metrics.
- **Accurate Monthly Allocation:** Accurately apportions quarterly and annual fees across exact active vehicle ownership months.

---

### 🧪 6. Verified Quality & Rock-Solid Architecture
- **224/224 Automated Tests Passing:** Comprehensive test suite covering Better-Auth, Drizzle ORM, Zod validation, Guest Mode, Proxy Auth, Document AI, Fuelio multi-section imports, Web Push (VAPID), and TCO calculations.
- **Strict Architecture Limit (< 300 Lines per File):** 100% of codebase files strictly adhere to the Single Responsibility Principle and the master-engineer `< 300 lines` threshold.
- **Node.js 24 LTS & React 19:** Powered by the latest long-term support runtime and modern web standards.

---

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
  - Decomposed into `DocumentListView.tsx`, `DocumentUploadModal.tsx`, `DocumentEditModal.tsx`, `DocumentHeaderControls.tsx`, and `useDocumentOperations.ts`.
- **Vehicles Management (`Vehicles.tsx`):**
  - Reduced from >450 lines to **217 lines**.
  - Decomposed into `VehicleCard.tsx`, `VehicleBasicSpecsFields.tsx`, `VehiclePurchaseAndApkFields.tsx`, `VehicleModal.tsx`, `VehicleShareModal.tsx`, `useVehicleForm.ts`, and `useVehicleShare.ts`.
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
    - `guestAuthController.ts`: 1-click isolated guest sandbox access and account conversion.
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
