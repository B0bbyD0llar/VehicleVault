import type { TranslationKey } from '../i18n/translations.js';

export interface EmailPreset {
  id: 'gmail' | 'microsoft365' | 'outlook';
  label: string;
  host: string;
  port: number;
  /** true = implicit TLS (port 465); false = STARTTLS on 587. */
  secure: boolean;
  /** Setup hint shown under the presets once this one is picked. */
  hintKey: TranslationKey;
}

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    hintKey: 'mailPresetGmailHint',
  },
  {
    id: 'microsoft365',
    label: 'Microsoft 365',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    hintKey: 'mailPresetMicrosoft365Hint',
  },
  {
    id: 'outlook',
    label: 'Outlook.com',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    hintKey: 'mailPresetOutlookHint',
  },
];

/**
 * The fields a preset sets. When the user has already typed an address and no From yet (or the default one),
 * the From follows the user: Gmail and Microsoft reject mail that claims another sender.
 */
export function applyEmailPreset(preset: EmailPreset, current: { user: string; from: string }) {
  const placeholderFrom = !current.from || current.from.includes('vehiclevault.local');
  return {
    host: preset.host,
    port: preset.port,
    secure: preset.secure,
    from: placeholderFrom && current.user.includes('@') ? `VehicleVault <${current.user}>` : current.from,
  };
}
