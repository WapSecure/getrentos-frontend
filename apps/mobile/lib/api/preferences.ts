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

/** The API stores free-form JSON and merges partial updates, so each screen writes only the key it owns. */
export interface RenterPreferences {
  hideMonetaryValues?: boolean;
  privacy?: Partial<PrivacyPreferences>;
  security?: { biometricEnabled?: boolean };
  shareTenancyStanding?: boolean;
  [key: string]: unknown;
}

export const preferencesApi = {
  get: () => apiFetch<RenterPreferences>('/users/me/preferences'),

  /** Merged server-side into the existing bag — send only what changed. */
  update: (patch: RenterPreferences) =>
    apiFetch<RenterPreferences>('/users/me/preferences', { method: 'PUT', body: patch }),
};
