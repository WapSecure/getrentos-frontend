import { useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { ShieldCheck, KeyRound, HandCoins } from 'lucide-react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: ShieldCheck,
    title: 'Every listing verified',
    body: 'Identity, ownership and licences are checked before anything reaches you.',
  },
  {
    icon: KeyRound,
    title: 'Apply and sign in minutes',
    body: 'Digital applications, references and e-signatures — no paperwork, no queues.',
  },
  {
    icon: HandCoins,
    title: 'Money held safely',
    body: 'Rent and deposits move through escrow, released only when both sides are clear.',
  },
];

export default function Welcome() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const ref = useRef<Animated.ScrollView>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.accent, colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
      />

      <View style={{ flex: 1, paddingTop: insets.top + spacing['3xl'] }}>
        <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: spacing.xl }}>
          <Text variant="label" color="primary" uppercase>
            GetRentos
          </Text>
          <Text variant="display" style={{ marginTop: spacing.xs }}>
            The safer way{'\n'}to find home
          </Text>
        </Animated.View>

        <Animated.ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flexGrow: 0, marginTop: spacing['3xl'] }}
        >
          {SLIDES.map((s, i) => (
            <Slide key={i} slide={s} i={i} scrollX={scrollX} radius={radius.xl} />
          ))}
        </Animated.ScrollView>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: index === i ? 22 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: index === i ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.lg,
            gap: spacing.sm,
          }}
        >
          <Button label="Create an account" onPress={() => router.push('/(auth)/sign-up')} />
          <Button
            label="I already have an account"
            variant="ghost"
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </View>
      </View>
    </View>
  );
}

function Slide({
  slide,
  i,
  scrollX,
  radius,
}: {
  slide: (typeof SLIDES)[number];
  i: number;
  scrollX: SharedValue<number>;
  radius: number;
}) {
  const { colors, spacing } = useTheme();
  const Icon = slide.icon;

  const style = useAnimatedStyle(() => {
    const input = [(i - 1) * width, i * width, (i + 1) * width];
    return {
      opacity: interpolate(scrollX.value, input, [0.4, 1, 0.4]),
      transform: [{ scale: interpolate(scrollX.value, input, [0.92, 1, 0.92]) }],
    };
  });

  return (
    <Animated.View style={[{ width, paddingHorizontal: spacing.xl }, style]}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radius,
          padding: spacing['2xl'],
          gap: spacing.md,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={26} color={colors.primary} />
        </View>
        <Text variant="heading">{slide.title}</Text>
        <Text variant="body" color="mutedForeground">
          {slide.body}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 20 },
});
