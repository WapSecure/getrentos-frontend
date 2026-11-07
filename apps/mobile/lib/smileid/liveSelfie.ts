import { Platform } from 'react-native';
import { loadFaceAnalyzer } from './faceAnalyzer';

/** Smile ID's React Native SDK, or null where its native code isn't in the build (Expo Go, web). */
export function loadSmileSdk(): typeof import('@smileid/usesmileid') | null {
  if (Platform.OS === 'web') return null;
  try {
    // Loaded lazily: a static import throws where the native module is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@smileid/usesmileid');
  } catch {
    return null;
  }
}

/** Whether this build can run the live selfie check; otherwise the photo upload is offered. */
export function liveSelfieSupported(): boolean {
  return Platform.OS !== 'web' && loadFaceAnalyzer() !== null && loadSmileSdk() !== null;
}

export type LiveSelfieOutcome = {
  /** True once Smile has the capture; the verdict then arrives on the server. */
  submitted: boolean;
  tone: 'success' | 'info' | 'error';
  text: string;
};

/**
 * What to tell the person when Smile's flow closes. The app never learns the
 * verdict: "success" only means Smile received the capture, so the message
 * says it is being checked, and the check itself shows the result once the
 * server has it.
 */
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
