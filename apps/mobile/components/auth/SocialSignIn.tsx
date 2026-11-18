import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Button, Text, useTheme } from '@sureground/ui-native';
import { ApiError } from '@/lib/api/client';
import { signInErrorMessage } from '@/lib/auth/signupErrors';
import { useAuth } from '@/lib/auth/AuthProvider';
import { OAuthCancelled } from '@/lib/auth/oauth';
import { AppleSignInCancelled, appleSignInAvailable } from '@/lib/auth/apple';
import { haptics } from '@/lib/haptics';
import { GoogleMark } from './GoogleMark';

/** Apple and Google, for sign-in and sign-up alike. A new account is routed to role selection by the root router. */
export function SocialSignIn({ onError }: { onError: (message: string | null) => void }) {
  const { signInWithProvider, signInWithApple } = useAuth();
  const { colors, spacing, scheme } = useTheme();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    appleSignInAvailable().then(setAppleAvailable);
  }, []);

  const apple = async () => {
    onError(null);
    try {
      const { requiresTwoFactor } = await signInWithApple();
      await haptics.success();
      if (requiresTwoFactor) router.push('/(auth)/two-factor');
    } catch (err) {
      if (err instanceof AppleSignInCancelled) return;
      await haptics.error();
      onError(signInErrorMessage(err, 'Could not sign in with Apple. Try again.'));
    }
  };

  const google = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    onError(null);
    try {
      const { requiresTwoFactor } = await signInWithProvider('google');
      await haptics.success();
      if (requiresTwoFactor) router.push('/(auth)/two-factor');
    } catch (err) {
      if (!(err instanceof OAuthCancelled)) {
        await haptics.error();
        onError(
          err instanceof ApiError
            ? signInErrorMessage(err, 'Could not sign in with Google. Try again.')
            : err instanceof Error && err.message
              ? err.message
              : 'Could not sign in with Google. Try again.'
        );
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text variant="caption" color="mutedForeground">
          or
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      {appleAvailable ? (
        // Apple's own button, as their guidelines require.
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={14}
          style={{ height: 50 }}
          onPress={apple}
        />
      ) : null}

      <Button
        label="Continue with Google"
        variant="outline"
        icon={<GoogleMark />}
        loading={googleBusy}
        onPress={google}
      />
    </View>
  );
}
