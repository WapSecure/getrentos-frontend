import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ShieldCheck, Siren } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  TextField,
  useToast,
  useTheme,
} from '@getrentos/ui-native';
import { residentApi, type MusterSelfAnswer } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import {
  MUSTER_ANSWER_OPTIONS,
  describeMyHouseholdAnswer,
  householdHasAnswered,
  notePlaceholder,
  residentLines,
} from '@/lib/emergency/answerOptions';

/**
 * The roll call, from a household's point of view.
 *
 * Three decisions worth stating, because each is a place this screen could have
 * been built the other way:
 *
 *  - The estate's numbers are shown, its roll is not. "9 of 12 accounted for" is
 *    reassuring and identifies nobody; a list of names, units and who was home in
 *    the middle of the night is the most sensitive thing this estate produces.
 *  - There is no "not yet accounted for" button. It is the state a household is
 *    in until somebody answers, so offering it would let a roll sit unanswered
 *    with a tick beside it.
 *  - An answer is one tap. The note is offered underneath and never required: a
 *    household answering in a stairwell should not be filling in a form.
 */
export default function ResidentEmergency() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selected, setSelected] = useState<MusterSelfAnswer | null>(null);
  const [note, setNote] = useState('');

  const query = useQuery({
    queryKey: qk.resident.emergency,
    queryFn: () => residentApi.getEmergency(),
    // While an emergency is open this is the most important screen on the phone,
    // and a marshal may be answering for this household from the other end.
    refetchInterval: (q) => (q.state.data ? 15_000 : false),
  });

  const answer = useMutation({
    mutationFn: (input: { state: MusterSelfAnswer; stateNote?: string }) =>
      residentApi.answerRollCall(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.resident.emergency });
      setSelected(null);
      setNote('');
      toast.show('The estate office has been told.', 'success');
    },
    onError: (error: Error) => {
      toast.show(error.message, 'error');
    },
  });

  const data = query.data;
  // The people who live here — the lines this household's answer covers. Visitor
  // lines are shown, but a marshal answers for them.
  const mine = residentLines(data?.myEntries ?? []);
  const visitorEntries = (data?.myEntries ?? []).filter((entry) => entry.basis !== 'RESIDENT');
  const states = mine.map((entry) => entry.state);
  const answered = householdHasAnswered(states);
  const someAnswered = states.some((state) => state !== 'UNACCOUNTED');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.md,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Roll call</Text>
      </View>

      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={140} radius={16} />
            <Skeleton height={200} radius={16} />
          </View>
        ) : !data ? (
          <EmptyState
            icon={<ShieldCheck size={34} color={colors.mutedForeground} />}
            title="Your estate is not calling the roll"
            description="Nothing is happening right now. If the alarm is raised, this screen becomes the way you tell the estate office whether your household is safe."
          />
        ) : (
          <>
            <Card
              elevated
              style={{
                borderWidth: 1,
                borderColor: colors.destructive,
                backgroundColor: colors.destructive + '14',
              }}
            >
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Siren size={22} color={colors.destructive} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">
                    {data.muster.kindLabel} — the estate has raised the alarm
                  </Text>
                  <Text variant="body" style={{ marginTop: spacing.xs }}>
                    {data.muster.assemblyInstruction}
                  </Text>
                  {data.muster.assemblyPoint ? (
                    <Text
                      variant="caption"
                      color="mutedForeground"
                      style={{ marginTop: spacing.xs }}
                    >
                      Gather at: {data.muster.assemblyPoint}
                    </Text>
                  ) : null}
                  <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
                    {data.muster.statusLabel} · raised{' '}
                    {new Date(data.muster.declaredAt).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            </Card>

            {/* The one action this screen exists for. */}
            <Card elevated>
              <Text variant="bodyStrong">
                {answered ? 'Is this still right?' : 'Where is your household?'}
              </Text>
              <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                {answered
                  ? `${describeMyHouseholdAnswer(states[0] ?? 'UNACCOUNTED')}. You can change it — an answer given in a hurry is worth correcting.`
                  : someAnswered
                    ? 'Some of your household has answered. Answering again covers everybody who lives here.'
                    : 'One answer covers everybody who lives here. Tell a marshal anything you cannot say here.'}
              </Text>

              <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                {MUSTER_ANSWER_OPTIONS.map((option) => {
                  const isCurrent = answered && states.every((state) => state === option.state);
                  const isSelected = selected === option.state;
                  const accent = option.urgent ? colors.destructive : colors.primary;
                  return (
                    <Pressable
                      key={option.state}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        setSelected(option.state);
                        setNote('');
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: isSelected ? accent : colors.border,
                        backgroundColor: isSelected ? accent + '14' : colors.card,
                        borderRadius: 14,
                        padding: spacing.md,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text variant="bodyStrong">{option.label}</Text>
                        {isCurrent ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Check size={14} color={colors.success ?? colors.primary} />
                            <Text variant="caption" color="mutedForeground">
                              Your answer
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text
                        variant="caption"
                        color="mutedForeground"
                        style={{ marginTop: spacing.xs }}
                      >
                        {option.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selected ? (
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  <TextField
                    label="Anything to add? (optional)"
                    value={note}
                    onChangeText={setNote}
                    placeholder={notePlaceholder(selected)}
                    multiline
                    numberOfLines={3}
                  />
                  <Button
                    label={answer.isPending ? 'Sending…' : 'Send to the estate office'}
                    loading={answer.isPending}
                    onPress={() =>
                      answer.mutate({ state: selected, stateNote: note.trim() || undefined })
                    }
                  />
                  <Button
                    variant="ghost"
                    label="Cancel"
                    onPress={() => {
                      setSelected(null);
                      setNote('');
                    }}
                  />
                </View>
              ) : null}
            </Card>

            {/* Your own lines, and the estate's numbers. Never the estate's roll. */}
            <Card elevated>
              <Text variant="bodyStrong">Your household</Text>
              {(data.myEntries ?? []).length === 0 ? (
                <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                  Your household is not on this roll call. Tell a marshal where you are.
                </Text>
              ) : (
                mine.map((entry) => (
                  <View
                    key={entry.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
                      marginTop: spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="body">{entry.personName}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {entry.basisLabel}
                      </Text>
                      {entry.stateNote ? (
                        <Text variant="caption" color="mutedForeground">
                          Note: {entry.stateNote}
                        </Text>
                      ) : null}
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      {entry.stateLabel}
                    </Text>
                  </View>
                ))
              )}

              {/* Visitors this household was admitted are on the roll and this
                  household cannot answer for them, so they are named rather than
                  hidden: a resident who does not see them has no way to tell a
                  marshal that somebody is still inside. */}
              {visitorEntries.length > 0 ? (
                <View
                  style={{
                    marginTop: spacing.md,
                    paddingTop: spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <Text variant="body">Visitors the estate admitted to your household</Text>
                  <Text variant="caption" color="mutedForeground" style={{ marginTop: 2 }}>
                    {visitorEntries.length === 1
                      ? 'One visitor is still on site. A marshal answers for them'
                      : `${visitorEntries.length} visitors are still on site. A marshal answers for them`}
                    {' — the person who let them in is not always the person holding this phone.'}
                  </Text>
                  {visitorEntries.map((entry) => (
                    <View
                      key={entry.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: spacing.sm,
                        marginTop: spacing.sm,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="body">{entry.personName}</Text>
                        <Text variant="caption" color="mutedForeground">
                          {entry.basisLabel}
                        </Text>
                      </View>
                      <Text variant="caption" color="mutedForeground">
                        {entry.stateLabel}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>

            <Card elevated>
              <Text variant="bodyStrong">How the estate is doing</Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.md,
                  marginTop: spacing.sm,
                }}
              >
                {[
                  { label: 'Accounted for', value: data.muster.tally.accountedFor },
                  { label: 'Not on site', value: data.muster.tally.notOnSite },
                  { label: 'Needs help', value: data.muster.tally.needsHelp },
                  { label: 'Unanswered', value: data.muster.tally.unaccounted },
                ].map((tile) => (
                  <View key={tile.label} style={{ minWidth: 96 }}>
                    <Text variant="title">{tile.value}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {tile.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.md }}>
                {data.muster.tallyLabel}
              </Text>
              {data.muster.tally.settled ? (
                <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                  Every name on the roll has an answer.
                </Text>
              ) : null}
            </Card>
          </>
        )}
      </Screen>
    </View>
  );
}
