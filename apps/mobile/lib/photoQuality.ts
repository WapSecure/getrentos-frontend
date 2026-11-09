import { Image, Platform } from 'react-native';
import { assessPhotoQuality, PHOTO_PROBLEM_COPY } from '@sureground/shared';
import type { PickedFile } from '@/lib/api/documents';

/** The longest side the check works on: enough to judge focus and light, quick to decode. */
const CHECK_SIDE = 640;

const originalSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject)
  );

export function base64ToBytes(b64: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < alphabet.length; i++) lookup[alphabet.charCodeAt(i)] = i;
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = lookup[clean.charCodeAt(i)];
    const b = lookup[clean.charCodeAt(i + 1)];
    const c = lookup[clean.charCodeAt(i + 2)];
    const d = lookup[clean.charCodeAt(i + 3)];
    bytes[p++] = (a << 2) | (b >> 4);
    if (i + 2 < clean.length) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < clean.length) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes.subarray(0, p);
}

/**
 * Checks a photo of a document right after it is taken or picked: a 640 px
 * copy, scored for blur, darkness, glare and size (assessPhotoQuality).
 * Returns plain-language retake advice, or nothing for a good photo, a PDF,
 * or anything it can't read: it never stands in the way of an upload.
 */
export async function checkPickedPhoto(file: PickedFile): Promise<string[]> {
  if (!file.mimeType?.startsWith('image/') || Platform.OS === 'web') return [];
  try {
    const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
    const { decode } = await import('jpeg-js');
    const original = await originalSize(file.uri);
    const scale = Math.min(1, CHECK_SIDE / Math.max(original.width, original.height));
    const context = ImageManipulator.manipulate(file.uri);
    context.resize({ width: Math.max(1, Math.round(original.width * scale)) });
    const ref = await context.renderAsync();
    const saved = await ref.saveAsync({ base64: true, format: SaveFormat.JPEG, compress: 0.9 });
    if (!saved.base64) return [];
    const pixels = decode(base64ToBytes(saved.base64), { useTArray: true, formatAsRGBA: true });
    return assessPhotoQuality({
      width: pixels.width,
      height: pixels.height,
      data: pixels.data,
      originalWidth: original.width,
      originalHeight: original.height,
    }).map((p) => PHOTO_PROBLEM_COPY[p]);
  } catch {
    return [];
  }
}
