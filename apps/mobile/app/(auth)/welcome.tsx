import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import { BrandLogo, Button, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { resetOnboarding } from '@/lib/onboarding';

/**
 * Auth gateway. The intro has already made the case for the product, so this
 * screen stays a brand moment plus a choice — it deliberately does not repeat
 * the onboarding's value props.
 */
export default function Welcome() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const replayIntro = async () => {
    await resetOnboarding();
    router.replace('/(auth)/onboarding');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.accent, colors.background]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 520 }}
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
        <ThemeToggle variant="pill" compact />
      </View>

      {/* brand moment */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl }}>
        <Animated.View entering={FadeIn.duration(420)} style={{ marginBottom: spacing['2xl'] }}>
          <BrandLogo size={56} showWordmark={false} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(460).delay(80)}>
          <Text variant="display" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -1 }}>
            Property, without{'\n'}the leap of faith.
          </Text>
          <Text
            variant="body"
            color="mutedForeground"
            style={{ marginTop: spacing.md, maxWidth: 320 }}
          >
            Create an account to save homes, apply, and pay through escrow — with every landlord and
            agent verified first.
          </Text>
        </Animated.View>
      </View>

      {/* choice */}
      <Animated.View
        entering={FadeInDown.duration(460).delay(160)}
        style={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.sm,
        }}
      >
        <Button
          label="Create your account"
          iconRight={<ArrowRight size={17} color={colors.primaryForeground} />}
          onPress={() => router.push('/(auth)/sign-up')}
        />
        <Button
          label="I already have an account"
          variant="outline"
          onPress={() => router.push('/(auth)/sign-in')}
        />

        <Text variant="caption" color="mutedForeground" center style={{ marginTop: spacing.sm }}>
          By continuing you agree to our Terms &amp; Privacy Policy.
        </Text>

        {__DEV__ ? (
          <Pressable
            onPress={replayIntro}
            accessibilityRole="button"
            style={{ alignItems: 'center', paddingTop: spacing.xs }}
          >
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Replay intro (dev)
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
