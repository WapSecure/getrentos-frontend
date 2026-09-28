import { View } from 'react-native';
import { Eye } from 'lucide-react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import { describeWatchlistBasis } from '@/components/gateman/WatchlistBlockedNotice';
import type { WatchlistScreening } from '@/lib/gateman/watchlistRefusal';

/**
 * The result of asking the estate's watch list about somebody, before anything
 * has been attempted.
 *
 * A guard who screens first finds out before they have told a visitor they are
 * asking the household — and without a household being asked to consent to
 * somebody the estate has already decided against. That is the whole value of a
 * check they can run early, so it has to be usable before the form is finished.
 *
 * Renders nothing for a blocking result. A refusal is not an advisory, and
 * showing "they may still be admitted" next to a name the estate has refused
 * would be the one genuinely dangerous thing this panel could do. The caller
 * routes a blocking result to `WatchlistBlockedNotice`, which owns it.
 */
export function WatchlistCheckResult({ screening }: { screening: WatchlistScreening }) {
  const { colors, spacing, radius } = useTheme();

  if (screening.blocked) return null;

  if (!screening.flagged) {
    return (
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          backgroundColor: colors.secondary,
          borderRadius: radius.md,
          padding: spacing.md,
        }}
      >
        <Eye size={16} color={colors.mutedForeground} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption">Nobody on this estate&apos;s watch list matches that.</Text>
          {/* Comparing exactly is what makes the list safe to act on, and the
              same property is why a clearance is not a guarantee: a name spelt
              differently would not match. Saying so stops a guard treating this
              as a promise. */}
          <Text variant="caption" color="mutedForeground">
            Compared exactly against what the list holds, ignoring case, spacing and word order — so
            a genuinely different spelling would not show up.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        borderWidth: 2,
        borderColor: colors.warning,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Eye size={16} color={colors.warning} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          On the estate&apos;s watch list — not refused
        </Text>
      </View>

      {screening.matches.map((match) => (
        <View key={match.entryId} style={{ gap: 2 }}>
          <Text variant="bodyStrong">{match.label}</Text>
          <Text variant="caption" color="mutedForeground">
            {`Matched on ${describeWatchlistBasis(match.matchedOn)}`}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {`Reason: ${match.reason}`}
          </Text>
        </View>
      ))}

      {/* The API's wording, which already says they may come in and that the
          estate office wants to hear about it. */}
      <Text variant="caption" color="mutedForeground">
        {screening.matches.map((match) => match.message).join(' ')}
      </Text>
    </View>
  );
}
