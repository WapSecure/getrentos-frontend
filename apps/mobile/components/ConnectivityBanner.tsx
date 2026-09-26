import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { CircleCheck, WifiOff } from 'lucide-react-native';
import { Text, useReducedMotion, useTheme } from '@getrentos/ui-native';

/** A global, non-blocking explanation when requests are paused by connectivity. */
export function ConnectivityBanner() {
  const { colors, spacing, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<'online' | 'offline' | 'reconnected'>('online');
  const wasOffline = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      if (offline) {
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = null;
        wasOffline.current = true;
        setStatus('offline');
        return;
      }

      if (wasOffline.current) {
        wasOffline.current = false;
        setStatus('reconnected');
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => {
          resetTimer.current = null;
          setStatus('online');
        }, 2500);
      }
    });

    return () => {
      unsubscribe();
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  if (status === 'online') return null;

  const reconnected = status === 'reconnected';
  const backgroundColor = reconnected ? colors.success : colors.foreground;
  const contentColor = reconnected ? colors.primaryForeground : colors.background;
  const title = reconnected ? 'Back online' : "You're offline";
  const message = reconnected
    ? 'Your information can refresh again'
    : 'Showing saved information where available';

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(220)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(180)}
      accessibilityRole="alert"
      accessibilityLiveRegion={reconnected ? 'polite' : 'assertive'}
      accessibilityLabel={
        reconnected
          ? 'Back online. Your information can refresh again.'
          : 'You are offline. Some information may be out of date.'
      }
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
        backgroundColor,
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
          backgroundColor: contentColor,
        }}
      >
        {reconnected ? (
          <CircleCheck size={16} color={backgroundColor} />
        ) : (
          <WifiOff size={16} color={backgroundColor} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="callout" style={{ color: contentColor, fontWeight: '700' }}>
          {title}
        </Text>
        <Text variant="caption" style={{ color: contentColor, opacity: 0.82 }}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
