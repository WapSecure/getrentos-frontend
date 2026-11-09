import type { FaceAnalyzerScope } from '@smileid/usesmileid';

export type FaceAnalyzer = Parameters<FaceAnalyzerScope['add']>[0];

// Metro picks the .ios or .android file; elsewhere (web, tests) there is no analyzer.
export function loadFaceAnalyzer(): FaceAnalyzer | null {
  return null;
}
