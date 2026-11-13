import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, Platform, useWindowDimensions, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ArrowRight } from '@sureground/icons/native';
import {
  BrandLogo,
  Button,
  LinkButton,
  Text,
  useReducedMotion,
  useTheme,
} from '@sureground/ui-native';
import {
  EscrowScene,
  FindPropertiesScene,
  SceneMotionProvider,
  VerifiedPeopleScene,
} from '@/components/onboarding/OnboardingScenes';
import { useOnboardingSeen } from '@/lib/onboarding';
import { haptics } from '@/lib/haptics';

const SLIDES = [
  {
    key: 'discover',
    eyebrow: 'Discover',
    title: 'Find properties without the guesswork',
    body: 'Search real listings with real prices. Homes and landlords that have passed our checks are clearly marked, so you can see what has been confirmed.',
    Scene: FindPropertiesScene,
  },
  {
    key: 'escrow',
    eyebrow: 'Protection',
    title: 'Sureground holds your money safely',
    body: 'Rent is held by Sureground and released to your landlord when you confirm move-in or on its scheduled release date, whichever comes first. A deposit on a home you’re buying is only released to the seller once they hand over the keys and you confirm. A dispute keeps money held until it’s resolved.',
    Scene: EscrowScene,
  },
  {
    key: 'trust',
    eyebrow: 'Trust',
    title: 'Verified before it matters',
    body: 'We confirm identity, ownership and licences when they count — before a listing goes live or money moves — so you know who you are dealing with.',
    Scene: VerifiedPeopleScene,
  },
] as const;

const LAST = SLIDES.length - 1;

export default function Onboarding() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { markSeen } = useOnboardingSeen();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  /* The index follows the scroll position: momentum-end never fires for a non-animated `scrollTo` (Reduce Motion). */
  useAnimatedReaction(
    () => (screenWidth > 0 ? Math.round(scrollX.get() / screenWidth) : 0),
    (page, prev) => {
      if (page !== prev) scheduleOnRN(setIndex, Math.max(0, Math.min(LAST, page)));
    },
    [screenWidth]
  );

  const announced = useRef(0);
  useEffect(() => {
    if (announced.current === index) return;
    announced.current = index;
    const s = SLIDES[index];
    AccessibilityInfo.announceForAccessibility(
      `Step ${index + 1} of ${SLIDES.length}. ${s.title}. ${s.body}`
    );
    haptics.tap();
  }, [index]);

  // Keep the current page aligned when the window resizes (tablets, web, split view).
  const lastWidth = useRef(screenWidth);
  useEffect(() => {
    if (lastWidth.current === screenWidth || lastWidth.current === 0) return;
    const page = Math.round(scrollX.get() / lastWidth.current);
    lastWidth.current = screenWidth;
    scrollRef.current?.scrollTo({ x: page * screenWidth, animated: false });
  }, [screenWidth, scrollX, scrollRef]);

  const goTo = useCallback(
    (page: number) => {
      scrollRef.current?.scrollTo({ x: page * screenWidth, animated: !reduceMotion });
      // Without animation no scroll events are guaranteed on every platform.
      if (reduceMotion) setIndex(page);
    },
    [reduceMotion, screenWidth, scrollRef]
  );

  const leave = useCallback(
    (to: Href) => {
      markSeen();
      router.replace(to);
    },
    [markSeen]
  );

  // Android back steps through the slides before leaving the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      goTo(index - 1);
      return true;
    });
    return () => sub.remove();
  }, [goTo, index]);

  const isLast = index === LAST;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.xl,
          minHeight: insets.top + spacing.sm + 44,
        }}
      >
        <View accessible accessibilityRole="image" accessibilityLabel="Sureground">
          <BrandLogo size={22} />
        </View>
        {!isLast ? (
          <LinkButton
            label="Skip"
            tone="muted"
            accessibilityHint="Skips the introduction"
            onPress={() => leave('/(auth)/welcome')}
          />
        ) : null}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={{ flex: 1, marginTop: spacing.lg }}
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
          paddingBottom: insets.bottom + spacing.sm,
          gap: spacing.md,
        }}
      >
        <PageIndicator scrollX={scrollX} screenWidth={screenWidth} index={index} />

        {isLast ? (
          <View style={{ gap: spacing.sm }}>
            <Button
              label="Create your account"
              iconRight={<ArrowRight size={17} color={colors.primaryForeground} />}
              onPress={() => leave('/(auth)/sign-up')}
            />
            <Button
              label="I already have an account"
              variant="outline"
              onPress={() => leave('/(auth)/sign-in')}
            />
          </View>
        ) : (
          <Button
            label="Continue"
            accessibilityHint={`Shows step ${index + 2} of ${SLIDES.length}`}
            iconRight={<ArrowRight size={17} color={colors.primaryForeground} />}
            onPress={() => goTo(index + 1)}
          />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="callout" color="mutedForeground">
            Just looking?{' '}
          </Text>
          <LinkButton
            label="Browse homes"
            accessibilityHint="Opens the marketplace without an account"
            onPress={() => leave('/(market)')}
          />
        </View>
      </View>
    </View>
  );
}

function PageIndicator({
  scrollX,
  screenWidth,
  index,
}: {
  scrollX: SharedValue<number>;
  screenWidth: number;
  index: number;
}) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Introduction progress"
      accessibilityValue={{
        min: 1,
        max: SLIDES.length,
        now: index + 1,
        text: `Step ${index + 1} of ${SLIDES.length}`,
      }}
      style={{ flexDirection: 'row', gap: 6, height: 4 }}
    >
      {SLIDES.map((slide, i) => (
        <Segment key={slide.key} i={i} scrollX={scrollX} screenWidth={screenWidth} />
      ))}
    </View>
  );
}

function Segment({
  i,
  scrollX,
  screenWidth,
}: {
  i: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
}) {
  const { colors, radius } = useTheme();
  const idle = colors.border;
  const active = colors.primary;
  const style = useAnimatedStyle(() => {
    const page = screenWidth > 0 ? scrollX.get() / screenWidth : 0;
    const closeness = interpolate(Math.abs(page - i), [0, 1], [1, 0], Extrapolation.CLAMP);
    return {
      flexGrow: 1 + closeness * 2,
      backgroundColor: interpolateColor(closeness, [0, 1], [idle, active]),
    };
  });
  return <Animated.View style={[{ flexBasis: 0, borderRadius: radius.full }, style]} />;
}

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

  // −1 while entering from the right, 0 when settled, 1 while leaving to the left.
  const offset = useDerivedValue(() =>
    screenWidth > 0 ? (scrollX.get() - i * screenWidth) / screenWidth : 0
  );
  const motion = useMemo(() => ({ offset, animate: !reduceMotion }), [offset, reduceMotion]);

  const sceneStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const d = offset.get();
    return {
      opacity: interpolate(d, [-1, 0, 1], [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(d, [-1, 0, 1], [screenWidth * 0.22, 0, -screenWidth * 0.22]) },
        { scale: interpolate(d, [-1, 0, 1], [0.92, 1, 0.92], Extrapolation.CLAMP) },
      ],
    };
  });

  const copyStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const d = offset.get();
    return {
      opacity: interpolate(d, [-0.7, 0, 0.7], [0, 1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(d, [-1, 0, 1], [22, 0, 22], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={{ width: screenWidth }}>
      {/* One focusable summary; the illustration below is decorative. */}
      <Animated.View
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${slide.eyebrow}. ${slide.title}. ${slide.body}`}
        style={[{ paddingHorizontal: spacing.xl, maxWidth: 560 }, copyStyle]}
      >
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

      <Animated.View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[{ flex: 1, marginTop: spacing.lg, alignItems: 'center' }, sceneStyle]}
      >
        <View
          style={{
            flex: 1,
            width: Math.min(screenWidth - spacing.md * 2, 520),
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
          <SceneMotionProvider value={motion}>
            <Scene />
          </SceneMotionProvider>
        </View>
      </Animated.View>
    </View>
  );
}
