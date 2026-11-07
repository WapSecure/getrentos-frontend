import type { FaceAnalyzerScope } from '@smileid/usesmileid';

/** The analyzer type Smile ID's selfie capture takes. */
export type FaceAnalyzer = Parameters<FaceAnalyzerScope['add']>[0];

/**
 * The on-device face analyzer Smile ID's live selfie check runs on. Metro picks
 * `faceAnalyzer.ios.ts` (Apple Vision) or `faceAnalyzer.android.ts` (ML Kit);
 * anywhere else (web, tests) there is none and the check is unavailable.
 */
export function loadFaceAnalyzer(): FaceAnalyzer | null {
  return null;
}
