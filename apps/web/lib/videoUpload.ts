import { ApiError, authFetch, authUpload, type UploadOptions } from '@/lib/apiHelpers';
import {
  StorageUploadError,
  putToStorage,
  videoContentType,
  type StorageUploadSession,
} from '@/lib/storageUpload';

export interface UploadedVideo {
  key: string;
  kind: 'video';
}

/**
 * Uploads a video straight to storage: the API signs a short-lived link for its own key, the browser PUTs the
 * file there, then the API checks it. `basePath` is the owning route, e.g. `/landlord/properties`. Falls back to
 * the multipart route when the API does not offer direct uploads yet.
 */
export async function uploadVideoDirect(
  basePath: string,
  file: File,
  upload?: UploadOptions
): Promise<UploadedVideo> {
  let session: StorageUploadSession;
  try {
    session = await authFetch<StorageUploadSession>(`${basePath}/media/video-upload`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: videoContentType(file),
        sizeBytes: file.size,
      }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const form = new FormData();
      form.append('kind', 'video');
      form.append('file', file);
      const path = `${basePath}/media/upload`;
      const legacy = upload
        ? await authUpload<{ key: string }>(path, form, upload)
        : await authFetch<{ key: string }>(path, { method: 'POST', body: form });
      return { key: legacy.key, kind: 'video' };
    }
    throw error;
  }
  try {
    await putToStorage(session, file, upload);
  } catch (error) {
    // Same error type as every other API failure, so callers show it the same way.
    if (error instanceof StorageUploadError) throw new ApiError(error.status, error.message);
    throw error;
  }
  return authFetch<UploadedVideo>(`${basePath}/media/video-upload/complete`, {
    method: 'POST',
    body: JSON.stringify({ key: session.key }),
  });
}
