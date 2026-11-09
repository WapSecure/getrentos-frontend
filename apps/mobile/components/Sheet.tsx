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
import { Text, useReducedMotion, useTheme } from '@sureground/ui-native';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: (string | number)[];
  footer?: ReactNode;
  children: ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

function resolveHeight(snapPoints?: (string | number)[]): number | undefined {
  const first = snapPoints?.[0];
  if (typeof first === 'number') return first;
  if (typeof first === 'string' && first.endsWith('%')) {
    const pct = Number.parseFloat(first);
    if (Number.isFinite(pct)) return (SCREEN_HEIGHT * pct) / 100;
  }
  return undefined;
}

// Built on Modal: a portal-based sheet renders underneath the native react-native-screens views expo-router mounts, and never shows.
export function Sheet({ open, onClose, title, snapPoints, footer, children }: SheetProps) {
  const { colors, spacing, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  // `useState` initialiser keeps one stable Animated.Value without touching a ref during render.
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: reduceMotion ? 0 : open ? 220 : 160,
      useNativeDriver: true,
    }).start();
  }, [open, anim, reduceMotion]);

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
            accessibilityLabel={title ? `Dismiss ${title}` : 'Dismiss dialog'}
            onPress={onClose}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            accessibilityViewIsModal
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
              <Text
                accessibilityRole="header"
                variant="heading"
                style={{ marginBottom: spacing.md }}
              >
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
