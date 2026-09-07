import { forwardRef } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends PressableProps {
  /** Scale at the bottom of the press. Default 0.97. */
  activeScale?: number;
  /** Fire a selection haptic on press-in (native only). Default true. */
  haptic?: boolean;
}

/**
 * The tap target for the whole app. Springs down on press, springs back on
 * release, and gives a light selection haptic — the baseline "this is a real
 * app" feel. Use everywhere instead of a bare Pressable.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  { activeScale = 0.97, haptic = true, onPressIn, onPressOut, style, children, disabled, ...rest },
  ref
) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(1 - pressed.value * (1 - activeScale), { mass: 0.4, damping: 12 }) },
    ],
    opacity: withTiming(disabled ? 0.5 : 1 - pressed.value * 0.08, { duration: 90 }),
  }));

  return (
    <AnimatedPressable
      ref={ref}
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        pressed.value = 1;
        if (haptic && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        pressed.value = 0;
        onPressOut?.(e);
      }}
      style={[animatedStyle, style as object]}
      {...rest}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
});
