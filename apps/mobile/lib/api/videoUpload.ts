import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { ApiError, apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';

interface VideoUploadSession {
  key: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

export interface UploadedVideo {
  key: string;
  kind: 'video';
}

const TYPE_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  webm: 'video/webm',
};

/** Pickers often report no type (or a generic one) for camera recordings, so the extension decides. */
export function videoContentType(file: PickedFile): string {
  const declared = (file.mimeType ?? '').toLowerCase();
  if (declared === 'video/mp4' || declared === 'video/quicktime' || declared === 'video/webm')
    return declared;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXTENSION[ext] ?? (declared || 'video/mp4');
}

/** Streams the file from disk on iOS/Android, so a 150 MB video is never held in memory. */
async function putFile(
  session: VideoUploadSession,
  file: PickedFile,
  webBlob: Blob | null,
  onProgress?: (fraction: number) => void
): Promise<void> {
  if (webBlob) {
    const res = await fetch(session.uploadUrl, {
      method: 'PUT',
      headers: session.headers,
      body: webBlob,
    });
    if (!res.ok) throw new Error(`Video upload failed (${res.status})`);
    onProgress?.(1);
    return;
  }
  const result = await new File(file.uri).upload(session.uploadUrl, {
    httpMethod: 'PUT',
    headers: session.headers,
    onProgress: ({ bytesSent, totalBytes }) => {
      if (totalBytes > 0) onProgress?.(bytesSent / totalBytes);
    },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Video upload failed (${result.status})`);
  }
}

/**
 * Uploads a video straight to storage: the API signs a short-lived link for its own key, the file goes
 * to storage, then the API checks it. `basePath` is the owning route, e.g. `/landlord/properties`.
 * Falls back to the multipart route when the API does not offer direct uploads yet.
 */
export async function uploadVideoDirect(
  basePath: string,
  file: PickedFile,
  onProgress?: (fraction: number) => void
): Promise<UploadedVideo> {
  const contentType = videoContentType(file);
  // In the browser the picked file is a blob URL: read it once, for its size and for the upload.
  const webBlob = Platform.OS === 'web' ? await (await fetch(file.uri)).blob() : null;
  const sizeBytes = webBlob ? webBlob.size : (new File(file.uri).size ?? 0);
  let session: VideoUploadSession;
  try {
    session = await apiFetch<VideoUploadSession>(`${basePath}/media/video-upload`, {
      method: 'POST',
      body: { filename: file.name, contentType, sizeBytes },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const form = new FormData();
      appendFile(form, 'file', file);
      form.append('kind', 'video');
      const legacy = await apiUpload<{ key: string }>(`${basePath}/media/upload`, form);
      return { key: legacy.key, kind: 'video' };
    }
    throw error;
  }
  await putFile(session, file, webBlob, onProgress);
  return apiFetch<UploadedVideo>(`${basePath}/media/video-upload/complete`, {
    method: 'POST',
    body: { key: session.key },
  });
}
