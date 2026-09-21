import { useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, ShieldCheck, UserPlus, Zap } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  LEAD_STAGE_LABEL,
  LEAD_STAGE_TONE,
  type LandlordLead,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';

export default function LandlordLeads() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.leads(),
    queryFn: () => landlordApi.leads(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['landlord', 'leads'] });
  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const nudge = useMutation({
    mutationFn: (id: string) => landlordApi.nudgeLead(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      invalidate();
      toast.show('Nudge sent.', 'success');
    },
    onError: (e) => fail(e, 'Could not nudge that lead.'),
  });

  const bulkNudge = useMutation({
    mutationFn: landlordApi.bulkNudgeLeads,
    onSuccess: (r) => {
      invalidate();
      toast.show(`Nudged ${r.nudged} lead${r.nudged === 1 ? '' : 's'}.`, 'success');
    },
    onError: (e) => fail(e, 'Could not send those nudges.'),
  });

  const items = query.data?.items ?? [];
  const stale = items.filter((l) => l.stale).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="title">Leads</Text>
          {query.data ? (
            <Text variant="caption" color={stale > 0 ? 'destructive' : 'mutedForeground'}>
              {query.data.total} lead{query.data.total === 1 ? '' : 's'}
              {stale > 0 ? ` · ${stale} gone cold` : ''}
            </Text>
          ) : null}
        </View>

        {/* Chasing every cold lead one by one is the job this replaces. */}
        {stale > 0 ? (
          <Pressable
            onPress={() =>
              Alert.alert('Nudge all cold leads?', `${stale} will get a follow-up message.`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Nudge all', onPress: () => bulkNudge.mutate() },
              ])
            }
            disabled={bulkNudge.isPending}
            accessibilityRole="button"
            accessibilityLabel="Nudge all cold leads"
            hitSlop={10}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Zap size={16} color={colors.primary} />
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Nudge all
            </Text>
          </Pressable>
        ) : null}
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={96} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(l) => l.id}
          renderItem={({ item }: { item: LandlordLead }) => (
            <LeadRow lead={item} busy={busyId === item.id} onNudge={() => nudge.mutate(item.id)} />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<UserPlus size={32} color={colors.mutedForeground} />}
              title="No leads yet"
              description="People who enquire about your listings show up here so you can follow up."
            />
          }
        />
      )}
    </View>
  );
}

function LeadRow({
  lead: l,
  busy,
  onNudge,
}: {
  lead: LandlordLead;
  busy: boolean;
  onNudge: () => void;
}) {
  const { colors, spacing } = useTheme();

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Avatar name={l.leadName} size={44} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {l.leadName}
            </Text>
            {l.verified ? <ShieldCheck size={13} color={colors.success} /> : null}
            <View style={{ flex: 1 }} />
            <Badge label={LEAD_STAGE_LABEL[l.stage]} tone={LEAD_STAGE_TONE[l.stage]} />
          </View>

          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {l.propertyName}
          </Text>

          <Text variant="caption" color={l.stale ? 'destructive' : 'mutedForeground'}>
            Last activity {relativeTime(l.lastActivityAt)}
            {l.stale ? ' · gone cold' : ''} · trust {l.trustScore}
          </Text>

          <Pressable
            onPress={onNudge}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Nudge ${l.leadName}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginTop: 2,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Bell size={13} color={colors.primary} />
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Send a nudge
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
