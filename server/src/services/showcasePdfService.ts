import PDFDocument from 'pdfkit';
import { CompiledShowcase, ShowcaseService } from './showcaseService.js';
import { RdwService } from './rdwService.js';
import {
  C_NAVY, C_BLUE, C_TEAL, C_SLATE, C_MUTED, C_BORDER, C_BG,
  cleanText, formatDateNl, loadPhotoJpeg, generateQrPng,
  ensureSpace, drawSectionHeader, drawKeyValueGrid,
} from './showcasePdfHelpers.js';

export class ShowcasePdfService {
  /**
   * Generates a polished A4 PDF vehicle presentation including hero framing,
   * warranty spotlight, structured maintenance table, optional QR code, and all photos.
   */
  public static async generatePdf(showcase: CompiledShowcase, publicUrl?: string): Promise<Buffer> {
    const photoBuffers = new Map<string, Buffer>();
    for (const photo of showcase.photos) {
      const buf = await loadPhotoJpeg(photo.file_path);
      if (buf) photoBuffers.set(photo.id, buf);
    }
    const qrBuf = await generateQrPng(publicUrl);

    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.renderHeaderAndHero(doc, showcase, photoBuffers);
    this.renderHighlightsAndSpecs(doc, showcase);
    this.renderOptionsAndMaintenance(doc, showcase);
    this.renderFooterSections(doc, showcase, qrBuf, publicUrl);
    this.renderPhotoGallery(doc, showcase, photoBuffers);
    this.renderPageFooters(doc, showcase);

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

    // Sleek fixed-height header banner
    doc.rect(0, 0, doc.page.width, 74).fill(C_NAVY);
    doc.fillColor('#93c5fd').font('Helvetica-Bold').fontSize(8).text('VEHICLEVAULT  •  VOERTUIGPRESENTATIE', 40, 15);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text(cleanText(showcase.title), 40, 30, { width: doc.page.width - 230, ellipsis: true });

    if (plate) {
      doc.roundedRect(doc.page.width - 155, 14, 115, 22, 4).fill('#f59e0b');
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10.5).text(cleanText(plate), doc.page.width - 155, 19.5, { width: 115, align: 'center' });
    }
    if (hasPrice) {
      doc.roundedRect(doc.page.width - 175, 42, 135, 20, 4).fill(C_BLUE);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(cleanText(priceStr), doc.page.width - 175, 47.5, { width: 135, align: 'center' });
    }

    doc.y = 88;

    // Framed hero photo
    const primary = showcase.photos.find((p) => p.is_primary === 1) || showcase.photos[0];
    const heroBuf = primary ? photoBuffers.get(primary.id) : undefined;
    if (heroBuf) {
      doc.roundedRect(40, doc.y, doc.page.width - 80, 192, 6).fillAndStroke(C_BG, C_BORDER);
      try {
        doc.image(heroBuf, 46, doc.y + 6, { fit: [doc.page.width - 92, 180], align: 'center', valign: 'center' });
      } catch {}
      doc.y += 202;
    }

    // Warranty spotlight banner
    if (showcase.warranty_enabled && showcase.warranty_text) {
      ensureSpace(doc, 32);
      const wy = doc.y;
      doc.roundedRect(40, wy, doc.page.width - 80, 24, 4).fillAndStroke('#f0fdfa', '#99f6e4');
      doc.roundedRect(40, wy, 4, 24, 2).fill(C_TEAL);
      doc.fillColor('#115e59').font('Helvetica-Bold').fontSize(9).text(`GARANTIE: ${cleanText(showcase.warranty_text)}`, 52, wy + 7);
      doc.y = wy + 31;
    }

    // Full multi-paragraph description on clean background
    const subText = cleanText(showcase.subtitle);
    if (subText) {
      doc.font('Helvetica').fontSize(8.8);
      const subH = doc.heightOfString(subText, { width: doc.page.width - 84 });
      ensureSpace(doc, subH + 12);
      doc.fillColor(C_SLATE).font('Helvetica').fontSize(8.8).text(subText, 42, doc.y, { width: doc.page.width - 84, lineGap: 2 });
      doc.y += 8;
    }

    // Overview grid
    const s = showcase.stats;
    drawSectionHeader(doc, 'Overzicht & Kerngegevens');
    const isNap = s.nap_oordeel && s.nap_oordeel.toLowerCase().includes('logisch') && !s.nap_oordeel.toLowerCase().includes('onlogisch');
    drawKeyValueGrid(doc, [
      { label: 'Bouwjaar', value: s.bouwjaar },
      { label: 'Kilometerstand', value: s.kilometerstand },
      { label: 'Aandrijving', value: s.brandstof_transmissie },
      { label: 'Vermogen', value: s.vermogen },
      { label: 'APK Vervaldatum', value: s.apk_vervaldatum },
      { label: isNap ? 'NAP Oordeel' : 'Herkomst', value: isNap ? s.nap_oordeel : (s.herkomst || 'Origineel Nederlands') },
    ]);
  }

  private static renderHighlightsAndSpecs(doc: PDFKit.PDFDocument, showcase: CompiledShowcase): void {
    if (showcase.highlights.length > 0) {
      drawSectionHeader(doc, 'Belangrijkste Pluspunten');
      const colW = (doc.page.width - 90) / 2;
      for (let i = 0; i < showcase.highlights.length; i += 2) {
        const pair = [showcase.highlights[i], showcase.highlights[i + 1]];
        let cardH = 32;
        for (const h of pair) {
          if (!h) continue;
          doc.font('Helvetica').fontSize(8);
          const descH = h.description ? doc.heightOfString(cleanText(h.description), { width: colW - 20 }) : 0;
          cardH = Math.max(cardH, 22 + descH + 8);
        }
        ensureSpace(doc, cardH + 6);
        const y = doc.y;
        pair.forEach((h, idx) => {
          if (!h) return;
          const x = 40 + idx * (colW + 10);
          doc.roundedRect(x, y, colW, cardH, 4).fillAndStroke(C_BG, C_BORDER);
          doc.roundedRect(x, y, 3, cardH, 1.5).fill(C_BLUE);
          doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(8.8).text(cleanText(h.title), x + 10, y + 6, { width: colW - 18 });
          if (h.description) {
            doc.fillColor(C_SLATE).font('Helvetica').fontSize(8).text(cleanText(h.description), x + 10, y + 19, { width: colW - 18 });
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
  }

  private static renderOptionsAndMaintenance(doc: PDFKit.PDFDocument, showcase: CompiledShowcase): void {
    if (showcase.options_list.length > 0) {
      drawSectionHeader(doc, 'Opties & Accessoires');
      const colW = (doc.page.width - 96) / 2;
      for (const group of showcase.options_list) {
        if (!group.items.length) continue;
        ensureSpace(doc, 30);
        doc.fillColor(C_BLUE).font('Helvetica-Bold').fontSize(9.2).text(cleanText(group.category), 44, doc.y);
        doc.y += 3;
        for (let i = 0; i < group.items.length; i += 2) {
          const left = cleanText(group.items[i]);
          const right = group.items[i + 1] ? cleanText(group.items[i + 1]) : '';
          doc.font('Helvetica').fontSize(8.2);
          const hLeft = doc.heightOfString(left, { width: colW - 12 });
          const hRight = right ? doc.heightOfString(right, { width: colW - 12 }) : 0;
          const rowH = Math.max(12, Math.ceil(Math.max(hLeft, hRight)) + 2);
          ensureSpace(doc, rowH + 4);
          const y = doc.y;
          doc.circle(48, y + 4.2, 1.7).fill(C_BLUE);
          doc.fillColor(C_SLATE).font('Helvetica').fontSize(8.2).text(left, 55, y, { width: colW - 12 });
          if (right) {
            const rx = 44 + colW + 12;
            doc.circle(rx + 4, y + 4.2, 1.7).fill(C_BLUE);
            doc.fillColor(C_SLATE).font('Helvetica').fontSize(8.2).text(right, rx + 11, y, { width: colW - 12 });
          }
          doc.y = y + rowH;
        }
        doc.moveDown(0.35);
      }
    }

    if (showcase.show_maintenance_history && showcase.maintenance_records.length > 0) {
      drawSectionHeader(doc, 'Onderhoudshistorie');
      const tableW = doc.page.width - 80;
      ensureSpace(doc, 24);
      const hy = doc.y;
      doc.roundedRect(40, hy, tableW, 18, 3).fill('#e2e8f0');
      doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(7.8);
      doc.text('Datum', 46, hy + 5, { width: 65 });
      doc.text('Km-stand', 112, hy + 5, { width: 62 });
      doc.text('Werkzaamheden / Omschrijving', 178, hy + 5, { width: 295 });
      doc.text('Factuur', 475, hy + 5, { width: 70, align: 'right' });
      doc.y = hy + 20;

      showcase.maintenance_records.slice(0, 20).forEach((rec, idx) => {
        const desc = cleanText([rec.category, rec.description].filter(Boolean).join(' - '));
        doc.font('Helvetica').fontSize(7.8);
        const rowH = Math.max(18, Math.ceil(doc.heightOfString(desc, { width: 295 })) + 8);
        ensureSpace(doc, rowH + 2);
        const ry = doc.y;
        doc.rect(40, ry, tableW, rowH).fillAndStroke(idx % 2 === 0 ? C_BG : '#ffffff', C_BORDER);
        doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(7.8).text(formatDateNl(rec.date), 46, ry + 5, { width: 65 });
        doc.fillColor(C_SLATE).font('Helvetica').fontSize(7.8).text(`${rec.odometer.toLocaleString('nl-NL')} km`, 112, ry + 5, { width: 62 });
        doc.text(desc, 178, ry + 5, { width: 295 });
        doc.fillColor(rec.has_invoice ? C_TEAL : C_MUTED).font('Helvetica-Bold').text(rec.has_invoice ? 'Ja' : '-', 475, ry + 5, { width: 70, align: 'right' });
        doc.y = ry + rowH;
      });
      doc.moveDown(0.35);
    }
  }

  private static renderFooterSections(
    doc: PDFKit.PDFDocument,
    showcase: CompiledShowcase,
    qrBuf: Buffer | null,
    publicUrl?: string
  ): void {
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
      const notes = cleanText(showcase.transparency_notes);
      doc.font('Helvetica').fontSize(8.5);
      ensureSpace(doc, doc.heightOfString(notes, { width: doc.page.width - 88 }) + 16);
      doc.fillColor(C_SLATE).font('Helvetica').fontSize(8.5).text(notes, 44, doc.y, { width: doc.page.width - 88, lineGap: 1.5 });
      doc.moveDown(0.4);
    }

    const contacts = [
      showcase.contact_whatsapp ? { label: 'WhatsApp', value: showcase.contact_whatsapp } : null,
      showcase.contact_phone ? { label: 'Telefoon', value: showcase.contact_phone } : null,
      showcase.contact_email ? { label: 'E-mail', value: showcase.contact_email } : null,
      showcase.contact_location ? { label: 'Locatie', value: showcase.contact_location } : null,
    ].filter((c): c is { label: string; value: string } => c !== null);

    if (contacts.length > 0 || qrBuf) {
      drawSectionHeader(doc, 'Contact & Online Presentatie');
      ensureSpace(doc, qrBuf ? 82 : 40);
      const startY = doc.y;
      if (contacts.length > 0) {
        const contactW = qrBuf ? doc.page.width - 175 : doc.page.width - 80;
        contacts.forEach((c, idx) => {
          const cy = startY + idx * 22;
          doc.roundedRect(40, cy, contactW, 19, 3).fillAndStroke(C_BG, C_BORDER);
          doc.fillColor(C_MUTED).font('Helvetica').fontSize(8).text(c.label, 48, cy + 5.5);
          doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(8.2).text(cleanText(c.value), 48, cy + 5.5, { width: contactW - 16, align: 'right' });
        });
      }
      if (qrBuf && publicUrl) {
        const qx = doc.page.width - 120;
        doc.roundedRect(qx, startY, 80, 88, 4).fillAndStroke('#ffffff', C_BORDER);
        doc.image(qrBuf, qx + 8, startY + 6, { width: 64, height: 64 });
        doc.fillColor(C_MUTED).font('Helvetica').fontSize(6.5).text('Scan voor live pagina', qx, startY + 73, { width: 80, align: 'center' });
      }
      doc.y = Math.max(startY + contacts.length * 22, qrBuf ? startY + 92 : startY);
    }
  }

  private static renderPhotoGallery(doc: PDFKit.PDFDocument, showcase: CompiledShowcase, photoBuffers: Map<string, Buffer>): void {
    const available = showcase.photos.filter((p) => photoBuffers.has(p.id));
    if (available.length === 0) return;
    const categoryLabels: Record<string, string> = { exterieur: 'Exterieur', interieur: 'Interieur', details: 'Details', gebruikssporen: 'Gebruikssporen' };

    for (let i = 0; i < available.length; i += 2) {
      doc.addPage();
      doc.roundedRect(40, 34, doc.page.width - 80, 24, 4).fillAndStroke('#eff6ff', '#dbeafe');
      doc.roundedRect(40, 34, 4, 24, 2).fill(C_BLUE);
      doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(11.5).text(`Fotogalerij (${available.length} foto's)`, 52, 41);

      [68, 422].forEach((topY, slot) => {
        const photo = available[i + slot];
        if (!photo) return;
        const buf = photoBuffers.get(photo.id)!;
        doc.roundedRect(40, topY, doc.page.width - 80, 336, 5).fillAndStroke(C_BG, C_BORDER);
        try { doc.image(buf, 50, topY + 10, { fit: [doc.page.width - 100, 272], align: 'center', valign: 'center' }); } catch {}
        const caption = [categoryLabels[photo.category] || photo.category, photo.title].filter(Boolean).join(' - ');
        doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(9.5).text(cleanText(`${i + slot + 1}. ${caption}`), 50, topY + 290, { width: doc.page.width - 100, ellipsis: true });
        if (photo.description) {
          doc.fillColor(C_MUTED).font('Helvetica').fontSize(8.2).text(cleanText(photo.description), 50, topY + 305, { width: doc.page.width - 100, ellipsis: true });
        }
      });
    }
  }

  private static renderPageFooters(doc: PDFKit.PDFDocument, showcase: CompiledShowcase): void {
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
