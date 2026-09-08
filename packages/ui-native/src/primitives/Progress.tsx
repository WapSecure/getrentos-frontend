import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme';

export interface ProgressProps {
  /** 0…1 */
  value: number;
  height?: number;
}

/** Slim spring-animated progress bar for multi-step flows. */
export function Progress({ value, height = 4 }: ProgressProps) {
  const { colors, radius } = useTheme();
  const w = useSharedValue(value);

  useEffect(() => {
    w.value = Math.max(0, Math.min(1, value));
  }, [value, w]);

  const style = useAnimatedStyle(() => ({
    width: `${withSpring(w.value * 100, { damping: 20, stiffness: 140 })}%`,
  }));

  return (
    <View
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
