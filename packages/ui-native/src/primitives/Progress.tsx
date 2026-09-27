import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useReducedMotion } from '../accessibility';

export interface ProgressProps {
  /** 0…1 */
  value: number;
  height?: number;
  /** Spoken by screen readers, e.g. "Sign-up progress". */
  accessibilityLabel?: string;
}

const SPRING = { damping: 20, stiffness: 140 };

/** Slim spring-animated progress bar for multi-step flows. */
export function Progress({ value, height = 4, accessibilityLabel }: ProgressProps) {
  const { colors, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, value));
  const width = useSharedValue(clamped);

  // Animate on the shared value itself so the style worklet stays a pure read.
  useEffect(() => {
    width.set(reduceMotion ? clamped : withSpring(clamped, SPRING));
  }, [clamped, reduceMotion, width]);

  const style = useAnimatedStyle(() => ({ width: `${width.get() * 100}%` }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{
        height,
        borderRadius: radius.full,
        backgroundColor: colors.secondary,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[{ height, borderRadius: radius.full, backgroundColor: colors.primary }, style]}
      />
    </View>
  );
}
