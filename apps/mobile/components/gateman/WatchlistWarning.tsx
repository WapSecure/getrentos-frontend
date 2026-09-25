import { View } from 'react-native';
import { Eye } from 'lucide-react-native';
import { Text, useTheme } from '@getrentos/ui-native';

/**
 * The estate's note about somebody it matched but did not refuse.
 *
 * Shown after a write that succeeded, because a WATCH entry admits the visitor
 * on purpose — the estate wants to hear about them, and this is the guard
 * finding out in time to pass it on. Until this existed the sentence was composed
 * on the server and thrown away, so the severity did nothing a guard could see.
 *
 * Deliberately not the red refusal notice, and not an error: nobody was refused.
 * A guard who reads it as a problem starts second-guessing an admission the
 * estate already decided to allow.
 */
export function WatchlistWarning({ warning }: { warning?: string }) {
  const { colors, spacing, radius } = useTheme();

  if (!warning) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        backgroundColor: colors.warningSubtle,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      <Eye size={20} color={colors.warning} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" style={{ color: colors.warning }}>
          On the estate&apos;s watch list
        </Text>
        <Text variant="caption" color="mutedForeground">
          {warning}
        </Text>
      </View>
    </View>
  );
}
