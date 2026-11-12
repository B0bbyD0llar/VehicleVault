import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { DATA_PATHS } from '../config/env.js';

type AllowedKind = 'image' | 'pdf' | 'document';

const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
};

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
]);

const DANGEROUS_EXTENSIONS = new Set([
  '.svg',
  '.html',
  '.htm',
  '.xhtml',
  '.xml',
  '.js',
  '.mjs',
  '.cjs',
  '.php',
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
]);

function getSafeExtension(originalName: string, mimeType: string, defaultExt: string): string {
  const rawExt = path.extname(originalName || '').toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(rawExt)) {
    return defaultExt;
  }
  if (ALLOWED_EXTENSIONS.has(rawExt)) {
    return rawExt;
  }
  return MIME_EXT_MAP[mimeType] || defaultExt;
}

export function containsDangerousSignatures(buf: Buffer): boolean {
  if (!buf || buf.length === 0) return true;
  const headerSlice = buf.subarray(0, Math.min(buf.length, 8192));
  const text = headerSlice.toString('latin1').toLowerCase();

  return (
    text.includes('<svg') ||
    text.includes('<?xml') ||
    text.includes('<!doctype') ||
    text.includes('<html') ||
    text.includes('<script') ||
    text.includes('xlink:href') ||
    text.includes('xmlns:svg') ||
    text.includes('xmlns="http://www.w3.org/2000/svg"') ||
    /onload\s*=/i.test(text) ||
    /onerror\s*=/i.test(text) ||
    text.includes('javascript:')
  );
}

function isCleanPlainText(buf: Buffer): boolean {
  for (let i = 0; i < Math.min(buf.length, 1024); i++) {
    const byte = buf[i];
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) {
      return false;
    }
  }
  return true;
}

export function matchesMagicBytes(buf: Buffer, kinds: AllowedKind[], ext = ''): boolean {
  if (!buf || buf.length < 4) return false;

  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;
  const isWebp =
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buf.subarray(8, 12).toString('latin1') === 'WEBP';
  const isHeic =
    buf.length >= 12 &&
    buf.subarray(4, 8).toString('latin1') === 'ftyp';
  const isPdf =
    buf.length >= 4 &&
    buf.subarray(0, 4).toString('latin1') === '%PDF';

  for (const kind of kinds) {
    if (kind === 'image' && (isJpeg || isPng || isWebp || isHeic)) return true;
    if (kind === 'pdf' && isPdf) return true;
    if (kind === 'document') {
      if (isJpeg || isPng || isWebp || isHeic || isPdf) return true;
      const isDoc = buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
      const isDocx = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
      if (isDoc || isDocx) return true;
      if (ext === '.txt' && isCleanPlainText(buf)) return true;
    }
  }
  return false;
}

class SafeDiskStorage implements multer.StorageEngine {
  constructor(
    private destDir: string,
    private allowedKinds: AllowedKind[],
    private defaultExt: string
  ) {}

  _handleFile(
    _req: any,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ): void {
    const ext = getSafeExtension(file.originalname, file.mimetype, this.defaultExt);
    const filename = `${crypto.randomUUID()}${ext}`;
    const targetPath = path.join(this.destDir, filename);

    const outStream = fs.createWriteStream(targetPath);
    let bytesWritten = 0;
    const headerChunks: Buffer[] = [];
    let headerBytes = 0;

    file.stream.on('data', (chunk: Buffer) => {
      bytesWritten += chunk.length;
      if (headerBytes < 8192) {
        headerChunks.push(chunk);
        headerBytes += chunk.length;
      }
    });

    file.stream.pipe(outStream);

    outStream.on('error', (err) => {
      fs.unlink(targetPath, () => {});
      cb(err);
    });

    outStream.on('finish', () => {
      const headerBuf = Buffer.concat(headerChunks);

      if (containsDangerousSignatures(headerBuf)) {
        fs.unlink(targetPath, () => {});
        const err: any = new Error('Niet-toegestane bestandsinhoud (SVG/HTML/Script gedetecteerd)');
        err.status = 400;
        return cb(err);
      }

      const rawExt = path.extname(file.originalname || '').toLowerCase();
      if (!matchesMagicBytes(headerBuf, this.allowedKinds, rawExt)) {
        fs.unlink(targetPath, () => {});
        const err: any = new Error('Bestandsinhoud komt niet overeen met een geldig en veilig bestandstype');
        err.status = 400;
        return cb(err);
      }

      cb(null, {
        destination: this.destDir,
        filename,
        path: targetPath,
        size: bytesWritten,
      });
    });
  }

  _removeFile(_req: any, file: Express.Multer.File, cb: (error: Error | null) => void): void {
    if (file.path) {
      fs.unlink(file.path, cb);
    } else {
      cb(null);
    }
  }
}

const fileFilter = (allowedMimes: string[]) => {
  return (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    if (DANGEROUS_EXTENSIONS.has(rawExt) || file.mimetype === 'image/svg+xml') {
      const err: any = new Error('Niet toegestaan bestandstype om veiligheidsredenen');
      err.status = 400;
      return cb(err);
    }
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err: any = new Error(`Niet ondersteund bestandstype: ${file.mimetype}`);
      err.status = 400;
      cb(err);
    }
  };
};

export const uploadReceipt = multer({
  storage: new SafeDiskStorage(DATA_PATHS.receipts, ['image', 'pdf'], '.jpg'),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
});

export const uploadInvoice = multer({
  storage: new SafeDiskStorage(DATA_PATHS.invoices, ['image', 'pdf'], '.pdf'),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
});

export const uploadVehicleImage = multer({
  storage: new SafeDiskStorage(DATA_PATHS.vehicles, ['image'], '.jpg'),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
});

export const uploadDocument = multer({
  storage: new SafeDiskStorage(DATA_PATHS.documents, ['image', 'pdf', 'document'], '.pdf'),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: fileFilter([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]),
});

export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
