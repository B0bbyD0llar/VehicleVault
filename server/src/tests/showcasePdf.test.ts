import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PDFDocument as PdfLibDocument } from 'pdf-lib';
import { ShowcasePdfService } from '../services/showcasePdfService.js';
import { CompiledShowcase } from '../services/showcaseService.js';
import { DATA_PATHS } from '../config/env.js';

describe('ShowcasePdfService', () => {
  const tempFiles: string[] = [];

  after(() => {
    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch {}
      }
    }
  });

  it('generates a valid multi-page PDF sales dossier including embedded photos (JPEG & WebP)', async () => {
    fs.mkdirSync(DATA_PATHS.vehicles, { recursive: true });

    const photo1Name = `test-showcase-1-${Date.now()}.jpg`;
    const photo2Name = `test-showcase-2-${Date.now()}.webp`;
    const photo1Path = path.join(DATA_PATHS.vehicles, photo1Name);
    const photo2Path = path.join(DATA_PATHS.vehicles, photo2Name);

    await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 37, g: 99, b: 235 } },
    })
      .jpeg()
      .toFile(photo1Path);

    await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 16, g: 185, b: 129 } },
    })
      .webp()
      .toFile(photo2Path);

    tempFiles.push(photo1Path, photo2Path);

    const showcase: CompiledShowcase = {
      id: 'sc-1',
      vehicle_id: 'veh-1',
      public_slug: 'kia-niro-test',
      is_active: true,
      asking_price: 19950,
      price_label: 'Vraagprijs',
      title: 'Kia Niro 1.6 GDi Hybrid',
      subtitle: 'Dealeronderhouden & volledige historie',
      highlights: [
        { id: 'h1', icon: 'shield', title: 'NAP Logisch', description: 'Aantoonbare kilometerstand' },
      ],
      options_list: [
        { category: 'Comfort', items: ['Climate Control', 'Stoelverwarming'] },
      ],
      transparency_notes: 'Altijd netjes warm gereden.',
      contact_whatsapp: '+31612345678',
      contact_phone: '06-12345678',
      contact_email: 'verkoper@example.com',
      contact_location: 'Utrecht',
      show_maintenance_history: true,
      show_tire_status: true,
      show_rdw_specs: true,
      vehicle: {
        id: 'veh-1',
        name: 'Kia Niro',
        type: 'car',
        license_plate: 'NBL41K',
        vin: 'KNACC81CG...',
        year: 2020,
        make: 'KIA',
        model: 'NIRO',
        fuel_type: 'Hybrid',
        transmission: 'Automaat',
        current_odometer: 70237,
        apk_expiration_date: '2027-10-31',
      },
      stats: {
        bouwjaar: '2020',
        kilometerstand: '70.237 km',
        brandstof_transmissie: 'Hybride Automaat',
        vermogen: '104 kW / 141 pk',
        apk_vervaldatum: '31-10-2027',
        apk_status: 'Geldig',
        energielabel: 'A',
        nap_oordeel: 'Logisch',
      },
      photos: [
        {
          id: 'p1',
          vehicle_id: 'veh-1',
          file_path: photo1Name,
          category: 'exterieur',
          title: 'Voorzijde',
          description: 'Keurige lakstaat',
          sort_order: 1,
          is_primary: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 'p2',
          vehicle_id: 'veh-1',
          file_path: photo2Name,
          category: 'interieur',
          title: 'Dashboard',
          description: 'Netjes interieur',
          sort_order: 2,
          is_primary: 0,
          created_at: new Date().toISOString(),
        },
      ],
      specs: {
        basis: [{ label: 'Kenteken', value: 'NB-L41-K' }],
        motor: [{ label: 'Transmissie', value: 'Automaat' }],
        milieu: [{ label: 'Energielabel', value: 'A' }],
      },
      maintenance_records: [
        { date: '2026-05-10', odometer: 65000, category: 'Grote beurt', description: 'Olie + filters', has_invoice: true },
      ],
      tires: {
        name: 'Michelin CrossClimate 2',
        season: 'all-season',
        tread_depth_fl: 6.2,
        tread_depth_fr: 6.1,
        tread_depth_rl: 6.5,
        tread_depth_rr: 6.4,
      },
    };

    const pdfBuffer = await ShowcasePdfService.generatePdf(showcase);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.equal(pdfBuffer.subarray(0, 5).toString('latin1'), '%PDF-');

    const parsed = await PdfLibDocument.load(pdfBuffer);
    assert.ok(parsed.getPageCount() >= 2, 'Expected at least 2 pages (details + photo gallery)');
  });
});
