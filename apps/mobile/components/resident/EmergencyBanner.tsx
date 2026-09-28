import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Siren } from 'lucide-react-native';
import { Card, Text, useTheme } from '@getrentos/ui-native';
import { residentApi } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import {
  describeMyHouseholdAnswer,
  householdHasAnswered,
  residentLines,
} from '@/lib/emergency/answerOptions';

/**
 * The estate is calling the roll, and this household owes an answer.
 *
 * Owns its own query on the shared `qk.resident.emergency` key, so the home
 * banner and the answer screen always agree — a banner still saying "you have not
 * answered" beside a screen that has just been answered is worse than no banner.
 *
 * Renders nothing when the estate is not in the middle of an emergency, which is
 * the ordinary case. An all-clear is not shown here: once the roll is down there
 * is nothing to answer, and the household has already been sent the stand-down.
 */
export function EmergencyBanner() {
  const { colors, spacing } = useTheme();

  const query = useQuery({
    queryKey: qk.resident.emergency,
    queryFn: () => residentApi.getEmergency(),
    refetchInterval: (q) => (q.state.data ? 15_000 : false),
  });

  const data = query.data;
  if (!data) return null;

  const states = residentLines(data.myEntries ?? []).map((entry) => entry.state);
  const answered = householdHasAnswered(states);
  const needsHelp = states.includes('NEEDS_HELP');
  const someAnswered = states.some((state) => state !== 'UNACCOUNTED');

  /**
   * What to say about where this household stands.
   *
   * A household of three can genuinely be half-answered — one flat empty, one
   * inside — so "your household has not answered" would be false and "your
   * household has answered" would hide the line a marshal still has to chase.
   */
  const standing =
    states.length === 0
      ? 'Your household is not on this roll call.'
      : answered
        ? `${describeMyHouseholdAnswer(states[0] ?? 'UNACCOUNTED')}.`
        : someAnswered
          ? 'Some of your household has answered; the rest has not.'
          : 'Your household has not answered yet.';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="The estate is calling the roll. Open the roll call."
      onPress={() => router.push('/(app)/emergency')}
    >
      <Card
        elevated
        style={{
          borderWidth: 1,
          borderColor: colors.destructive,
          backgroundColor: needsHelp ? colors.destructive + '1f' : colors.destructive + '14',
        }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Siren size={22} color={colors.destructive} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              {data.muster.kindLabel} — the estate is calling the roll
            </Text>
            <Text variant="body" style={{ marginTop: spacing.xs }}>
              {data.muster.assemblyInstruction}
            </Text>
            <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
              {standing}
              {needsHelp ? ' Somebody in your household needs help — a marshal has been told.' : ''}
            </Text>
            <Text variant="callout" style={{ marginTop: spacing.sm, color: colors.primary }}>
              {answered ? 'Change your answer' : 'Tell the estate you are safe'}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
