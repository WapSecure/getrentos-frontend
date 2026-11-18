import { useEffect, useId } from 'react';
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

let iosCovers = 0;

// Blocks screenshots and recording, and hides the app-switcher snapshot, while a PIN, identity or bank-account view is up.
export function useSensitiveScreen(active = true) {
  const key = `sensitive-${useId()}`;
  useEffect(() => {
    if (!active || Platform.OS === 'web') return;
    void ScreenCapture.preventScreenCaptureAsync(key).catch(() => undefined);
    // Android's FLAG_SECURE already blanks the recents preview; iOS needs its own cover.
    if (Platform.OS === 'ios' && iosCovers++ === 0) {
      void ScreenCapture.enableAppSwitcherProtectionAsync(1).catch(() => undefined);
    }
    return () => {
      void ScreenCapture.allowScreenCaptureAsync(key).catch(() => undefined);
      if (Platform.OS === 'ios' && --iosCovers === 0) {
        void ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => undefined);
      }
    };
  }, [active, key]);
}
