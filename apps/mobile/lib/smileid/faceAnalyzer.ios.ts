import type { FaceAnalyzer } from './faceAnalyzer';

export function loadFaceAnalyzer(): FaceAnalyzer | null {
  try {
    // Loaded lazily: a static import throws where the native module is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@smileid/usesmileid_vision_face').useSmileIDVisionFace as FaceAnalyzer;
  } catch {
    return null;
  }
}
