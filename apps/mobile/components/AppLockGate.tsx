import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fingerprint, ScanFace } from '@sureground/icons/native';
import { BrandLogo, Button, LinkButton, Text, useTheme } from '@sureground/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  biometricSupport,
  isAppLockEnabled,
  setAppForeground,
  setAppLocked,
  useAppLockEnabled,
  useAppLocked,
} from '@/lib/appLock';

const RELOCK_AFTER_MS = 60_000;

export function AppLockGate() {
  const { status, signOut, unlock } = useAuth();
  const { enabled } = useAppLockEnabled();
  const locked = useAppLocked();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [label, setLabel] = useState('Face ID');
  const [prompting, setPrompting] = useState(false);
  const [failed, setFailed] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  // An unknown flag counts as on, so nothing shows before the lock does.
  const active = enabled !== false && status === 'authenticated';

  const tryUnlock = useCallback(async () => {
    if (prompting) return;
    setPrompting(true);
    setFailed(false);
    const result = await unlock();
    setPrompting(false);
    if (result === 'failed') setFailed(true);
  }, [prompting, unlock]);

  useEffect(() => {
    if (!active || !locked) return;
    biometricSupport().then((s) => {
      setLabel(s.label);
      tryUnlock();
    });
    // only when the lock (re)appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, locked]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backgroundedAt.current = Date.now();
        setAppForeground(false);
      }
      if (state === 'active') {
        const away = backgroundedAt.current;
        backgroundedAt.current = null;
        if (away && Date.now() - away >= RELOCK_AFTER_MS && isAppLockEnabled()) {
          setAppLocked(true);
        }
        setAppForeground(true);
      }
    });
    return () => sub.remove();
  }, []);

  if (!active || !locked) return null;

  const Icon = label === 'Face ID' || label === 'face unlock' ? ScanFace : Fingerprint;

  return (
    <View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 200,
          elevation: 200,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom,
          gap: spacing.xl,
        },
      ]}
    >
      <BrandLogo size={28} />
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Icon size={44} color={colors.primary} />
        <Text variant="heading" headingLevel={2}>
          Sureground is locked
        </Text>
        <Text variant="callout" color="mutedForeground" center>
          {failed
            ? `We couldn’t confirm it’s you. Try ${label} again, or sign in with your password.`
            : `Unlock with ${label} to continue.`}
        </Text>
      </View>
      <View style={{ alignSelf: 'stretch', gap: spacing.xs }}>
        <Button label={`Unlock with ${label}`} loading={prompting} onPress={tryUnlock} />
        <LinkButton
          label="Sign in with your password instead"
          tone="muted"
          style={{ alignSelf: 'center' }}
          onPress={signOut}
        />
      </View>
    </View>
  );
}
