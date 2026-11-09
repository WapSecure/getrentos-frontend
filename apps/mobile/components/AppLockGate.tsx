import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fingerprint, ScanFace } from '@sureground/icons/native';
import { BrandLogo, Button, LinkButton, Text, useTheme } from '@sureground/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { biometricSupport, unlockWithBiometrics, useAppLockEnabled } from '@/lib/appLock';

const RELOCK_AFTER_MS = 60_000;

export function AppLockGate() {
  const { status, signOut } = useAuth();
  const { enabled } = useAppLockEnabled();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [locked, setLocked] = useState(true);
  const [label, setLabel] = useState('Face ID');
  const [prompting, setPrompting] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const active = enabled === true && status === 'authenticated';

  // Signing in with a password, or turning the lock on, is proof enough.
  const prevStatus = useRef(status);
  const prevEnabled = useRef(enabled);
  // Set in the same commit as the unlock, so the prompt effect below skips it.
  const provenThisCommit = useRef(false);
  useEffect(() => {
    const signedIn = prevStatus.current === 'unauthenticated' && status === 'authenticated';
    const switchedOn = prevEnabled.current === false && enabled === true;
    if (signedIn || switchedOn) {
      provenThisCommit.current = true;
      setLocked(false);
    }
    prevStatus.current = status;
    prevEnabled.current = enabled;
  }, [status, enabled]);

  const unlock = useCallback(async () => {
    if (prompting) return;
    setPrompting(true);
    const ok = await unlockWithBiometrics('Unlock Sureground');
    setPrompting(false);
    if (ok) setLocked(false);
  }, [prompting]);

  useEffect(() => {
    if (!active || !locked) return;
    if (provenThisCommit.current) {
      provenThisCommit.current = false;
      return;
    }
    biometricSupport().then((s) => setLabel(s.label));
    unlock();
    // only when the lock (re)appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, locked]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current) {
        if (Date.now() - backgroundedAt.current >= RELOCK_AFTER_MS) setLocked(true);
        backgroundedAt.current = null;
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
          Unlock with {label} to continue.
        </Text>
      </View>
      <View style={{ alignSelf: 'stretch', gap: spacing.xs }}>
        <Button label={`Unlock with ${label}`} loading={prompting} onPress={unlock} />
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
