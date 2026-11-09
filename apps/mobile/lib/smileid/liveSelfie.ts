import { Platform } from 'react-native';
import { loadFaceAnalyzer } from './faceAnalyzer';
import { loadSmileSdk } from './sdk';

export { loadSmileSdk };

export function liveSelfieSupported(): boolean {
  return Platform.OS !== 'web' && loadFaceAnalyzer() !== null && loadSmileSdk() !== null;
}

export type LiveSelfieOutcome = {
  submitted: boolean;
  tone: 'success' | 'info' | 'error';
  text: string;
};

// "success" only means Smile received the capture; the verdict arrives on the server.
export function liveSelfieOutcome(result: { status: string }): LiveSelfieOutcome | null {
  switch (result.status) {
    case 'success':
      return { submitted: true, tone: 'success', text: 'Selfie sent. We are checking it now.' };
    case 'cancelled':
      return null;
    default:
      return {
        submitted: false,
        tone: 'error',
        text: 'The live selfie could not be sent. Check your connection and try again.',
      };
  }
}
