import { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '@sureground/ui-native';
import { biometricSupport, unlockWithBiometrics, useAppLockEnabled } from '@/lib/appLock';

const OFFERED_KEY = 'sureground.appLockOffered';
// Lets the home screen settle before asking.
const OFFER_DELAY_MS = 1500;

/** Asks once, on the first portal home after sign-in, whether to lock the app with biometrics. */
export function useAppLockOffer(active: boolean) {
  const { enabled, setEnabled } = useAppLockEnabled();
  const toast = useToast();

  useEffect(() => {
    if (!active || enabled !== false) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const offered = await AsyncStorage.getItem(OFFERED_KEY).catch(() => '1');
      if (cancelled || offered) return;
      const support = await biometricSupport();
      if (cancelled || !support.available) return;
      await AsyncStorage.setItem(OFFERED_KEY, '1').catch(() => undefined);
      Alert.alert(
        `Lock Sureground with ${support.label}?`,
        `We’ll ask for ${support.label} when the app opens, so no one else can see your account on this phone. You can change this in Security.`,
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Turn on',
            onPress: async () => {
              const ok = await unlockWithBiometrics(`Turn on ${support.label} for Sureground`);
              if (!ok) return;
              setEnabled(true);
              toast.show(`${support.label} lock is on.`, 'success');
            },
          },
        ]
      );
    }, OFFER_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, enabled, setEnabled, toast]);
}
