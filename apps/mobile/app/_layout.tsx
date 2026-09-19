import { useEffect, useMemo, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider, ToastProvider, useTheme } from '@getrentos/ui-native';
import { persister, queryClient } from '@/lib/query/client';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import { useMagicLink } from '@/lib/auth/useMagicLink';
import { IMPLEMENTED_PORTALS, portalHref } from '@/lib/roles';
import { HydrateThemePreference, persistThemePreference } from '@/lib/theme/preference';
import { useOnboardingSeen } from '@/lib/onboarding';
import { SplashReveal } from '@/components/SplashReveal';

export { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * The single source of navigation truth. One effect, one `router.replace` per
 * transition — never `<Redirect>` scattered across nested layouts (two of them
 * firing at once trips React's update counter on the native stack).
 */
function useProtectedRoute(onboardingSeen: boolean | null) {
  const { status, portal } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastTarget = useRef<string | null>(null);

  useEffect(() => {
    // Hold routing until the intro flag is read, so a returning user never
    // sees onboarding flash before the welcome screen.
    if (status === 'loading' || onboardingSeen === null) return;

    const root = segments[0]; // '(auth)' | '(app)' | undefined (index)
    const inApp = root === '(app)';
    const portalReady = !!portal && IMPLEMENTED_PORTALS.includes(portal);

    let target: string | null = null;
    if (status === 'unauthenticated') {
      if (inApp || root === undefined)
        target = onboardingSeen ? '/(auth)/welcome' : '/(auth)/onboarding';
    } else {
      // authenticated
      const group = (segments as string[])[1];
      if (!inApp) {
        target = portal && portalReady ? portalHref(portal) : '/(app)/portal-unavailable';
      } else if (!portalReady) {
        if (group !== 'portal-unavailable') target = '/(app)/portal-unavailable';
      } else if (portal && group?.startsWith('(') && group !== `(${portal})`) {
        // Two portals' tab groups can share a leaf name (e.g. both define
        // "account"), and group segments are invisible in the URL, so a
        // deep link or stale bookmark can resolve into the WRONG portal's
        // screen. Only re-route when the matched segment is itself a
        // portal group marker — top-level pushed screens outside any
        // group (e.g. "violations", "saved") are unambiguous by name and
        // must stay untouched here.
        target = portalHref(portal);
      }
    }

    if (target && lastTarget.current !== target) {
      lastTarget.current = target;
      router.replace(target as never);
    }
    if (!target) lastTarget.current = null;
  }, [status, portal, segments, router, onboardingSeen]);
}

const STACK_SCREEN_OPTIONS = { headerShown: false, animation: 'fade' } as const;

function Gate() {
  const { status } = useAuth();
  const { colors, scheme } = useTheme();
  const { seen: onboardingSeen } = useOnboardingSeen();
  useMagicLink();
  useProtectedRoute(onboardingSeen);

  const booting = status === 'loading' || onboardingSeen === null;

  useEffect(() => {
    // Hand the native splash over to `SplashReveal`, which covers the seam.
    if (!booting) SplashScreen.hideAsync().catch(() => undefined);
  }, [booting]);

  const screenOptions = useMemo(
    () => ({ ...STACK_SCREEN_OPTIONS, contentStyle: { backgroundColor: colors.background } }),
    [colors.background]
  );

  if (booting) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <SplashReveal />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          <ThemeProvider onPreferenceChange={persistThemePreference}>
            <HydrateThemePreference />
            <ToastProvider>
              <AuthProvider>
                <Gate />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
