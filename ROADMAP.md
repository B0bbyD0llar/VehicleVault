# VehicleVault — Roadmap & Architecture Modernization

Dit document bevat de gerealiseerde mijlpalen en geplande architectuurmoderniseringen voor **VehicleVault**.

---

## 🏛️ Doelstellingen v3.0: Architectuur & Standaardbibliotheken Modernisering

In versie 3.0 transformeren we VehicleVault naar een modulaire, enterprise-grade architectuur conform de Master Engineer richtlijnen (Separation of Concerns, Single Responsibility Principle, soft review trigger bij ~300 regels):

### 1. Opdelen van Grote Monolithische Bestanden in Eigen Bestanden
- **`client/src/pages/Settings.tsx` (2.800+ regels):**
  - Opsplitsen in onafhankelijke deelcomponenten per beheer-tab (`GeneralSettings`, `BackupSettings`, `HaSettings`, `NotificationSettings`, `OidcSettings`).
- **`client/src/pages/Maintenance.tsx` (1.800+ regels):**
  - Uitsplitsen in aparte dialoogvensters, formulieren en statuscomponenten.
- **`client/src/pages/FuelLog.tsx` (1.800+ regels):**
  - Uitsplitsen in invoerformulieren, grafieken en tabelweergaven.
- **`server/src/services/aiReceiptService.ts` (1.150+ regels):**
  - Uitsplitsen in OCR preprocessing, LLM provider integraties (Gemini / OpenAI) en respons-normalizers.
- **`server/src/controllers/authController.ts` (580+ regels):**
  - Vervangen / opdelen naar Better-Auth handlers en data-access repositories.

### 2. Toepassing van Beproefde Standaardbibliotheken
1. ✅ **Pino Structured Logger:** Hoge performantie JSON logging met Request-IDs en gevoelige veld-redactie.
2. ✅ **ToadScheduler:** In-process taakplanner voor achtergrondcontroles zonder error-prone timers.
3. ✅ **Zod Boundary Validation:** Strikte runtime type- en payloadvalidatie aan de Express API-poort.
4. ✅ **TanStack Query (React Query):** Geïntegreerde asynchrone cache- en data-fetching provider.
5. ⏳ **Better-Auth:** Vervangen van handgemaakte JWT, sessies, cookies, WebAuthn en TOTP door het geauditeerde Better-Auth framework.
6. ⏳ **Drizzle ORM:** Type-safe database queries en automatische schema-migraties ter vervanging van rauwe SQL strings.
7. ⏳ **React Hook Form + Zod Resolvers:** Gestroomlijnde formulier-state zonder tientallen losse `useState` variabelen per pagina.

---

## ✅ Reeds Gerealiseerd in v2.0 & v2.1
- ✅ **Mijn Profiel (`/profile`) vs. Systeembeheer (`/settings`):** Persoonlijk gebruikersprofiel gescheiden van globale serverinstellingen.
- ✅ **Tolvignetten & Milieustickers Menu (`/vignettes`):** Zelfstandig navigatiemenu en overzicht met verloopdata en documentkoppelingen.
- ✅ **Fuelio Multi-Sectie CSV Import:** Volledige import van Fuelio exports inclusief deduplicatie.
- ✅ **Caravan & Aanhanger Modus (`is_towing`):** Gescheiden verbruiksstatistieken voor rijden met last.
- ✅ **Bandenbeheer Aanschafprijs:** Registratie van aanschafprijs en factuurkoppeling.
- ✅ **Garage-brede Vloot TCO Analytics:** Aggregatie over alle voertuigen in de garage.
- ✅ **Passkeys (WebAuthn) & 2FA (TOTP):** Direct inloggen via biometrie/hardware keys en authenticator apps.
- ✅ **OIDC / SSO (OpenID Connect):** Koppel externe identity providers zoals Authentik, Keycloak, Authelia of Google Workspace.
- ✅ **Native Web Push (VAPID):** Directe browser/PWA push-notificaties zonder externe clouddiensten.
- ✅ **Smart AI Facturen:** Automatische vertaling van buitenlandse garagefacturen met uitsplitsing naar onderdelen en arbeid.
