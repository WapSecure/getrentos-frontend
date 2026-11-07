import type { FaceAnalyzer } from './faceAnalyzer';

/** Google ML Kit. Loaded lazily: Expo Go has no Smile ID native code, so it throws there. */
export function loadFaceAnalyzer(): FaceAnalyzer | null {
  try {
    // Loaded lazily: a static import throws where the native module is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@smileid/usesmileid_mlkit_face').useSmileIDMlkitFace as FaceAnalyzer;
  } catch {
    return null;
  }
}
