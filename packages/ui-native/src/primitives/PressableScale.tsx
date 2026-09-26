import { forwardRef } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useReducedMotion } from '../accessibility';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING = { mass: 0.5, damping: 14, stiffness: 220 };

export interface PressableScaleProps extends PressableProps {
  /** Scale at the bottom of the press. Default 0.97. */
  activeScale?: number;
  /** Light selection haptic on press-in (native only). Default true. */
  haptic?: boolean;
}

/**
 * The tap target for the whole app: springs down on press, back on release,
 * plus a light selection haptic. The animated style reads ONLY a shared value
 * (never React props) so it can't trigger re-render loops on native.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  {
    activeScale = 0.97,
    haptic = true,
    onPressIn,
    onPressOut,
    style,
    children,
    disabled,
    accessibilityState,
    ...rest
  },
  ref
) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      ref={ref}
      disabled={disabled}
      accessibilityState={{
        ...accessibilityState,
        disabled: !!disabled || accessibilityState?.disabled,
      }}
      onPressIn={(e: GestureResponderEvent) => {
        scale.set(reduceMotion ? 1 : withSpring(activeScale, SPRING));
        if (haptic && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.set(reduceMotion ? 1 : withSpring(1, SPRING));
        onPressOut?.(e);
      }}
      style={[animatedStyle, style as object, { opacity: disabled ? 0.5 : 1 }]}
      {...rest}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
});
