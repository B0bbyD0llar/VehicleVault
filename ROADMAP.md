# VehicleVault — Roadmap & Planned Features

Dit document bevat de gerealiseerde mijlpalen en geplande features voor toekomstige releases van **VehicleVault**.

---

## ✅ Gerealiseerd in v3.0 (Enterprise Architecture & Milestone Features)

1. ✅ **Remmen-status per Wielhoek (`Brakes Tracking`):**
   - Dikte van remblokken (mm) en conditie van remschijven per wielhoek (LV, RV, LA, RA).
   - Visuele statuskleuren (Groen, Oranje, Rood) en volledige meetgeschiedenis.
   - Slimme automatische prompt tijdens de seizoensgebonden bandenwissel.
2. ✅ **Caravan / Aanhanger modus (`is_towing`):**
   - Keuzeoptie bij tanken/laden met dynamische splitsing van het gemiddelde verbruik (Solo vs. Aanhanger).
   - Filter-toggle in brandstoflijst en TCO-berekening.
3. ✅ **Bandenbeheer: Aanschafprijs & Factuurkoppeling:**
   - Registratie van aanschafprijs (`purchase_price`), aanschafdatum en directe koppeling naar aankoopfactuur in Documenten.
4. ✅ **Garage-brede Vloot / Fleet Analytics:**
   - Geaggregeerde weergave voor alle voertuigen in de garage in `Rapportages & TCO`.
   - Vlootkosten per km en vergelijking over categorieën en voertuigen.
5. ✅ **Universele Telemetrie & Kilometerstand Webhook:**
   - Modern REST webhook endpoint (`POST /api/integrations/telemetry/odometer`) met `x-api-key` of Bearer auth voor Home Assistant, OBD2 (WiCAN/Torque), Apple Shortcuts en Tasker.
6. ✅ **Enterprise Architectuur:**
   - Gestructureerde JSON logging met Request IDs via **Pino**.
   - Betrouwbare in-process achtergrondtaakplanner via **ToadScheduler**.
   - Strikte runtime API validatie via **Zod**.
   - Frontend state caching en data-fetching via **TanStack React Query**.
7. ✅ **Mijn Profiel & Systeeminstellingen Opsplitsing:**
   - Volledige scheiding tussen persoonlijke beveiligingsinstellingen (Passkeys, 2FA, voorkeuren) en systeembeheer.
8. ✅ **Tolvignetten & Milieustickers als Apart Menu:**
   - Zelfstandig navigatie-item voor vignetten en milieustickers met verloopwaarschuwingen.
9. ✅ **Fuelio Multi-Section Import:**
   - Volledige parsing van Fuelio CSV-bestanden met automatische deduplicatie.

---

## 🔮 Gepland voor v3.1+

### 1. Offline PWA Synchronisatie & Lokale Opslag
- **Doel:** Tankbonnen scannen en tankbeurten invoeren op plekken zonder mobiel bereik (bijv. in parkeergarages of buitenlandse bergpassen).
- **Oplossing:** Service Worker caching met IndexedDB queue die automatisch synchroniseert zodra er weer een netwerkverbinding is.

### 2. Live OBD2 Telemetrie & Foutcodes (DTC Scanner)
- **Doel:** Directe verwerking van OBD2 foutcodes (Check Engine Light) en live voertuigdiagnose via gekoppelde telemetrie-dongles.
- **Oplossing:** Inlezen van DTC codes met automatische vertaling en advies voor te inspecteren onderdelen.

### 3. AI Voorspellend Onderhoud & Kostenprognose
- **Doel:** Proactieve waarschuwingen op basis van rijpatronen en voertuigleeftijd/kilometerstand.
- **Oplossing:** Machine learning / statistische regressie om onderhoudsbeurten en bandenvervangingen tijdig in te plannen en budgetteren.

---

## 🏛️ Reeds Gerealiseerd in v2.0 & v2.1
- ✅ **Passkeys (WebAuthn):** Direct inloggen via TouchID / FaceID / Windows Hello / YubiKey.
- ✅ **OIDC / SSO (OpenID Connect):** Koppel externe identity providers zoals Authentik, Keycloak, Authelia, Cloudflare Access of Google Workspace inclusief connection testing.
- ✅ **2FA (TOTP):** Twee-factor authenticatie met authenticator apps en eenmalige noodherstelcodes.
- ✅ **Documentbeheer:** In-line aanpassen van factuurdatum, titel, categorie en notities met datumsortering.
- ✅ **Native Web Push (VAPID):** Directe browser/PWA push-notificaties zonder externe clouddiensten.
- ✅ **E-mail & SMTP/Graph Integraties:** 1-klik presets voor Gmail, Microsoft 365, Graph API en device code login.
- ✅ **Smart AI Facturen:** Automatische vertaling van buitenlandse garagefacturen met uitsplitsing naar onderdelen en arbeid.
