import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';
import { readGate } from '@/lib/verificationGate';

/** Inline callout for a verification or trust-tier 403, with the way forward. */
export function VerificationGateNotice({
  error,
  verifyHref = '/(app)/verify-identity',
  scoreHref,
  onNavigate,
}: {
  error: unknown;
  verifyHref?: Href;
  /** The persona's trust profile — used when the score, not evidence, is short. */
  scoreHref?: Href;
  /** Called before navigating, e.g. to close the sheet the notice sits in. */
  onNavigate?: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const gate = readGate(error);
  if (!gate) return null;

  const destination = gate.scoreWithheld && scoreHref ? scoreHref : verifyHref;

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
