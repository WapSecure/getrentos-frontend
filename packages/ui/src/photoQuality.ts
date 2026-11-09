import { assessPhotoQuality, PHOTO_PROBLEM_COPY, type PhotoProblem } from '@sureground/shared';

const CHECK_SIDE = 640;

// Advice only: it returns nothing rather than ever stand in the way of an upload.
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
