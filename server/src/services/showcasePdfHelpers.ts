import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import QRCode from 'qrcode';
import { DATA_PATHS } from '../config/env.js';

export const C_NAVY = '#0f172a';
export const C_BLUE = '#2563eb';
export const C_TEAL = '#0d9488';
export const C_SLATE = '#334155';
export const C_MUTED = '#64748b';
export const C_BORDER = '#e2e8f0';
export const C_BG = '#f8fafc';

export function cleanText(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/€/g, 'EUR ')
    .replace(/[—–]/g, '-')
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, '')
    .trim();
}

export function formatDateNl(val?: string | null): string {
  if (!val) return '-';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  return s;
}

export async function loadPhotoJpeg(filePath: string, maxW = 1200, maxH = 800): Promise<Buffer | null> {
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

export async function generateQrPng(url?: string): Promise<Buffer | null> {
  if (!url) return null;
  try {
    return await QRCode.toBuffer(url, { width: 140, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
  } catch {
    return null;
  }
}

export function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > doc.page.height - 52) {
    doc.addPage();
  }
}

export function drawSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  ensureSpace(doc, 42);
  doc.moveDown(0.35);
  const y = doc.y;
  const width = doc.page.width - 80;
  doc.roundedRect(40, y, width, 22, 4).fillAndStroke('#eff6ff', '#dbeafe');
  doc.roundedRect(40, y, 4, 22, 2).fill(C_BLUE);
  doc.fillColor(C_NAVY).font('Helvetica-Bold').fontSize(10.5).text(cleanText(title), 52, y + 6);
  doc.y = y + 28;
}

export function drawKeyValueGrid(
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
