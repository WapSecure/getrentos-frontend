import { useEffect, useState } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { WifiOff } from 'lucide-react-native';
import { Text, useReducedMotion, useTheme } from '@getrentos/ui-native';

/** A global, non-blocking explanation when requests are paused by connectivity. */
export function ConnectivityBanner() {
  const { colors, spacing, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [offline, setOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    []
  );

  if (!offline) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(220)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(180)}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel="You are offline. Some information may be out of date."
      style={{
        position: 'absolute',
        top: insets.top + spacing.sm,
        left: spacing.lg,
        right: spacing.lg,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
        backgroundColor: colors.foreground,
        ...shadows.md,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <WifiOff size={16} color={colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="callout" style={{ color: colors.background, fontWeight: '700' }}>
          You&apos;re offline
        </Text>
        <Text variant="caption" style={{ color: colors.background, opacity: 0.78 }}>
          Showing saved information where available
        </Text>
      </View>
    </Animated.View>
  );
}
