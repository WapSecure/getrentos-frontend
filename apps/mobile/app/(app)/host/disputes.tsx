import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Gavel, ShieldCheck } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Price,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DISPUTE_CATEGORIES,
  hostShortletsApi,
  type DepositClaim,
  type ShortletDispute,
} from '@/lib/api/hostShortlets';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill, type Tone } from '@/components/host/HostUI';

const DISPUTE_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Open', tone: 'warning' },
  UNDER_REVIEW: { label: 'Under review', tone: 'info' },
  ESCALATED: { label: 'Escalated', tone: 'danger' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
};

const CLAIM_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'With an admin', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  PARTIAL: { label: 'Partly approved', tone: 'info' },
  REJECTED: { label: 'Not upheld', tone: 'neutral' },
};

/** Problems with stays: disputes (both ways) and claims on guests' deposits. */
export default function HostDisputes() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'disputes' | 'claims'>('disputes');
  const disputes = useQuery({
    queryKey: qk.host.disputes,
    queryFn: () => hostShortletsApi.disputes(),
  });
  const claims = useQuery({
    queryKey: qk.host.depositClaims,
    queryFn: () => hostShortletsApi.depositClaims(),
  });
  const active = tab === 'disputes' ? disputes : claims;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={active.isRefetching}
          onRefresh={() => active.refetch()}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <DetailHeader
        eyebrow="Hosting"
        title="Disputes & claims"
        subtitle="Open one from the booking it’s about"
        onBack={() => router.back()}
      />
      <SegmentedControl
        accessibilityLabel="Disputes or deposit claims"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'disputes', label: `Disputes${disputes.data ? ` ${disputes.data.total}` : ''}` },
          { value: 'claims', label: `Deposit claims${claims.data ? ` ${claims.data.total}` : ''}` },
        ]}
      />
      {active.isError && !active.data ? (
        <ErrorState onRetry={() => active.refetch()} />
      ) : active.isPending ? (
        <Skeleton height={110} radius={radius.lg} />
      ) : tab === 'disputes' ? (
        disputes.data!.items.length ? (
          disputes.data!.items.map((d) => <DisputeRow key={d.id} d={d} />)
        ) : (
          <EmptyState
            icon={<Gavel size={34} color={colors.mutedForeground} />}
            title="No disputes"
            description="If something goes wrong with a stay, report it from the booking and support steps in."
          />
        )
      ) : claims.data!.items.length ? (
        claims.data!.items.map((c) => <ClaimRow key={c.id} c={c} />)
      ) : (
        <EmptyState
          icon={<ShieldCheck size={34} color={colors.mutedForeground} />}
          title="No deposit claims"
          description="After a stay with a deposit, you can claim for damage from the booking."
        />
      )}
    </ScrollView>
  );
}

function DisputeRow({ d }: { d: ShortletDispute }) {
  const { colors, spacing } = useTheme();
  const s = DISPUTE_STATUS[d.status] ?? { label: d.status, tone: 'neutral' as Tone };
  const category = DISPUTE_CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/host/dispute/[id]', params: { id: d.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${d.title}, ${category}, ${s.label}`}
    >
      {({ pressed }) => (
        <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
              {d.guestPromise ? 'Guest Promise report' : d.title}
            </Text>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </View>
          <Text variant="caption" color="mutedForeground">
            {d.listingTitle ? `${d.listingTitle} · ` : ''}
            {category} · {formatDate(d.createdAt, 'medium')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <StatusPill label={s.label} tone={s.tone} />
            {d.refundAmount ? (
              <Text variant="caption" color="mutedForeground">
                ₦{d.refundAmount.toLocaleString('en-NG')} refunded to guest
              </Text>
            ) : null}
          </View>
        </Card>
      )}
    </Pressable>
  );
}

function ClaimRow({ c }: { c: DepositClaim }) {
  const { spacing } = useTheme();
  const s = CLAIM_STATUS[c.status] ?? { label: c.status, tone: 'neutral' as Tone };
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {c.guestName}
          </Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {c.listingTitle ?? 'Stay'} · {formatDate(c.createdAt, 'medium')}
          </Text>
        </View>
        <Price amount={c.amount} variant="callout" />
      </View>
      <Text variant="callout" numberOfLines={3}>
        {c.reason}
      </Text>
      <StatusPill label={s.label} tone={s.tone} />
      {c.status !== 'PENDING' ? (
        <Text variant="caption" color="mutedForeground">
          {c.deductedAmount != null
            ? `₦${c.deductedAmount.toLocaleString('en-NG')} kept for you`
            : ''}
          {c.refundedAmount != null
            ? ` · ₦${c.refundedAmount.toLocaleString('en-NG')} back to the guest`
            : ''}
          {c.resolution ? `\n“${c.resolution}”` : ''}
        </Text>
      ) : null}
    </Card>
  );
}
