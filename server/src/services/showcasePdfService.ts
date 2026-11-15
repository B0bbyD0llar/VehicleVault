import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { CompiledShowcase, ShowcaseService } from './showcaseService.js';
import { RdwService } from './rdwService.js';
import { DATA_PATHS } from '../config/env.js';

const C_NAVY = '#0f172a';
const C_BLUE = '#2563eb';
const C_SLATE = '#334155';
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
  if (doc.y + needed > doc.page.height - 52) {
    doc.addPage();
  }
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  ensureSpace(doc, 36);
  doc.moveDown(0.35);
  const y = doc.y;
  doc.roundedRect(40, y, 3.5, 13, 1.5).fill(C_BLUE);
  doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(11).text(cleanText(title), 50, y + 0.5);
  doc.y = y + 19;
}

function drawKeyValueGrid(
  doc: PDFKit.PDFDocument,
  items: { label: string; value: string }[],
  cols = 2
): void {
  if (items.length === 0) return;
  const pageW = doc.page.width - 80;
  const gap = 10;
  const colW = (pageW - gap * (cols - 1)) / cols;
  const labelW = colW * 0.44;
  const valW = colW * 0.52;

  for (let i = 0; i < items.length; i += cols) {
    let rowH = 21;
    for (let c = 0; c < cols; c++) {
      const item = items[i + c];
      if (!item) continue;
      doc.font('Helvetica-Bold').fontSize(8.2);
      const valH = doc.heightOfString(cleanText(item.value || '-'), { width: valW - 6 });
      doc.font('Helvetica').fontSize(8);
      const lblH = doc.heightOfString(cleanText(item.label), { width: labelW - 6 });
      rowH = Math.max(rowH, Math.ceil(Math.max(valH, lblH)) + 10);
    }

    ensureSpace(doc, rowH + 4);
    const y = doc.y;
    for (let c = 0; c < cols; c++) {
      const item = items[i + c];
      if (!item) continue;
      const x = 40 + c * (colW + gap);
      doc.roundedRect(x, y, colW, rowH, 3).fillAndStroke(C_BG, C_BORDER);
      doc.fillColor(C_MUTED).font('Helvetica').fontSize(8).text(cleanText(item.label), x + 8, y + 5.5, { width: labelW - 6 });
      doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(8.2).text(cleanText(item.value || '-'), x + labelW + 4, y + 5.5, { width: valW - 6, align: 'right' });
    }
    doc.y = y + rowH + 3.5;
  }
}

export class ShowcasePdfService {
  /**
   * Generates a complete A4 PDF vehicle presentation including specs, highlights,
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

    const leftColW = doc.page.width - 230;
    const subText = cleanText(showcase.subtitle);
    doc.font('Helvetica').fontSize(9);
    const subHeight = subText ? doc.heightOfString(subText, { width: leftColW }) : 0;
    const bannerH = Math.max(82, 54 + subHeight + 14);

    doc.rect(0, 0, doc.page.width, bannerH).fill(C_NAVY);
    doc.fillColor('#93c5fd').font('Helvetica-Bold').fontSize(8).text('VEHICLEVAULT  •  VOERTUIGPRESENTATIE', 40, 16);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(17).text(cleanText(showcase.title), 40, 29, { width: leftColW, ellipsis: true });
    if (subText) {
      doc.fillColor('#cbd5e1').font('Helvetica').fontSize(9).text(subText, 40, 51, { width: leftColW });
    }

    if (plate) {
      doc.roundedRect(doc.page.width - 155, 20, 115, 24, 4).fill('#f59e0b');
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text(cleanText(plate), doc.page.width - 155, 26, { width: 115, align: 'center' });
    }
    if (hasPrice) {
      doc.roundedRect(doc.page.width - 175, 50, 135, 22, 4).fill(C_BLUE);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(cleanText(priceStr), doc.page.width - 175, 56, { width: 135, align: 'center' });
    }

    doc.y = bannerH + 14;

    const primary = showcase.photos.find((p) => p.is_primary === 1) || showcase.photos[0];
    const heroBuf = primary ? photoBuffers.get(primary.id) : undefined;
    if (heroBuf) {
      try {
        doc.image(heroBuf, 40, doc.y, { fit: [doc.page.width - 80, 195], align: 'center', valign: 'center' });
        doc.y += 205;
      } catch {
        // skip invalid image
      }
    }

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
      const colW = (doc.page.width - 90) / 2;
      for (let i = 0; i < showcase.highlights.length; i += 2) {
        const pair = [showcase.highlights[i], showcase.highlights[i + 1]];
        let cardH = 32;
        for (const h of pair) {
          if (!h) continue;
          doc.font('Helvetica').fontSize(8);
          const descH = h.description ? doc.heightOfString(cleanText(h.description), { width: colW - 16 }) : 0;
          cardH = Math.max(cardH, 22 + descH + 8);
        }
        ensureSpace(doc, cardH + 6);
        const y = doc.y;
        pair.forEach((h, idx) => {
          if (!h) return;
          const x = 40 + idx * (colW + 10);
          doc.roundedRect(x, y, colW, cardH, 4).fillAndStroke(C_BG, C_BORDER);
          doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(8.8).text(cleanText(h.title), x + 8, y + 6, { width: colW - 16 });
          if (h.description) {
            doc.fillColor(C_SLATE).font('Helvetica').fontSize(8).text(cleanText(h.description), x + 8, y + 19, { width: colW - 16 });
          }
        });
        doc.y = y + cardH + 5;
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
        const text = cleanText(group.items.join('  •  '));
        doc.font('Helvetica').fontSize(8.2);
        const h = doc.heightOfString(text, { width: doc.page.width - 88 });
        ensureSpace(doc, h + 22);
        doc.fillColor(C_BLUE).font('Helvetica-Bold').fontSize(9).text(cleanText(group.category), 44, doc.y);
        doc.fillColor(C_SLATE).font('Helvetica').fontSize(8.2).text(text, 44, doc.y + 1, { width: doc.page.width - 88 });
        doc.moveDown(0.3);
      }
    }

    if (showcase.show_maintenance_history && showcase.maintenance_records.length > 0) {
      drawSectionHeader(doc, 'Onderhoudshistorie');
      for (const rec of showcase.maintenance_records.slice(0, 20)) {
        ensureSpace(doc, 22);
        const line = `${formatDateNl(rec.date)}  |  ${rec.odometer.toLocaleString('nl-NL')} km  |  ${rec.category}${rec.has_invoice ? ' (Factuur aanwezig)' : ''}`;
        doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(8.3).text(cleanText(line), 44, doc.y);
        if (rec.description) {
          doc.fillColor(C_SLATE).font('Helvetica').fontSize(7.8).text(cleanText(rec.description), 52, doc.y + 1, { width: doc.page.width - 96 });
        }
        doc.moveDown(0.2);
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
      doc.fillColor(C_SLATE).font('Helvetica').fontSize(8.5).text(cleanText(showcase.transparency_notes), 44, doc.y, { width: doc.page.width - 88 });
      doc.moveDown(0.35);
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
      doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(12.5).text(`Fotogalerij (${available.length} foto's)`, 40, 36);
      doc.moveTo(40, 53).lineTo(doc.page.width - 40, 53).strokeColor(C_BORDER).stroke();

      const slotPositions = [68, 422];
      for (let slot = 0; slot < 2; slot++) {
        const photo = available[i + slot];
        if (!photo) continue;
        const buf = photoBuffers.get(photo.id)!;
        const topY = slotPositions[slot];

        doc.roundedRect(40, topY, doc.page.width - 80, 336, 5).fillAndStroke(C_BG, C_BORDER);
        try {
          doc.image(buf, 50, topY + 10, { fit: [doc.page.width - 100, 272], align: 'center', valign: 'center' });
        } catch {
          // ignore invalid image
        }

        const badge = categoryLabels[photo.category] || photo.category;
        const caption = [badge, photo.title].filter(Boolean).join(' - ');
        doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(9.5).text(cleanText(`${i + slot + 1}. ${caption}`), 50, topY + 290, { width: doc.page.width - 100, ellipsis: true });
        if (photo.description) {
          doc.fillColor(C_MUTED).font('Helvetica').fontSize(8.2).text(cleanText(photo.description), 50, topY + 305, { width: doc.page.width - 100, ellipsis: true });
        }
      }
    }
  }

  private static renderFooters(doc: PDFKit.PDFDocument, showcase: CompiledShowcase): void {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      const y = doc.page.height - 26;
      doc.fillColor(C_MUTED).font('Helvetica').fontSize(8);
      doc.text(cleanText(`${showcase.title} - Gegenereerd via VehicleVault`), 40, y, { lineBreak: false });
      doc.text(`Pagina ${i + 1} van ${range.count}`, 40, y, { width: doc.page.width - 80, align: 'right', lineBreak: false });
    }
  }
}
