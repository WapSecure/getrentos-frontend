/** Document photo checks run on the device before upload (step 3: fewer rejected photos). */
import { assessPhotoQuality } from '@getrentos/shared';

const W = 200;
const H = 140;
const image = (pixel: (x: number, y: number) => number, size = { w: 1200, h: 840 }) => {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = pixel(x, y);
      const o = (y * W + x) * 4;
      data[o] = data[o + 1] = data[o + 2] = v;
      data[o + 3] = 255;
    }
  return { width: W, height: H, data, originalWidth: size.w, originalHeight: size.h };
};
// Black "print" on light paper: sharp edges.
const printed = (x: number, y: number) =>
  (Math.floor(x / 3) + Math.floor(y / 5)) % 4 === 0 ? 20 : 225;

describe('assessPhotoQuality', () => {
  it('passes a sharp, well-lit document', () => {
    expect(assessPhotoQuality(image(printed))).toEqual([]);
  });

  it('flags a blurry photo (no sharp edges)', () => {
    expect(assessPhotoQuality(image((x) => 120 + Math.round(40 * Math.sin(x / 30))))).toEqual([
      'BLURRY',
    ]);
  });

  it('flags a dark photo', () => {
    expect(assessPhotoQuality(image((x, y) => printed(x, y) / 8))).toContain('TOO_DARK');
  });

  it('flags glare: a large washed-out area', () => {
    expect(assessPhotoQuality(image((x, y) => (x < W / 2 ? 255 : printed(x, y))))).toContain(
      'GLARE'
    );
  });

  it('does not call ordinary white paper glare', () => {
    expect(assessPhotoQuality(image((x, y) => (printed(x, y) === 225 ? 240 : 20)))).not.toContain(
      'GLARE'
    );
  });

  it('flags a photo too small to read', () => {
    expect(assessPhotoQuality(image(printed, { w: 480, h: 360 }))).toContain('TOO_SMALL');
  });
});
