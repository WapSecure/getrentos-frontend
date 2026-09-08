import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider, ToastProvider, useTheme } from '@getrentos/ui-native';
import { persister, queryClient } from '@/lib/query/client';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import { useMagicLink } from '@/lib/auth/useMagicLink';

export { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Gate() {
  const { status } = useAuth();
  const { colors, scheme } = useTheme();
  useMagicLink();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => undefined);
  }, [status]);

  if (status === 'loading') return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          <ThemeProvider>
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
