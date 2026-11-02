> 🤖 **Note:** *This is an AI-generated release note summarizing the release (`v3.0.0`) of VehicleVault.*

---

# 🚗 VehicleVault v3.0.0 — Modulaire Architectuur & Beproefde Protocollen

**VehicleVault v3.0.0** is een grote architecturale mijlpaal gericht op schaalbaarheid, onderhoudbaarheid en robuustheid. Grote monolithische bronbestanden zijn opgedeeld in modulaire componenten en services volgens het Single Responsibility Principle (<300 regels per bestand), en handgeschreven mechanismen zijn vervangen door beproefde standaarden en bibliotheken.

### 🏛️ Modulaire Decompositie & Refactoring
Alle omvangrijke frontend pagina's en backend services zijn ontkoppeld en ondergebracht in gespecialiseerde modules:
- **Instellingen (`Settings.tsx`):** Opgesplitst van >3.000 regels naar een compacte orchestrator (162 regels) met 7 modulaire tabbladen (`GeneralTab`, `VehiclesTab`, `UsersTab`, `ApiKeysTab`, `NotificationsTab`, `AiTab`, `BackupsTab`).
- **Brandstoflogboek (`FuelLog.tsx`):** Opgesplitst van >2.000 regels naar modulaire componenten (`FuelEntryForm`, `FuelHistoryTable`, `FuelEditModal`).
- **Onderhoud & Beurten (`Maintenance.tsx`):** Opgesplitst van >1.900 regels naar `IntervalCardsGrid`, `ServiceRecordsTable`, `ServiceRecordModal`, `IntervalModal` en `ServiceDetailsModal`.
- **Bandenbeheer (`Tires.tsx`):** Opgesplitst van >1.300 regels naar `MountedTireCard`, `TireSetCard`, `TireSetModal`, `TireSwapModal` en `TireTreadModal`.
- **TCO & Wagenpark Analyse (`AnalyticsTco.tsx`):** Opgesplitst van >1.300 regels naar `TcoFilters`, `FleetAnalyticsView`, `VehicleKpiCards`, `VehicleMonthlyTable`, `VehicleFuelPriceStats` en `VehicleTankDistanceStats`.
- **Ritregistratie (`Trips.tsx`):** Opgesplitst van >900 regels naar `TripSummaryCards`, `TripTable`, `TripModal` en `TripExportDropdown`.
- **Voertuigen, Documenten & Vaste Lasten:** Gesplitst in herbruikbare dialoog-, kaart- en tabelmodules (`client/src/components/vehicles`, `documents`, `expenses`).
- **AI Factuurherkenning (`aiReceiptService.ts`):** Opgesplitst in modulaire providers (`geminiProvider`, `openAiProvider`, `ocrNormalizer`, `aiSettings`).
- **Authenticatie Controller (`authController.ts`):** Opgesplitst in 4 sub-controllers (`authSessionController`, `authPasswordResetController`, `authApiKeyController`, `userManagementController`).

### 🛡️ Beproefde Protocollen & Bibliotheken
Handgeschreven logica en aangepaste routines zijn vervangen door industriestandaarden:
- **Better-Auth Authenticatie:** Volledig gemount en geconfigureerd met SQLite Drizzle-adapter op `/api/auth/v3/*` met behoud van naadloze backwards-compatibiliteit.
- **Drizzle ORM Integratie:** Type-safe database mapping en Drizzle client (`drizzle-orm/sqlite-proxy`) bovenop de bestaande SQLite WAL connectie.
- **Pino Structured Logger:** Gestructureerde JSON high-performance logging en HTTP request logging via `pino-http` ter vervanging van ad-hoc console loggers.
- **ToadScheduler Taakplanner:** Robuuste in-process taakplanner voor periodieke inspectie van APK-verloopdatums, documenten, bandenwissels en onderhoudsintervallen.
- **Zod Schema Validatie:** Declaratieve runtime validatie van API-payloads en configuraties met automatische type-inferentie.

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
