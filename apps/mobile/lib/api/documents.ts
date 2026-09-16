import { apiFetch, apiUpload } from './client';
import type { Paginated } from './properties';

export interface RenterDocument {
  id: string;
  name: string;
  type: 'lease' | 'receipt' | 'inspection' | 'other';
  category: string;
  size: string;
  uploadedAt: string;
  updatedAt: string;
  url: string;
  isFavorite: boolean;
  sharedWith?: string[];
  expiryDate?: string;
  version: number;
  status: 'active' | 'expiring' | 'expired';
  tags?: string[];
}

export interface RenterDocumentSummary {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  favorites: number;
  shared: number;
  storageUsedBytes: number;
  categories: Record<string, number>;
  types: Record<string, number>;
}

/** A file picked on-device, in the shape `expo-document-picker` / `expo-image-picker` return. */
export interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string | null;
}

/** React Native's `fetch` accepts `{ uri, name, type }` for a file part — the DOM `FormData` types don't know that shape. */
export function appendFile(form: FormData, field: string, file: PickedFile) {
  form.append(field, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as unknown as Blob);
}

export const documentsApi = {
  list: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<RenterDocument>>(`/renter/documents?page=${page}&pageSize=${pageSize}`),

  getSummary: () => apiFetch<RenterDocumentSummary>('/renter/documents/summary'),

  /** Uploads a file to the renter's document library and returns the stored record. */
  upload: (file: PickedFile, name: string, type: string, category: string, tags: string[] = []) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    form.append('name', name);
    form.append('type', type);
    form.append('category', category);
    tags.forEach((t) => form.append('tags[]', t));
    return apiUpload<RenterDocument>('/renter/documents', form);
  },

  getDownloadUrl: (id: string) =>
    apiFetch<{ url: string; name: string }>(`/renter/documents/${id}/download`),

  toggleFavorite: (id: string) =>
    apiFetch<RenterDocument>(`/renter/documents/${id}/favorite`, { method: 'PATCH' }),

  share: (id: string, email: string) =>
    apiFetch<RenterDocument>(`/renter/documents/${id}/share`, { method: 'POST', body: { email } }),

  remove: (id: string) => apiFetch<void>(`/renter/documents/${id}`, { method: 'DELETE' }),
};
