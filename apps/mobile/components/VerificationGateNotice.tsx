import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ShieldAlert } from '@sureground/icons/native';
import { Button, Text, useTheme } from '@sureground/ui-native';
import { readGate } from '@/lib/verificationGate';

export function VerificationGateNotice({
  error,
  verifyHref = '/(app)/verify-identity',
  scoreHref,
  onNavigate,
}: {
  error: unknown;
  verifyHref?: Href;
  scoreHref?: Href;
  onNavigate?: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const gate = readGate(error);
  if (!gate) return null;

  // Two assignments, not a ternary: a ternary between typed-route Hrefs makes TypeScript give up (TS2590, union too complex).
  let destination: Href = verifyHref;
  if (gate.scoreWithheld && scoreHref) destination = scoreHref;

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.warningSubtle,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <ShieldAlert size={18} color={colors.warning} style={{ marginTop: 1 }} />
        <Text variant="callout" style={{ flex: 1, color: colors.foreground }}>
          {gate.message}
        </Text>
      </View>
      <Button
        label={gate.cta}
        size="sm"
        variant="secondary"
        onPress={() => {
          onNavigate?.();
          router.push(destination);
        }}
      />
    </View>
  );
}
