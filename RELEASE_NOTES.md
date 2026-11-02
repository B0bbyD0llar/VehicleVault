> 🤖 **Note:** *Official Release Notes for VehicleVault v3.0.0 Enterprise Architecture & Feature Modernization.*

---

# 🚀 VehicleVault v3.0.0 — Enterprise Architecture & Feature Modernization

**VehicleVault v3.0.0** is a major milestone release delivering enterprise-grade architectural foundations, enhanced multi-vehicle fleet intelligence, precision brake wear tracking, caravan/towing fuel analysis, universal vehicle telemetry, and unified user profile management.

---

## ✨ What's New in v3.0.0

### 🛑 Remmen-status per Wielhoek (`Brakes Tracking`)
- **4-Corner Millimeter Wear Tracking:** Log and inspect brake pad thickness (mm) and brake disc thickness/condition across all 4 wheels (`LV / FL`, `RV / FR`, `LA / RL`, `RA / RR`).
- **Visual Threshold Indicators:** Clear color-coded status badges:
  - 🟢 **Groen (> 4.0 mm):** Uitstekende conditie.
  - 🟠 **Oranje (3.0 – 4.0 mm):** Aandacht vereist / slijtage inspecteren.
  - 🔴 **Rood (< 3.0 mm):** Vervanging noodzakelijk.
- **Smart Seasonal Swap Prompt:** When performing a tire change in **Bandenbeheer** (e.g. Summer ↔ Winter), VehicleVault automatically presents a 1-click option to log brake measurements while wheels are unmounted.
- **Historical Measurement Log:** View historical wear progression over time and mileage.

### 🚐 Caravan- & Aanhangermodus (`is_towing`)
- **Towing Flag on Fuel & Charge Entries:** Flag fill-ups or charging sessions as driving with a caravan, trailer, bike rack, or roof box (`is_towing`).
- **Split Consumption Averages:** Fuel statistics automatically calculate and display separate consumption benchmarks:
  - **Solo:** Normaal verbruik (bijv. 1 op 18.2 / 5.5 L/100km).
  - **Met Aanhanger / Caravan:** Verbruik onder last (bijv. 1 op 11.4 / 8.8 L/100km).
- **Interactive Towing Filter:** Filter fuel history directly by towing status to keep regular benchmarks clean.

### 🛞 Bandenbeheer: Aanschafprijs & Factuurkoppeling
- **Purchase Tracking:** Record tire set purchase price (`purchase_price`) and purchase date (`purchase_date`).
- **Invoice Linkage:** Directly link garage or tire shop invoices from **Documenten** (`invoice_document_id` / `invoice_file`).
- **Pure TCO Integration:** Tire set costs are accurately accounted for in the vehicle's Total Cost of Ownership without double-counting.

### 🏢 Garage-brede Vloot- / Fleet Analytics
- **All-Vehicles TCO Dashboard:** Switch between individual vehicle analytics and an aggregated **"Hele Garage (Fleet)"** view in `Rapportages & TCO`.
- **Fleet Metrics:** Total cumulative cost across all vehicles, fleet average cost per kilometer, and breakdown across Fuel, Maintenance, Fixed Expenses, Purchase, and Vignettes.
- **Multi-Vehicle Cost Comparison:** Side-by-side comparison of expenses per vehicle for families or multi-car households.

### 📡 Universele Telemetrie & Kilometerstand Webhook
- **REST Telemetry Ingestion Endpoint:** `POST /api/integrations/telemetry/odometer` supporting secure `x-api-key: vkv_...` and Bearer token authentication.
- **Plug & Play Ecosystem Integration:** Seamlessly push live odometer readings from:
  1. **Home Assistant:** Automations triggered by Kia Uvo, Hyundai Bluelink, Tesla, BMW ConnectedDrive, etc.
  2. **OBD2 & WiCAN:** WiFi/Cellular dongles and Torque Pro / Freematics.
  3. **Apple Shortcuts & Android Tasker:** Automated logging on CarPlay or car Bluetooth disconnect.
- **Deduplication & Validation:** Rejects lower mileage readings, prevents duplicate log noise, and updates both the vehicle's odometer and fuel/trip reference points.

### 🏗️ Enterprise Architectuur & Betrouwbaarheid
- **Pino Structured Logger:** High-performance JSON logging with HTTP request metrics, correlation IDs, and automatic redaction of sensitive credentials, passwords, and tokens.
- **ToadScheduler In-Process Job Runner:** Resilient, lightweight background task scheduler replacing error-prone timers for automated alert dispatches and maintenance checks.
- **Zod Runtime API Validation:** Strict schema validation middleware guarding critical API endpoints against malformed or malicious payloads.
- **TanStack React Query Foundation:** Asynchronous client-side state caching and data synchronization layer for scalable UI responsiveness.

### ⛽ Fuelio Multi-Section Import & Streamlining
- **Complete Fuelio Compatibility:** Full support for Fuelio CSV multi-section exports (fuelings, services, categories, notes) without duplicate key errors.
- **Clean UI Layout:** Consolidated import actions under Settings and dedicated vehicle sections, avoiding unnecessary header clutter.

### 🏷️ Tolvignetten & Milieustickers Navigatie
- **Dedicated Menu Item:** Direct navigation entry for Vignettes & Environmental Badges.
- **Status Badges & Alerts:** Digital vignette tracking for Austria, Switzerland, Slovenia, Czech Republic, France (Crit'Air), and Germany (Umweltplakette) with validity alerts.

### 👤 Profiel & Beveiliging
- **Clean Account / Profile View:** Clear separation between personal profile security (Passkeys, TOTP 2FA, password, theme, language) and global administrator system settings.
- **Full Bilingual Parity:** 100% Dutch (NL) and English (EN) localization across all dialogs, notifications, and buttons.

---

# 🚗 VehicleVault v2.0.0 — Official Production Release

**VehicleVault v2.0.0** is a complete, privacy-first, self-hosted vehicle lifecycle, fuel & EV charging, AI maintenance invoice translator, tire management, fiscal trip registration, digital glovebox, and Total Cost of Ownership (TCO) platform.

---

## ✨ Highlights & Key Features (v2.0.0)

### 🛠️ Smart AI Maintenance Invoice Scanner & Automatic Translator
- **Foreign & Local Invoice Extraction:** Upload any garage invoice (PDF or photo) in German, French, English, or Dutch. Powered by **Google Gemini Vision** or **OpenAI Vision**, VehicleVault automatically extracts and translates the service title, notes, and every individual **part and labor line item** into your configured language (`NL` or `EN`).
- **VAT / MwSt Reconciliation:** Automatically reconciles net vs. gross line item totals (e.g., 19% German MwSt or 21% Dutch VAT) into accurate Parts and Labor cost splits.
- **Garage Address & Google Maps Link:** Extracts the performing workshop's name and full address, linking directly to Google Maps in your service passport.
- **Dedicated Extracted Parts Modal:** View all translated parts, labor entries, quantities, and original foreign descriptions in a clean modal dialog.
- **Multi-Interval Reset Checkboxes:** Link and reset multiple maintenance intervals simultaneously from a single major service invoice (e.g., *Engine Oil* + *Brake Fluid* + *Cabin Filter* + *General Inspection*), with automatic AI interval detection.
- **Automatic Digital Glovebox Sync:** Uploaded maintenance invoices are automatically indexed under **Documenten (`Facturen & Bonnen`)** with clean `DD-MM-YYYY` dates.

### 📊 Pure Ownership TCO & Pre-Ownership History
- **Ownership & TCO Baseline:** Configure your vehicle's **Purchase Date** (auto-populated from RDW `datum_tenaamstelling`), **Initial Odometer (`Aankoopstand`)**, and **Purchase Price**.
- **Pre-Ownership Invoice Filtering:** Historical maintenance invoices dated prior to your purchase or below your purchase odometer are automatically flagged as `Vorige eigenaar (buiten TCO)`. They remain in your vehicle's complete service passport and update maintenance intervals, without inflating your personal TCO costs.
- **Recurring Fixed Expenses (`Vaste Lasten`):** Track monthly, quarterly, or annual road tax (MRB), insurance, roadside assistance, and subscriptions with dynamic TCO inclusion toggles.

### 📄 Complete PDF Vehicle Dossier Export
- **Optional Tire Set & Tread Depth Section:** Include your currently mounted tires (brand, model, size, rim size, load/speed index, DOT code, driven km, and 4-wheel tread depths in mm) directly on the PDF dossier.
- **Full-Page Merged PDF & Image Invoices:** Attached `.pdf` and image maintenance invoices are appended as full-size separate attachment pages at the end of the exported PDF dossier (`pdf-lib`) with custom identification headers.

### 🛞 Tire Set Management (`Bandenbeheer`)
- **Summer, Winter & All-Season Sets:** Track Brand, Model, Tire Size (`205/60`), Rim Size (`16"`), Load/Speed Index (`92V`), DOT code, and storage location.
- **Dynamic Live Mileage:** Automatically calculates driven kilometers on mounted tires from the vehicle's live odometer, with full manual edit support.
- **4-Wheel Tread Depth Diagram:** Visual chassis overview (`LV`, `RV`, `LA`, `RA` in mm) with legal (`< 1.6 mm`) and seasonal warning alerts.

### ⛽ Fueling, EV Charging & AI Receipt Scanner
- **AI Vision & Local Tesseract OCR:** Scan fuel receipts at the pump with automatic station name, address, liters, unit price, and total cost detection, plus nearby GPS station lookup and re-scan support.
- **PHEV & EV Support:** Log electric charging sessions (`kWh` and `€/kWh`).
- **Excel & CSV Exports:** Export fuel history to styled `.xlsx` workbooks or UTF-8 BOM CSV files.

### 🚗 Belastingdienst Fiscal Trip Logging (`Ritregistratie`)
- **Business, Commute & Private Trips:** Automatic distance calculation, 1-click return trip generation, and 1-click exports to Belastingdienst-compliant CSV, styled Excel (`.xlsx`), and landscape A4 PDF dossiers.

### 🌐 Public Sales Showcase & Standalone Website Export
- **Public Vehicle Passport (`/showcase/:slug`):** Shareable sales page with photo gallery, RDW specs, verified maintenance timeline, tire status, and WhatsApp/Phone/Email contact buttons.
- **1-Click Static Website ZIP:** Export a standalone HTML5/CSS3/JS website package ready to host on any static web server.

### 👥 Multi-User Vehicle Isolation, Sharing & RBAC
- **Strict Per-User Garage Isolation:** Each user account maintains its own private fleet by default.
- **Granular Vehicle Sharing (`vehicle_shares`):** Share individual vehicles with family members or co-drivers as **`editor`** or **`viewer`** with full access across Fuel Logs, Maintenance History & Intervals, Digital Glovebox (`Documenten`), Tire Management, Fixed Expenses, and TCO Analytics.
- **Role-Based Access Control:** Supports **`admin`**, **`user`**, and simplified mobile **`driver`** roles, plus zero-config reverse proxy SSO (`Remote-Email` / Pangolin / Authelia / Authentik).
