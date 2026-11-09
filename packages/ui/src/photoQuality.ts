import { assessPhotoQuality, PHOTO_PROBLEM_COPY, type PhotoProblem } from '@sureground/shared';

/** The longest side the check works on: plenty to judge focus and light, quick to scan. */
const CHECK_SIDE = 640;

/**
 * Checks a picked document photo in the browser (see assessPhotoQuality).
 * Returns plain-language advice, or nothing for a good photo, a non-image, or
 * a browser that can't decode it: it never stands in the way of an upload.
 */
export async function checkPhotoQuality(file: File): Promise<string[]> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return [];
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, CHECK_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(bitmap, 0, 0, width, height);
    const problems: PhotoProblem[] = assessPhotoQuality({
      width,
      height,
      data: ctx.getImageData(0, 0, width, height).data,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
    });
    bitmap.close();
    return problems.map((p) => PHOTO_PROBLEM_COPY[p]);
  } catch {
    return [];
  }
}
