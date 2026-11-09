// Advisory only: some borderline photos are readable. Callers decode and shrink the image (longest
// side about 640 px) first.
export type PhotoProblem = 'TOO_SMALL' | 'TOO_DARK' | 'GLARE' | 'BLURRY';

export interface PhotoPixels {
  /** Size of the shrunk image `data` describes. */
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel. */
  data: Uint8Array | Uint8ClampedArray;
  /** Size of the original photo, before shrinking. */
  originalWidth: number;
  originalHeight: number;
}

export const MIN_DOCUMENT_PHOTO_SIDE = 600;
const DARK_MEAN = 50;
const GLARE_LEVEL = 253;
const GLARE_SHARE = 0.2;
/** Edge sharpness (variance of the Laplacian) below which text is smeared. */
const BLUR_VARIANCE = 40;

export const PHOTO_PROBLEM_COPY: Record<PhotoProblem, string> = {
  TOO_SMALL:
    'This photo is too small to read. Retake it closer, with the document filling the frame.',
  TOO_DARK: 'This photo is too dark. Retake it in better light.',
  GLARE:
    'Part of this photo is washed out by light or glare. Tilt the document away from the light and retake it.',
  BLURRY: 'This photo looks blurry. Hold steady, let the camera focus, then retake it.',
};

export function assessPhotoQuality(photo: PhotoPixels): PhotoProblem[] {
  const problems: PhotoProblem[] = [];
  if (Math.min(photo.originalWidth, photo.originalHeight) < MIN_DOCUMENT_PHOTO_SIDE) {
    problems.push('TOO_SMALL');
  }

  const { width, height, data } = photo;
  const pixels = width * height;
  if (pixels === 0) return problems;
  const gray = new Float32Array(pixels);
  let sum = 0;
  let bright = 0;
  for (let i = 0; i < pixels; i++) {
    const o = i * 4;
    const y = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    gray[i] = y;
    sum += y;
    if (y >= GLARE_LEVEL) bright++;
  }
  if (sum / pixels < DARK_MEAN) problems.push('TOO_DARK');
  if (bright / pixels > GLARE_SHARE) problems.push('GLARE');

  // Skipped when the photo is dark, since that is the problem to fix first.
  if (!problems.includes('TOO_DARK') && width > 2 && height > 2) {
    let lapSum = 0;
    let lapSq = 0;
    let n = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const lap = gray[i - width] + gray[i + width] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
        lapSum += lap;
        lapSq += lap * lap;
        n++;
      }
    }
    const mean = lapSum / n;
    if (lapSq / n - mean * mean < BLUR_VARIANCE) problems.push('BLURRY');
  }
  return problems;
}
