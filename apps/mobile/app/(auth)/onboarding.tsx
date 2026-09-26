import { useCallback, useRef, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import {
  BrandLogo,
  Button,
  Text,
  ThemeToggle,
  useReducedMotion,
  useTheme,
} from '@getrentos/ui-native';
import {
  EscrowScene,
  FindPropertiesScene,
  VerifiedPeopleScene,
} from '@/components/onboarding/OnboardingScenes';
import { useOnboardingSeen } from '@/lib/onboarding';

const SLIDES = [
  {
    key: 'discover',
    eyebrow: 'Discover',
    title: 'Find properties\nwithout the guesswork',
    body: 'Search real listings with real prices. Every home you see has been through our checks before it reaches you.',
    Scene: FindPropertiesScene,
  },
  {
    key: 'escrow',
    eyebrow: 'Protection',
    title: 'Your money stays\nsafe in escrow',
    body: 'Rent and deposits are held securely and only released when both sides confirm. No transfers into thin air.',
    Scene: EscrowScene,
  },
  {
    key: 'trust',
    eyebrow: 'Trust',
    title: 'Verified landlords\nand agents only',
    body: 'Identity, ownership and licences are confirmed up front — so you always know exactly who you are dealing with.',
    Scene: VerifiedPeopleScene,
  },
] as const;

export default function Onboarding() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { markSeen } = useOnboardingSeen();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    // Reanimated shared values are intentionally mutable inside UI-thread worklets.
    // eslint-disable-next-line react-hooks/immutability
    scrollX.value = e.contentOffset.x;
  });

  const finish = useCallback(() => {
    markSeen();
    router.replace('/(auth)/welcome');
  }, [markSeen]);

  const goNext = useCallback(() => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * screenWidth, animated: !reduceMotion });
  }, [index, finish, reduceMotion, screenWidth]);

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* soft brand wash behind the scenes, drawn from theme tokens */}
      <LinearGradient
        colors={[colors.accent, colors.background]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 560 }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
        }}
      >
        <BrandLogo size={22} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <View
            accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}
            style={{
              paddingVertical: 5,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text variant="caption" color="mutedForeground" style={{ fontWeight: '700' }}>
              {index + 1} / {SLIDES.length}
            </Text>
          </View>
          {!isLast ? (
            <Pressable onPress={finish} accessibilityRole="button" hitSlop={10}>
              <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
                Skip
              </Text>
            </Pressable>
          ) : null}
          <ThemeToggle variant="pill" compact />
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth))
        }
        accessibilityLabel="GetRentos introduction"
        style={{ flex: 1, marginTop: spacing.xl }}
      >
        {SLIDES.map((slide, i) => (
          <Slide
            key={slide.key}
            slide={slide}
            i={i}
            scrollX={scrollX}
            screenWidth={screenWidth}
            reduceMotion={reduceMotion}
          />
        ))}
      </Animated.ScrollView>

      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.lg,
        }}
      >
        {/* segmented progress — the active segment stretches */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {SLIDES.map((slide, i) => (
            <Animated.View
              key={slide.key}
              accessibilityLabel={
                i === index ? `Current step: ${slide.title.replace('\n', ' ')}` : undefined
              }
              layout={reduceMotion ? undefined : LinearTransition.duration(240)}
              style={{
                height: 4,
                borderRadius: radius.full,
                flexGrow: i === index ? 3 : 1,
                flexBasis: 0,
                backgroundColor: i === index ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        <Button
          label={isLast ? 'Get started' : 'Continue'}
          iconRight={<ArrowRight size={17} color={colors.primaryForeground} />}
          onPress={goNext}
        />

        <Pressable
          onPress={() => {
            markSeen();
            router.replace('/(auth)/sign-in');
          }}
          accessibilityRole="button"
          style={{ alignItems: 'center' }}
        >
          <Text variant="callout" color="mutedForeground">
            Already have an account?{' '}
            <Text variant="callout" style={{ color: colors.primary, fontWeight: '700' }}>
              Sign in
            </Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------------------- slide -------------------------------- */

function Slide({
  slide,
  i,
  scrollX,
  screenWidth,
  reduceMotion,
}: {
  slide: (typeof SLIDES)[number];
  i: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
  reduceMotion: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const { Scene } = slide;

  // The scene drifts and settles as its page comes to rest; copy follows a beat later.
  const sceneStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const d = scrollX.value - i * screenWidth;
    return {
      opacity: interpolate(d, [-screenWidth, 0, screenWidth], [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateX: interpolate(
            d,
            [-screenWidth, 0, screenWidth],
            [screenWidth * 0.22, 0, -screenWidth * 0.22]
          ),
        },
        {
          scale: interpolate(d, [-screenWidth, 0, screenWidth], [0.9, 1, 0.9], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const copyStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const d = scrollX.value - i * screenWidth;
    return {
      opacity: interpolate(
        d,
        [-screenWidth * 0.7, 0, screenWidth * 0.7],
        [0, 1, 0],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            d,
            [-screenWidth, 0, screenWidth],
            [26, 0, 26],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${slide.eyebrow}. ${slide.title.replace('\n', ' ')}. ${slide.body}`}
      style={{ width: screenWidth }}
    >
      {/* copy leads, directly under the header — nothing floats */}
      <Animated.View style={[{ paddingHorizontal: spacing.xl }, copyStyle]}>
        <Text variant="label" color="primary" uppercase>
          {slide.eyebrow}
        </Text>
        <Text
          variant="display"
          style={{ marginTop: spacing.sm, fontSize: 29, lineHeight: 35, letterSpacing: -0.8 }}
        >
          {slide.title}
        </Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.sm }}>
          {slide.body}
        </Text>
      </Animated.View>

      {/*
       * The scene sits in a preview surface that takes the rest of the slide and
       * runs off the bottom edge, so every slide fills the screen no matter how
       * tall its contents are.
       */}
      <Animated.View style={[{ flex: 1, marginTop: spacing.lg }, sceneStyle]}>
        <View
          style={{
            flex: 1,
            marginHorizontal: spacing.md,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            borderTopLeftRadius: radius['2xl'],
            borderTopRightRadius: radius['2xl'],
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: colors.border,
            backgroundColor: colors.secondary,
            overflow: 'hidden',
          }}
        >
          <Scene />
        </View>
      </Animated.View>
    </View>
  );
}
