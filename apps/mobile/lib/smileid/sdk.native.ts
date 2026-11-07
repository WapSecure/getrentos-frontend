import type { SmileSdk } from './sdk';

/** iOS and Android. Loaded lazily: Expo Go has no Smile ID native code, so it throws there. */
export function loadSmileSdk(): SmileSdk | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@smileid/usesmileid');
  } catch {
    return null;
  }
}
