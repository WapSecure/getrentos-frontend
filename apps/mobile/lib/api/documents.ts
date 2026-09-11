import { apiUpload } from './client';

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
  version: number;
  status: 'active' | 'expiring' | 'expired';
  tags?: string[];
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
};
