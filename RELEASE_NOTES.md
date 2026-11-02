> 🤖 **Note:** *Official Release Notes for VehicleVault v3.0.0 — Architecture & Codebase Modernization.*

---

# 🚀 VehicleVault v3.0.0 — Architecture & Codebase Modernization

**VehicleVault v3.0.0** is focused strictly on enterprise architecture foundations, standard library adoptions, and decoupling oversized monolithic files into modular, maintainable single-responsibility components according to strict software engineering standards.

---

## ✨ Architectural Foundations & Standard Libraries in v3.0

### 🏗️ Gestructureerde Logging met Pino
- **High-Performance JSON Logger:** Geïntegreerd in Express middleware (`httpLogger`) en controllers.
- **Request-ID & Correlation:** Elke API-request krijgt een unieke correlation ID voor foutdiagnose.
- **Automatische Redaction:** Gevoelige velden (wachtwoorden, sessiecookies, API-tokens, autorisatieheaders) worden automatisch gemaskeerd in alle loguitvoer.

### ⏱️ Betrouwbare Achtergrondtaken met ToadScheduler
- **In-Process Job Runner:** Vervangt handmatige, foutgevoelige `setInterval()` timers voor gecontroleerde taaklevenscycli.
- **Geïsoleerde Taakplanning:** Periodieke achtergrondcontroles (zoals document-expiraties en onderhoudswaarschuwingen) met graceful start/stop en foutisolatie.

### 🛡️ Runtime API Boundary Validation met Zod
- **Strikte Schema Validatie:** Request body en query parameters worden gevalideerd via herbruikbare Zod-middleware (`validateBody`, `validateQuery`) voordat ze controllers bereiken.
- **Consistente Foutrespons:** Automatische 400 Bad Request responses met gedetailleerde issue-arrays bij ongeldige payloads.

### ⚡ Client-Side Data Caching met TanStack Query (React Query)
- **Asynchrone Data Provider:** `QueryClientProvider` geïntegreerd in de root van de frontend applicatie als fundament voor het ontmantelen van boilerplate `useEffect` en `useState(loading)` in datarijke pagina's.

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

# 🚗 VehicleVault v2.0.0 — Official Production Release

**VehicleVault v2.0.0** is a complete, privacy-first, self-hosted vehicle lifecycle, fuel & EV charging, AI maintenance invoice translator, tire management, fiscal trip registration, digital glovebox, and Total Cost of Ownership (TCO) platform.
