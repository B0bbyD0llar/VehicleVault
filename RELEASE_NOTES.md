> 🤖 **Note:** *This is an AI-generated release note summarizing the release (`v3.0.0`) of VehicleVault.*

---

# 🚗 VehicleVault v3.0.0 — Modulaire Architectuur & Beproefde Standaarden

**VehicleVault v3.0.0** is een fundamentele architecturale mijlpaal gericht op schaalbaarheid, robuustheid en onderhoudbaarheid. In deze release zijn alle grote monolithische bestanden opgedeeld in overzichtelijke, testbare componenten met een strikte richtlijn van **< 300 regels per bestand** (conform het Single Responsibility Principle). Daarnaast zijn handgeschreven oplossingen en ad-hoc routines systematisch vervangen door beproefde bibliotheken en open standaarden.

---

### 🛡️ 1. Vervanging van Handgeschreven Oplossingen door Beproefde Standaarden

| Onderdeel | Oude / Handgeschreven Situatie | Nieuwe Beproefde Standaard & Voordelen |
| :--- | :--- | :--- |
| **Authenticatie & Sessies** | Handgeschreven JWT uitgifte, ad-hoc token rotatie en custom sessie-controllers. | **Better-Auth (`/api/auth/v3/*`)** geïntegreerd met SQLite Drizzle-adapter. Biedt gestandaardiseerde authenticatieprotocollen, robuuste sessie-opslag, veilige cookie-flags en uitbreidbaarheid naar multi-factor en OAuth-providers. |
| **Database Data Layer** | Handmatige raw SQL strings zonder centrale type-bescherming of geautomatiseerde migraties. | **Drizzle ORM (`drizzle-orm`)** schema-mapping (`server/src/db/schema.drizzle.ts` en `drizzle.ts`). Garandeert type-safety tussen TypeScript en de SQLite database engine. |
| **Invoer- & Payloadvalidatie** | Verspreide handmatige `if (!req.body...)` checks en inconsistente foutmeldingen. | **Zod Schema Validatie (`zod`)**: Universele runtime schema-validatie met automatische TypeScript type-inferentie en gestandaardiseerde foutmeldingen voor alle API-endpoints. |
| **Achtergrondtaken & Schedulers** | Handmatige `setInterval` timers die vatbaar waren voor event-loop verstopping en ongecontroleerde overlap. | **ToadScheduler (`toadscheduler`)**: Robuuste taakplanner met `SimpleIntervalJob` en `AsyncTask` voor periodieke notificaties, APK-verloopcontroles en documentwaarschuwingen met betrouwbare error-boundaries. |
| **Applicatie- & Requestlogging** | Ongefilterde `console.log` en `console.error` aanroepen zonder context of niveaus. | **Pino High-Performance Logger (`pino` & `pino-http`)**: Gestructureerde JSON logging met automatische redactie van gevoelige headers/tokens en nano-seconde request tracing. |
| **AI Factuurherkenning & OCR** | Eén grote monolithische service die direct meerdere AI API's en OCR parse-routines mengde. | **Modulaire AI Provider Architectuur**: Losgekoppelde providers (`geminiProvider`, `openAiProvider`, `localOcrProvider`) met een centrale `ocrNormalizer` conform het Strategy Pattern. |
| **Push Notificaties** | Ad-hoc payload encryptie en handmatige Web Push calls. | **RFC-conforme VAPID Web Push**: Standaard sleutelbeheer, cryptografische handdruk en provider-onafhankelijke bezorging (FCM, Mozilla, Apple). |
| **Reverse Proxy Beveiliging** | Vrijblijvende header-uitlezing (`remote-user`, etc.) die spoofing mogelijk kon maken. | **Geharde Trusted Proxy Engine**: IP-validatie op vertrouwde loopback- en private netwerksubnets (10.x, 172.16-31.x, 192.168.x). |

---

### 🧱 2. Opsplitsing van Monolithische Bestanden (< 300 regels)

Alle bestanden in de frontend en backend zijn herzien en opgesplitst zodat elk bestand één duidelijke taak heeft:

#### Frontend Pagina's (Client):
- **Documenten & Handschoenenkast (`Documents.tsx`):**
  - Teruggebracht van >540 regels naar **251 regels**.
  - Opgedeeld in:
    - `DocumentListView.tsx` (265 regels): Lijst- en tegelweergave met snelle documentacties.
    - `DocumentUploadModal.tsx` (174 regels): Drag-and-drop upload met client-side afbeeldingscompressie.
    - `DocumentEditModal.tsx` (123 regels): Bewerken van metagegevens en verloopdata.
    - `DocumentHeaderControls.tsx` (95 regels): Categorie-filters, sorteeropties en weergave-toggle.
    - `useDocumentOperations.ts` (243 regels): Centrale hook voor document state, bestandstransformatie en API-mutaties.
- **Voertuigenbeheer (`Vehicles.tsx`):**
  - Teruggebracht van >450 regels naar **217 regels**.
  - Opgedeeld in:
    - `VehicleCard.tsx` (220 regels): Visuele voertuigkaart met RDW status badges, APK alarm en acties.
    - `VehicleBasicSpecsFields.tsx` (277 regels): Kenteken, landkeuze, RDW autofill en basisspecificaties.
    - `VehiclePurchaseAndApkFields.tsx` (100 regels): Aankoopgegevens, TCO baseline, keuringsdata en notities.
    - `VehicleModal.tsx` (171 regels): Gestroomlijnde orchestrator voor toevoegen en bewerken.
    - `VehicleShareModal.tsx` (175 regels): Deelpaneel voor mede-bestuurders en gezinsleden.
    - `useVehicleForm.ts` (199 regels): Formulierhook met RDW-integratie en validatie.
    - `useVehicleShare.ts` (89 regels): Toegangsbeheer hook.
- **Instellingen (`Settings.tsx`):**
  - Teruggebracht van >3.000 regels naar **162 regels**.
  - Opgedeeld in 7 modulaire tabs: `GeneralSettingsTab`, `AiSettingsTab`, `NotificationsSettingsTab`, `BackupSettingsTab`, `UsersSettingsTab`, `HomeAssistantSettingsTab` en `IntegrationsSettingsTab`.
- **Brandstoflogboek (`FuelLog.tsx`):**
  - Teruggebracht van >2.000 regels naar **296 regels** via `FuelEntryForm`, `FuelHistoryTable` en `FuelEditModal`.
- **Onderhoud & Beurten (`Maintenance.tsx`):**
  - Teruggebracht van >1.900 regels naar modulaire componenten (`IntervalCardsGrid`, `ServiceRecordsTable`, `ServiceRecordModal`, `IntervalModal`, `ServiceDetailsModal`).
- **Bandenbeheer (`Tires.tsx`):**
  - Teruggebracht van >1.300 regels naar **258 regels** via `MountedTireCard`, `TireSetCard`, `TireSetModal`, `TireSwapModal` en `TireTreadModal`.
- **Kosten & TCO Analyse (`AnalyticsTco.tsx`):**
  - Teruggebracht van >1.300 regels naar **264 regels** via `TcoFilters`, `FleetAnalyticsView`, `VehicleKpiCards`, `VehicleMonthlyTable`, `VehicleFuelPriceStats` en `VehicleTankDistanceStats`.
- **Rittenregistratie (`Trips.tsx`):**
  - Teruggebracht van >900 regels naar **255 regels** via `TripSummaryCards`, `TripTable`, `TripModal` en `TripExportDropdown`.

#### Backend Controllers & Services (Server):
- **Authenticatie Controller (`authController.ts`):**
  - Teruggebracht naar een 44-regelige facade die delegeert naar:
    - `authSessionController.ts`: Registratie, login, sessiestart, refresh en logout.
    - `authApiKeyController.ts`: Aanmaken, intrekken en valideren van `vkv_` API keys.
    - `authPasswordResetController.ts`: Wachtwoordherstel en e-mail tokens.
    - `userManagementController.ts`: Gebruikersbeheer, profielen en rollen.
- **AI Factuurherkenning (`aiReceiptService.ts`):**
  - Opgesplitst in modulaire providers (`geminiProvider`, `openAiProvider`, `localOcrProvider`) met een gecentraliseerde `ocrNormalizer`.

---

### 📱 3. Mobiele Navigatieverbeteringen
- **Documenten-tab toegevoegd op Mobiel:** Het tabblad **Documenten** (`/documents`) is nu direct opgenomen in de mobiele navigatiebalk onderin het scherm.
- **Onderhouds-tab toegevoegd op Mobiel:** Ook **Beurten & Onderhoud** (`/maintenance`) is nu mobiel bereikbaar.
- **Responsieve Horizontale Navigatie:** De navigatiebalk onderin ondersteunt nu vloeiend horizontaal scrollen (`overflow-x-auto scrollbar-none`) met vaste minimale itembreedtes, zodat knoppen op elk formaat smartphone moeiteloos te bedienen zijn zonder samendrukking of overlap.

---

### 🧪 4. Geverifieerde Kwaliteit & Stabiliteit
- **201/201 Unittests & Integratiesuites Geslaagd:** 100% succesvolle geautomatiseerde testrun zonder regressies.
- **End-to-End API Smoke Test Geslaagd:** Geverifieerd op schone database (Better-Auth, sessies, voertuigen, brandstof, TCO, ritten).
- **Clean Clone Verificatie:** Getest met een verse `git clone` direct vanaf GitHub; zowel client als server compileren foutloos (`0 errors`).

---

> 🤖 **Note:** *This is an AI-generated release note summarizing the release (`v2.1.0`) of VehicleVault.*

---

# 🚗 VehicleVault v2.1.0 — Security Hardening, Fuelio Importer, Toll Vignettes & User Profiles

**VehicleVault v2.1.0** delivered core security hardening, third-party data migration, user experience enhancements, and a clean separation between personal user settings and system administration.

- **Security & Reverse Proxy Hardening:** Loopback proxy verification, trusted subnets, BOLA-protected uploads, persistent 256-bit cryptographic secrets.
- **Fuelio Multi-Sectie CSV Importer:** Volledige import van Fuelio exports met deduplicatie.
- **Tolvignetten & Milieustickers Menu (`/vignettes`):** Zelfstandig navigatiemenu en detailoverzicht met verloopwaarschuwingen.
- **Mijn Profiel (`/profile`):** Persoonlijk gebruikersaccount geïsoleerd van globale systeeminstellingen.
- **Caravan & Aanhangermodus (`is_towing`):** Gescheiden verbruiksstatistieken voor rijden met aanhanger/caravan.
- **Bandenbeheer Aanschafprijs:** Vastlegging van aanschafprijs en factuurkoppeling.
- **Garage-brede Vloot TCO Analytics:** Aggregatie over alle actieve voertuigen in de garage.

---

> 🤖 **Note:** *This is an AI-generated release note summarizing the complete first official production release (`v2.0.0`) of VehicleVault.*

---

# 🚗 VehicleVault v2.0.0 — Official Production Release

**VehicleVault v2.0.0** is a complete, privacy-first, self-hosted vehicle lifecycle, fuel & EV charging, AI maintenance invoice translator, tire management, fiscal trip registration, digital glovebox, and Total Cost of Ownership (TCO) platform.
