import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { BrandLogo, Text, useTheme } from '@getrentos/ui-native';

const MARK_IN = 460;
const HOLD = 420;
const FADE_OUT = 360;

/**
 * Brand reveal that covers the handoff from the native splash to the first
 * screen, so a cold start resolves into the app instead of cutting to it.
 * Unmounts itself once it has faded out.
 */
export function SplashReveal() {
  const { colors, spacing } = useTheme();
  const [done, setDone] = useState(false);

  const markScale = useSharedValue(0.86);
  const markOpacity = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const cover = useSharedValue(1);

  useEffect(() => {
    markOpacity.value = withTiming(1, { duration: MARK_IN, easing: Easing.out(Easing.cubic) });
    markScale.value = withTiming(1, { duration: MARK_IN, easing: Easing.out(Easing.back(1.4)) });
    wordOpacity.value = withDelay(
      220,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );
    cover.value = withDelay(
      MARK_IN + HOLD,
      withTiming(0, { duration: FADE_OUT, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) runOnJS(setDone)(true);
      })
    );
  }, [markOpacity, markScale, wordOpacity, cover]);

  const coverStyle = useAnimatedStyle(() => ({ opacity: cover.value }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: (1 - wordOpacity.value) * 8 }],
  }));

  if (done) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          // The router's native screen container composites above plain siblings on
          // Android regardless of order, so lift this overlay explicitly.
          zIndex: 100,
          elevation: 100,
        },
        coverStyle,
      ]}
    >
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <Animated.View style={markStyle}>
          <BrandLogo size={64} showWordmark={false} />
        </Animated.View>
        <Animated.View style={[{ alignItems: 'center', gap: spacing.xs }, wordStyle]}>
          {/* wordmark only — the mark above already carries the brand */}
          <Text style={{ fontSize: 26, lineHeight: 30, fontWeight: '800' }}>
            <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: '800' }}>Get</Text>
            <Text style={{ color: colors.primary, fontSize: 26, fontWeight: '800' }}>Rentos</Text>
          </Text>
          <Text variant="caption" color="mutedForeground">
            Rent, buy and manage — safely
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
