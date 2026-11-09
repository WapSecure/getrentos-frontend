import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Siren } from '@sureground/icons/native';
import { Card, Text, useTheme } from '@sureground/ui-native';
import { residentApi } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import {
  describeMyHouseholdAnswer,
  householdHasAnswered,
  residentLines,
} from '@/lib/emergency/answerOptions';

// Owns its query on the shared `qk.resident.emergency` key so the home banner and the answer screen always agree.
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

  /** A household can be half-answered, so neither "has answered" nor "has not answered" is true of all of it. */
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
              {data.muster.kindLabel}: the estate is calling the roll
            </Text>
            <Text variant="body" style={{ marginTop: spacing.xs }}>
              {data.muster.assemblyInstruction}
            </Text>
            <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
              {standing}
              {needsHelp ? ' Somebody in your household needs help: a marshal has been told.' : ''}
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
