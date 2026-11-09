import type { SmileSdk } from './sdk';

// Loaded lazily: Expo Go has no Smile ID native code, so the require throws there.
export function loadSmileSdk(): SmileSdk | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@smileid/usesmileid');
  } catch {
    return null;
  }
}
