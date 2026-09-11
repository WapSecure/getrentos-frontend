import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, Vote } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { residentApi, type Poll } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';

function BackHeader({ title }: { title: string }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
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
      <Text variant="title">{title}</Text>
    </View>
  );
}

function PollCard({
  poll,
  onVote,
  voting,
}: {
  poll: Poll;
  onVote: (optionId: string) => void;
  voting: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const canVote = poll.status === 'open' && !poll.myVote;

  return (
    <Card elevated>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <Text variant="bodyStrong" style={{ flex: 1, marginRight: spacing.sm }}>
          {poll.question}
        </Text>
        <Badge
          label={poll.status === 'open' ? 'Open' : 'Closed'}
          tone={poll.status === 'open' ? 'info' : 'neutral'}
        />
      </View>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {poll.options.map((opt) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
          const mine = poll.myVote === opt.id;
          return (
            <Pressable
              key={opt.id}
              disabled={!canVote || voting}
              onPress={() => onVote(opt.id)}
              style={{
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: mine ? colors.primary : colors.border,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  backgroundColor: colors.accent,
                }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 }}
                >
                  {mine ? <Check size={14} color={colors.primary} /> : null}
                  <Text variant="body" numberOfLines={2} style={{ flex: 1 }}>
                    {opt.label}
                  </Text>
                </View>
                {!canVote ? (
                  <Text variant="caption" color="mutedForeground">
                    {pct}%
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
        {poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'}
      </Text>
    </Card>
  );
}

export default function ResidentPolls() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.resident.polls,
    queryFn: () => residentApi.listPolls(),
  });

  const vote = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      residentApi.voteOnPoll(pollId, optionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.resident.polls }),
    onError: () => toast.show("Couldn't record your vote. Try again.", 'error'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Polls" />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={140} radius={16} />
            <Skeleton height={140} radius={16} />
          </View>
        ) : query.data && query.data.length > 0 ? (
          query.data.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              voting={vote.isPending}
              onVote={(optionId) => vote.mutate({ pollId: poll.id, optionId })}
            />
          ))
        ) : (
          <EmptyState
            icon={<Vote size={34} color={colors.mutedForeground} />}
            title="No polls right now"
            description="When your estate opens a vote, it'll show up here."
          />
        )}
      </Screen>
    </View>
  );
}
