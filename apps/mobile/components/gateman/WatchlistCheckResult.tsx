import { View } from 'react-native';
import { Eye } from '@sureground/icons/native';
import { Text, useTheme } from '@sureground/ui-native';
import { describeWatchlistBasis } from '@/components/gateman/WatchlistBlockedNotice';
import type { WatchlistScreening } from '@/lib/gateman/watchlistRefusal';

// Renders nothing for a blocking result: "they may still be admitted" beside a refused name would be dangerous. The caller routes it to WatchlistBlockedNotice.
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
          {/* Matching is exact, so a clearance is not a guarantee: a name spelt differently would not match. */}
          <Text variant="caption" color="mutedForeground">
            Compared exactly against what the list holds, ignoring case, spacing and word order: so
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
          On the estate&apos;s watch list: not refused
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

      <Text variant="caption" color="mutedForeground">
        {screening.matches.map((match) => match.message).join(' ')}
      </Text>
    </View>
  );
}
