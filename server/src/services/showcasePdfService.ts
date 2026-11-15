import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { CompiledShowcase, ShowcaseService } from './showcaseService.js';
import { RdwService } from './rdwService.js';
import { DATA_PATHS } from '../config/env.js';

const C_NAVY = '#0f172a';
const C_BLUE = '#2563eb';
const C_SLATE = '#475569';
const C_MUTED = '#64748b';
const C_BORDER = '#e2e8f0';
const C_BG = '#f8fafc';

function cleanText(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/€/g, 'EUR ')
    .replace(/[—–]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .trim();
}

function formatDateNl(val?: string | null): string {
  if (!val) return '-';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  return s;
}

async function loadPhotoJpeg(filePath: string, maxW = 1200, maxH = 800): Promise<Buffer | null> {
  const fullPath = path.join(DATA_PATHS.vehicles, filePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return await sharp(fullPath)
      .rotate()
      .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84 })
      .toBuffer();
  } catch {
    return null;
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > doc.page.height - 55) {
    doc.addPage();
  }
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  const y = doc.y;
  doc.rect(40, y, 4, 15).fill(C_BLUE);
  doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(12).text(cleanText(title), 52, y + 1);
  doc.y = y + 22;
}

function drawKeyValueGrid(
  doc: PDFKit.PDFDocument,
  items: { label: string; value: string }[],
  cols = 2
): void {
  if (items.length === 0) return;
  const pageW = doc.page.width - 80;
  const gap = 12;
  const colW = (pageW - gap * (cols - 1)) / cols;
  const rowH = 22;

  for (let i = 0; i < items.length; i += cols) {
    ensureSpace(doc, rowH + 6);
    const y = doc.y;
    for (let c = 0; c < cols; c++) {
      const item = items[i + c];
      if (!item) continue;
      const x = 40 + c * (colW + gap);
      doc.rect(x, y, colW, rowH).fillAndStroke(C_BG, C_BORDER);
      doc.fillColor(C_MUTED).font('Helvetica').fontSize(8).text(cleanText(item.label), x + 8, y + 4, { width: colW / 2 - 8, ellipsis: true });
      doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(8.5).text(cleanText(item.value || '-'), x + colW / 2, y + 6, { width: colW / 2 - 8, align: 'right', ellipsis: true });
    }
    doc.y = y + rowH + 4;
  }
}

export class ShowcasePdfService {
  /**
   * Generates a complete A4 PDF sales brochure including vehicle specs, highlights,
   * options, maintenance history, contact details, and all vehicle photos.
   */
  public static async generatePdf(showcase: CompiledShowcase): Promise<Buffer> {
    const photoBuffers = new Map<string, Buffer>();
    for (const photo of showcase.photos) {
      const buf = await loadPhotoJpeg(photo.file_path);
      if (buf) photoBuffers.set(photo.id, buf);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.renderHeaderAndHero(doc, showcase, photoBuffers);
    this.renderDetails(doc, showcase);
    this.renderPhotoGallery(doc, showcase, photoBuffers);
    this.renderFooters(doc, showcase);

    doc.end();
    return done;
  }

  private static renderHeaderAndHero(
    doc: PDFKit.PDFDocument,
    showcase: CompiledShowcase,
    photoBuffers: Map<string, Buffer>
  ): void {
    const v = showcase.vehicle;
    const plate = v.license_plate ? RdwService.formatPlate(v.license_plate) : '';
    const hasPrice =
      showcase.price_label !== 'Geen prijs tonen' &&
      showcase.price_label !== 'Geen prijs' &&
      ((showcase.asking_price && showcase.asking_price > 0) || showcase.price_label === 'Prijs op aanvraag');

    const priceStr =
      showcase.asking_price && showcase.asking_price > 0
        ? `${showcase.price_label}: ${ShowcaseService.formatCurrency(showcase.asking_price)}`
        : 'Prijs op aanvraag';

    // Top dark banner
    doc.rect(0, 0, doc.page.width, 92).fill(C_NAVY);
    doc.fillColor('#93c5fd').font('Helvetica-Bold').fontSize(8.5).text('VEHICLEVAULT DIGITAAL VERKOOPDOSSIER', 40, 18);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text(cleanText(showcase.title), 40, 32, { width: 370, ellipsis: true });
    if (showcase.subtitle) {
      doc.fillColor('#cbd5e1').font('Helvetica').fontSize(9.5).text(cleanText(showcase.subtitle), 40, 56, { width: 370, ellipsis: true });
    }

    if (plate) {
      doc.roundedRect(doc.page.width - 155, 22, 115, 24, 4).fill('#f59e0b');
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text(cleanText(plate), doc.page.width - 155, 28, { width: 115, align: 'center' });
    }
    if (hasPrice) {
      doc.roundedRect(doc.page.width - 175, 54, 135, 22, 4).fill(C_BLUE);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5).text(cleanText(priceStr), doc.page.width - 175, 60, { width: 135, align: 'center' });
    }

    doc.y = 108;

    // Primary photo
    const primary = showcase.photos.find((p) => p.is_primary === 1) || showcase.photos[0];
    const heroBuf = primary ? photoBuffers.get(primary.id) : undefined;
    if (heroBuf) {
      try {
        doc.image(heroBuf, 40, doc.y, { fit: [doc.page.width - 80, 210], align: 'center', valign: 'center' });
        doc.y += 222;
      } catch {
        // skip hero image if pdfkit fails
      }
    }

    // Quick stats
    const s = showcase.stats;
    drawSectionHeader(doc, 'Overzicht & Kerngegevens');
    drawKeyValueGrid(doc, [
      { label: 'Bouwjaar', value: s.bouwjaar },
      { label: 'Kilometerstand', value: s.kilometerstand },
      { label: 'Aandrijving', value: s.brandstof_transmissie },
      { label: 'Vermogen', value: s.vermogen },
      { label: 'APK Vervaldatum', value: s.apk_vervaldatum },
      { label: 'NAP Oordeel', value: s.nap_oordeel || 'Geen oordeel' },
    ]);
  }

  private static renderDetails(doc: PDFKit.PDFDocument, showcase: CompiledShowcase): void {
    if (showcase.highlights.length > 0) {
      drawSectionHeader(doc, 'Belangrijkste Pluspunten');
      for (const h of showcase.highlights) {
        ensureSpace(doc, 28);
        doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(9.5).text(`• ${cleanText(h.title)}`, 44, doc.y);
        if (h.description) {
          doc.fillColor(C_SLATE).font('Helvetica').fontSize(8.5).text(cleanText(h.description), 54, doc.y + 2, { width: doc.page.width - 96 });
        }
        doc.moveDown(0.35);
      }
    }

    if (showcase.show_rdw_specs) {
      if (showcase.specs.basis.length > 0) {
        drawSectionHeader(doc, 'Basis & Registratie');
        drawKeyValueGrid(doc, showcase.specs.basis);
      }
      if (showcase.specs.motor.length > 0) {
        drawSectionHeader(doc, 'Motor & Aandrijving');
        drawKeyValueGrid(doc, showcase.specs.motor);
      }
      if (showcase.specs.milieu.length > 0) {
        drawSectionHeader(doc, 'Milieu & Verbruik');
        drawKeyValueGrid(doc, showcase.specs.milieu);
      }
    }

    if (showcase.options_list.length > 0) {
      drawSectionHeader(doc, 'Opties & Accessoires');
      for (const group of showcase.options_list) {
        if (!group.items.length) continue;
        ensureSpace(doc, 32);
        doc.fillColor(C_BLUE).font('Helvetica-Bold').fontSize(9.5).text(cleanText(group.category), 44, doc.y);
        doc.fillColor(C_SLATE).font('Helvetica').fontSize(8.5).text(cleanText(group.items.join('  •  ')), 44, doc.y + 2, { width: doc.page.width - 88 });
        doc.moveDown(0.45);
      }
    }

    if (showcase.show_maintenance_history && showcase.maintenance_records.length > 0) {
      drawSectionHeader(doc, 'Onderhoudshistorie');
      for (const rec of showcase.maintenance_records.slice(0, 20)) {
        ensureSpace(doc, 20);
        const line = `${formatDateNl(rec.date)}  |  ${rec.odometer.toLocaleString('nl-NL')} km  |  ${rec.category}${rec.has_invoice ? ' (Factuur aanwezig)' : ''}`;
        doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(8.5).text(cleanText(line), 44, doc.y);
        if (rec.description) {
          doc.fillColor(C_SLATE).font('Helvetica').fontSize(8).text(cleanText(rec.description), 52, doc.y + 1, { width: doc.page.width - 96 });
        }
        doc.moveDown(0.25);
      }
    }

    if (showcase.show_tire_status && showcase.tires) {
      const t = showcase.tires;
      drawSectionHeader(doc, 'Bandenstatus');
      drawKeyValueGrid(doc, [
        { label: 'Bandenset', value: `${t.name} (${t.season})` },
        { label: 'Maat / Merk', value: [t.brand_model || t.brand, t.tire_size].filter(Boolean).join(' - ') || '-' },
        { label: 'Profiel Voor (LV / RV)', value: `${t.tread_depth_fl ?? '-'} mm / ${t.tread_depth_fr ?? '-'} mm` },
        { label: 'Profiel Achter (LA / RA)', value: `${t.tread_depth_rl ?? '-'} mm / ${t.tread_depth_rr ?? '-'} mm` },
      ]);
    }

    if (showcase.transparency_notes) {
      drawSectionHeader(doc, 'Transparantie & Toelichting Verkoper');
      ensureSpace(doc, 30);
      doc.fillColor(C_SLATE).font('Helvetica').fontSize(9).text(cleanText(showcase.transparency_notes), 44, doc.y, { width: doc.page.width - 88 });
      doc.moveDown(0.5);
    }

    const contacts = [
      showcase.contact_whatsapp ? { label: 'WhatsApp', value: showcase.contact_whatsapp } : null,
      showcase.contact_phone ? { label: 'Telefoon', value: showcase.contact_phone } : null,
      showcase.contact_email ? { label: 'E-mail', value: showcase.contact_email } : null,
      showcase.contact_location ? { label: 'Locatie', value: showcase.contact_location } : null,
    ].filter((c): c is { label: string; value: string } => c !== null);

    if (contacts.length > 0) {
      drawSectionHeader(doc, 'Contact & Bezichtiging');
      drawKeyValueGrid(doc, contacts);
    }
  }

  private static renderPhotoGallery(
    doc: PDFKit.PDFDocument,
    showcase: CompiledShowcase,
    photoBuffers: Map<string, Buffer>
  ): void {
    const available = showcase.photos.filter((p) => photoBuffers.has(p.id));
    if (available.length === 0) return;

    const categoryLabels: Record<string, string> = {
      exterieur: 'Exterieur',
      interieur: 'Interieur',
      details: 'Details',
      gebruikssporen: 'Gebruikssporen',
    };

    for (let i = 0; i < available.length; i += 2) {
      doc.addPage();
      doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(13).text(`Fotogalerij (${available.length} foto's)`, 40, 38);
      doc.moveTo(40, 56).lineTo(doc.page.width - 40, 56).strokeColor(C_BORDER).stroke();

      const slotPositions = [72, 425];
      for (let slot = 0; slot < 2; slot++) {
        const photo = available[i + slot];
        if (!photo) continue;
        const buf = photoBuffers.get(photo.id)!;
        const topY = slotPositions[slot];

        doc.rect(40, topY, doc.page.width - 80, 330).fillAndStroke(C_BG, C_BORDER);
        try {
          doc.image(buf, 50, topY + 10, { fit: [doc.page.width - 100, 265], align: 'center', valign: 'center' });
        } catch {
          // ignore invalid image
        }

        const badge = categoryLabels[photo.category] || photo.category;
        const caption = [badge, photo.title].filter(Boolean).join(' - ');
        doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(9.5).text(cleanText(`${i + slot + 1}. ${caption}`), 50, topY + 284, { width: doc.page.width - 100, ellipsis: true });
        if (photo.description) {
          doc.fillColor(C_MUTED).font('Helvetica').fontSize(8.5).text(cleanText(photo.description), 50, topY + 299, { width: doc.page.width - 100, ellipsis: true });
        }
      }
    }
  }

  private static renderFooters(doc: PDFKit.PDFDocument, showcase: CompiledShowcase): void {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - 30;
      doc.fillColor(C_MUTED).font('Helvetica').fontSize(8);
      doc.text(cleanText(`${showcase.title} — Gegenereerd via VehicleVault`), 40, y, { lineBreak: false });
      doc.text(`Pagina ${i + 1} van ${range.count}`, 40, y, { width: doc.page.width - 80, align: 'right', lineBreak: false });
    }
  }
}
