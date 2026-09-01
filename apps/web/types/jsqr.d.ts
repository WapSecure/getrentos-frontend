/**
 * Ambient type declarations for `jsqr` (the package ships no TypeScript types).
 * Based on the public jsQR API surface used by the gateman QR verify flow.
 */
declare module 'jsqr' {
  export interface QRCode {
    data: string;
    binaryData: number[];
    chunks: Array<{
      type: number;
      text?: string;
      mode?: number;
      bytes?: Uint8Array;
      version?: { info: number; versionNumber: number };
    }>;
    location: {
      topRightCorner: { x: number; y: number };
      topLeftCorner: { x: number; y: number };
      bottomRightCorner: { x: number; y: number };
      bottomLeftCorner: { x: number; y: number };
      topRightFinderPattern: { x: number; y: number };
      topLeftFinderPattern: { x: number; y: number };
      bottomLeftFinderPattern: { x: number; y: number };
      bottomRightFinderPattern: { x: number; y: number };
    };
  }

  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): QRCode | null;
}
