import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme } from '@getrentos/ui-native';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Optional heading row with a grabber above it. */
  title?: string;
  /** Fixed height, as a percentage of the screen (e.g. `['60%']`). Omit to size to content. */
  snapPoints?: (string | number)[];
  /** Sticky footer inside the sheet (e.g. Apply / Reset). */
  footer?: ReactNode;
  children: ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/** Resolves the first snap point to a pixel height; undefined means size-to-content. */
function resolveHeight(snapPoints?: (string | number)[]): number | undefined {
  const first = snapPoints?.[0];
  if (typeof first === 'number') return first;
  if (typeof first === 'string' && first.endsWith('%')) {
    const pct = Number.parseFloat(first);
    if (Number.isFinite(pct)) return (SCREEN_HEIGHT * pct) / 100;
  }
  return undefined;
}

/**
 * Themed bottom sheet. Built on React Native's `Modal` so the sheet is a real
 * native overlay — a portal-based sheet renders *underneath* the native
 * `react-native-screens` views that expo-router mounts, and never becomes visible.
 *
 * Driven by `open`; `onClose` fires on backdrop press and Android back.
 */
export function Sheet({ open, onClose, title, snapPoints, footer, children }: SheetProps) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  // `useState` initialiser keeps one stable Animated.Value without touching a ref during render.
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: open ? 220 : 160,
      useNativeDriver: true,
    }).start();
  }, [open, anim]);

  const height = resolveHeight(snapPoints);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: anim }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: radius['2xl'],
              borderTopRightRadius: radius['2xl'],
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: insets.bottom + spacing.lg,
              maxHeight: SCREEN_HEIGHT * 0.9,
              ...(height ? { height } : {}),
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT * 0.5, 0],
                  }),
                },
              ],
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                marginBottom: spacing.md,
              }}
            />

            {title ? (
              <Text variant="heading" style={{ marginBottom: spacing.md }}>
                {title}
              </Text>
            ) : null}

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>

            {footer ? <View style={{ marginTop: spacing.lg }}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
