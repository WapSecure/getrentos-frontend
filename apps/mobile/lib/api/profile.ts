import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';

export interface RenterProfile {
  fullName: string;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  avatarUrl?: string;
  location?: string;
  bio?: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export const profileApi = {
  get: () => apiFetch<RenterProfile>('/renter/profile'),

  update: (input: UpdateProfileInput) =>
    apiFetch<RenterProfile>('/renter/profile', { method: 'PUT', body: input }),

  uploadAvatar: (file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<RenterProfile>('/renter/profile/avatar', form);
  },
};
