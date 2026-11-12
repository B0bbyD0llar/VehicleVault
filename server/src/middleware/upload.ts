import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { DATA_PATHS } from '../config/env.js';

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

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DATA_PATHS.receipts);
  },
  filename: (_req, file, cb) => {
    const ext = getSafeExtension(file.originalname, file.mimetype, '.jpg');
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const invoiceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DATA_PATHS.invoices);
  },
  filename: (_req, file, cb) => {
    const ext = getSafeExtension(file.originalname, file.mimetype, '.pdf');
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const vehicleImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DATA_PATHS.vehicles);
  },
  filename: (_req, file, cb) => {
    const ext = getSafeExtension(file.originalname, file.mimetype, '.jpg');
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DATA_PATHS.documents);
  },
  filename: (_req, file, cb) => {
    const ext = getSafeExtension(file.originalname, file.mimetype, '.pdf');
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (allowedMimes: string[]) => {
  return (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    if (DANGEROUS_EXTENSIONS.has(rawExt) || file.mimetype === 'image/svg+xml') {
      return cb(new Error('Niet toegestaan bestandstype om veiligheidsredenen'));
    }
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Niet ondersteund bestandstype: ${file.mimetype}`));
    }
  };
};

export const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
});

export const uploadInvoice = multer({
  storage: invoiceStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
});

export const uploadVehicleImage = multer({
  storage: vehicleImageStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
});

export const uploadDocument = multer({
  storage: documentStorage,
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
