import { apiFetch } from './client';

export type ProfileVisibility = 'public' | 'private' | 'contacts';

export interface PrivacyPreferences {
  profileVisibility: ProfileVisibility;
  showEmail: boolean;
  showPhone: boolean;
  showActivity: boolean;
  allowMessages: boolean;
  shareData: boolean;
}

export const DEFAULT_PRIVACY: PrivacyPreferences = {
  profileVisibility: 'public',
  showEmail: false,
  showPhone: false,
  showActivity: true,
  allowMessages: true,
  shareData: false,
};

export interface WhatsAppPreferences {
  connected: boolean;
  phone: string;
  preferences: Record<string, boolean>;
}

export const DEFAULT_WHATSAPP_TOPICS: Record<string, boolean> = {
  payments: true,
  maintenance: true,
  messages: true,
  lease: true,
  credit: false,
};

export const WHATSAPP_TOPIC_LABEL: { id: string; label: string }[] = [
  { id: 'payments', label: 'Rent and payment reminders' },
  { id: 'maintenance', label: 'Maintenance updates' },
  { id: 'messages', label: 'New messages from your landlord' },
  { id: 'lease', label: 'Lease renewal alerts' },
  { id: 'credit', label: 'Credit reporting confirmations' },
];

/**
 * The renter's preference bag. The API stores free-form JSON and merges partial
 * updates, so each screen reads and writes only the key it owns — matching how
 * the web settings panels share this endpoint.
 */
export interface RenterPreferences {
  privacy?: Partial<PrivacyPreferences>;
  whatsapp?: Partial<WhatsAppPreferences>;
  security?: { biometricEnabled?: boolean };
  shareTenancyStanding?: boolean;
  [key: string]: unknown;
}

export const preferencesApi = {
  get: () => apiFetch<RenterPreferences>('/renter/settings/preferences'),

  /** Merged server-side into the existing bag — send only what changed. */
  update: (patch: RenterPreferences) =>
    apiFetch<RenterPreferences>('/renter/settings/preferences', { method: 'PUT', body: patch }),
};
