import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BrandLogo, Text, useReducedMotion, useTheme } from '@sureground/ui-native';

// Kept short: every millisecond here is launch time the user waits through.
const MARK_IN = 380;
const HOLD = 160;
const FADE_OUT = 280;

export function SplashReveal() {
  const { colors, spacing } = useTheme();
  const reduceMotion = useReducedMotion();
  const [done, setDone] = useState(false);

  const markScale = useSharedValue(0.86);
  const markOpacity = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const cover = useSharedValue(1);

  useEffect(() => {
    const finish = (finished?: boolean) => {
      'worklet';
      if (finished) scheduleOnRN(setDone, true);
    };
    if (reduceMotion) {
      markOpacity.set(1);
      markScale.set(1);
      wordOpacity.set(1);
      cover.set(withDelay(HOLD, withTiming(0, { duration: FADE_OUT }, finish)));
      return;
    }
    markOpacity.set(withTiming(1, { duration: MARK_IN, easing: Easing.out(Easing.cubic) }));
    markScale.set(withTiming(1, { duration: MARK_IN, easing: Easing.out(Easing.back(1.4)) }));
    wordOpacity.set(
      withDelay(180, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }))
    );
    cover.set(
      withDelay(
        MARK_IN + HOLD,
        withTiming(0, { duration: FADE_OUT, easing: Easing.inOut(Easing.quad) }, finish)
      )
    );
  }, [markOpacity, markScale, wordOpacity, cover, reduceMotion]);

  const coverStyle = useAnimatedStyle(() => ({ opacity: cover.get() }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.get(),
    transform: [{ scale: markScale.get() }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.get(),
    transform: [{ translateY: (1 - wordOpacity.get()) * 8 }],
  }));

  if (done) return null;

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
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
          <Text
            style={{
              color: colors.foreground,
              fontSize: 26,
              lineHeight: 30,
              fontWeight: '800',
              letterSpacing: -0.65,
            }}
          >
            Sureground
          </Text>
          <Text variant="caption" color="mutedForeground">
            Rent, buy and manage: safely
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
