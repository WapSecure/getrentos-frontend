import { useEffect, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useLegacyStorageMigrated } from '@/lib/legacyStorage';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider, ToastProvider, useTheme } from '@sureground/ui-native';
import { queryClient, queryPersistenceOptions } from '@/lib/query/client';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import { useMagicLink } from '@/lib/auth/useMagicLink';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useOverTheAirUpdates } from '@/hooks/useOverTheAirUpdates';
import { portalHref, samePortalScreenHref } from '@/lib/roles';
import { LISTING_AUDIENCE, portalForPendingListing, takeListingIntent } from '@/lib/pendingListing';
import { takeAskIntent } from '@/lib/askDeveloper';
import { HydrateThemePreference, persistThemePreference } from '@/lib/theme/preference';
import { BRAND_FONT_SOURCES, BRAND_FONTS, DISPLAY_FONT } from '@/lib/theme/fonts';
import { useOnboardingSeen } from '@/lib/onboarding';
import { SplashReveal } from '@/components/SplashReveal';
import { AppLockGate } from '@/components/AppLockGate';
import { ConnectivityBanner } from '@/components/ConnectivityBanner';
import { Sentry } from '@/lib/monitoring';
import { StepUpSheet } from '@/components/StepUpSheet';
import { PaymentResultSheet } from '@/components/payments/PaymentResultSheet';
import { WebAlertHost } from '@/components/WebAlertHost';
import { installWebAlert } from '@/lib/installWebAlert';

// Before any screen can raise one: React Native's Alert does nothing on web.
installWebAlert();

export { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** One effect, one `router.replace` per transition: scattered `<Redirect>`s trip React's update counter on the native stack. */
function useProtectedRoute(onboardingSeen: boolean | null) {
  const { status, usablePortal, workspaces, switchWorkspace } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastTarget = useRef<string | null>(null);

  useEffect(() => {
    // Hold routing until the intro flag is read, so a returning user never
    // sees onboarding flash before the welcome screen.
    if (status === 'loading' || onboardingSeen === null) return;

    const root = segments[0];
    const inApp = root === '(app)';
    // Route on the portal we can open, not the most senior role, which may have no screens yet.
    const portalReady = !!usablePortal;

    // Signed in from a public listing that the current workspace can't open,
    // but another of theirs can: open that one first, then route on the next pass.
    if (status === 'authenticated' && !inApp && usablePortal) {
      const wanted = portalForPendingListing(usablePortal, workspaces);
      if (wanted && wanted !== usablePortal) {
        switchWorkspace(wanted);
        return;
      }
    }

    let target: string | null = null;
    if (status === 'unauthenticated') {
      if (inApp || root === undefined)
        target = onboardingSeen ? '/(auth)/welcome' : '/(auth)/onboarding';
    } else if (root !== '(public)') {
      const group = (segments as string[])[1];
      if (!inApp) {
        target = portalReady ? portalHref(usablePortal) : '/(app)/portal-unavailable';
      } else if (!portalReady) {
        if (group !== 'portal-unavailable') target = '/(app)/portal-unavailable';
      } else if (usablePortal && group?.startsWith('(') && group !== `(${usablePortal})`) {
        // Group segments are invisible in URLs, so a deep link can resolve into another portal's same-named screen; only re-route on a portal group marker.
        // Open that screen in the user's own portal when it has one, else its home.
        target =
          samePortalScreenHref(usablePortal, (segments as string[])[2]) ?? portalHref(usablePortal);
      }
    }

    if (target && lastTarget.current !== target) {
      lastTarget.current = target;
      router.replace(target as never);
      // Signed in from a public listing: land on it, with the portal home
      // underneath so Back goes somewhere sensible.
      if (status === 'authenticated' && portalReady && !inApp) {
        // Or back on the development they wanted to ask about: any signed-in user may ask.
        const askHref = takeAskIntent();
        const { href, blockedKind } = takeListingIntent(usablePortal);
        if (askHref) router.push(askHref as never);
        else if (href) router.push(href);
        else if (blockedKind && LISTING_AUDIENCE[blockedKind]) {
          const who = LISTING_AUDIENCE[blockedKind];
          Alert.alert(
            `Open this home from a ${who} account`,
            `You're signed in, but ${blockedKind === 'rent' ? 'rental enquiries' : 'offers'} come from a ${who} workspace. Add one from Account, then open the listing again.`
          );
        }
      }
    }
    if (!target) lastTarget.current = null;
  }, [status, usablePortal, workspaces, switchWorkspace, segments, router, onboardingSeen]);
}

const STACK_SCREEN_OPTIONS = { headerShown: false, animation: 'fade' } as const;

function Gate() {
  const { status } = useAuth();
  const { colors, scheme } = useTheme();
  const { seen: onboardingSeen } = useOnboardingSeen();
  useMagicLink();
  usePushNotifications();
  useOverTheAirUpdates();
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
        <Stack.Screen name="(market)" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <AppLockGate />
      <StepUpSheet />
      <PaymentResultSheet />
      <SplashReveal />
      <ConnectivityBanner />
    </>
  );
}

function RootLayout() {
  // The native splash stays up until the typeface loads; if it fails, the platform face stands in.
  const [fontsLoaded, fontError] = useFonts(BRAND_FONT_SOURCES);
  // Stored GetRentos-era keys move to their Sureground names before anything reads them.
  const storageReady = useLegacyStorageMigrated();
  if ((!fontsLoaded && !fontError) || !storageReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={queryPersistenceOptions}>
          <ThemeProvider
            onPreferenceChange={persistThemePreference}
            fonts={fontsLoaded ? BRAND_FONTS : undefined}
            displayFont={fontsLoaded ? DISPLAY_FONT : undefined}
          >
            <HydrateThemePreference />
            <ToastProvider>
              <AuthProvider>
                <Gate />
                {/* Outside Gate, so an alert raised while it boots still shows. */}
                <WebAlertHost />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
