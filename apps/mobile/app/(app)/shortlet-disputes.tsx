import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
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
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill, type Tone } from '@/components/host/HostUI';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type GuestDepositClaim, type ShortletDispute } from '@/lib/api/shortlets';
import { GUEST_DISPUTE_CATEGORIES, OUTCOME_LABEL } from '@/lib/stays';
import { formatDate } from '@/lib/format';

const DISPUTE_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Open', tone: 'warning' },
  UNDER_REVIEW: { label: 'Under review', tone: 'info' },
  ESCALATED: { label: 'Escalated', tone: 'danger' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
};

const CLAIM_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Being reviewed', tone: 'warning' },
  APPROVED: { label: 'Upheld', tone: 'danger' },
  PARTIAL: { label: 'Partly upheld', tone: 'info' },
  REJECTED: { label: 'Not upheld', tone: 'success' },
};

type Tab = 'disputes' | 'claims';

/** What the guest has raised with support, and what hosts have claimed from their deposits. */
export default function GuestDisputes() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('disputes');
  const disputes = useQuery({
    queryKey: qk.shortlets.disputes,
    queryFn: () => shortletsApi.disputes(),
  });
  const claims = useQuery({
    queryKey: qk.shortlets.depositClaims,
    queryFn: () => shortletsApi.depositClaims(),
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
        eyebrow="Short stays"
        title="Disputes & claims"
        subtitle="Open one from the stay it’s about"
        onBack={() => router.back()}
      />
      <SegmentedControl
        accessibilityLabel="Disputes or deposit claims"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'disputes', label: 'Disputes' },
          { value: 'claims', label: 'Deposit claims' },
        ]}
      />
      {active.isError && !active.data ? (
        <ErrorState onRetry={() => active.refetch()} />
      ) : active.isPending ? (
        <Skeleton height={110} radius={radius.lg} />
      ) : tab === 'disputes' ? (
        disputes.data?.items.length ? (
          disputes.data.items.map((d) => <DisputeRow key={d.id} d={d} />)
        ) : (
          <EmptyState
            icon={<Gavel size={34} color={colors.mutedForeground} />}
            title="No disputes"
            description="If something goes wrong with a stay, raise it from the stay and support steps in."
          />
        )
      ) : claims.data?.items.length ? (
        claims.data.items.map((c) => <ClaimRow key={c.id} c={c} />)
      ) : (
        <EmptyState
          icon={<ShieldCheck size={34} color={colors.mutedForeground} />}
          title="No claims on your deposits"
          description="Deposits come back to you after checkout unless a host reports damage."
        />
      )}
    </ScrollView>
  );
}

function DisputeRow({ d }: { d: ShortletDispute }) {
  const { colors, spacing } = useTheme();
  const s = DISPUTE_STATUS[d.status] ?? { label: d.status, tone: 'neutral' as Tone };
  const category =
    GUEST_DISPUTE_CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category;
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(app)/shortlet-dispute/[id]', params: { id: d.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${d.guestPromise ? 'Guest Promise report' : d.title}, ${s.label}`}
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
            {d.guestPromise ? 'Guest Promise' : category} · {formatDate(d.createdAt, 'medium')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <StatusPill label={s.label} tone={s.tone} />
            {d.outcome ? (
              <Text variant="caption" color="mutedForeground">
                {OUTCOME_LABEL[d.outcome]}
              </Text>
            ) : d.refundAmount ? (
              <Text variant="caption" color="mutedForeground">
                ₦{d.refundAmount.toLocaleString('en-NG')} refunded to you
              </Text>
            ) : null}
          </View>
        </Card>
      )}
    </Pressable>
  );
}

function ClaimRow({ c }: { c: GuestDepositClaim }) {
  const { colors, spacing, radius } = useTheme();
  const s = CLAIM_STATUS[c.status] ?? { label: c.status, tone: 'neutral' as Tone };
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {c.listingTitle ?? 'Your stay'}
          </Text>
          <Text variant="caption" color="mutedForeground">
            Claimed {formatDate(c.createdAt, 'medium')}
          </Text>
        </View>
        <Price amount={c.amount} variant="bodyStrong" />
      </View>
      <Text variant="callout">{c.reason}</Text>
      {c.evidenceUrls?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {c.evidenceUrls.map((u, i) => (
            <Image
              key={u}
              source={{ uri: u }}
              contentFit="cover"
              accessibilityLabel={`Evidence photo ${i + 1}`}
              style={{
                width: 88,
                height: 88,
                borderRadius: radius.md,
                backgroundColor: colors.secondary,
              }}
            />
          ))}
        </ScrollView>
      ) : null}
      <StatusPill label={s.label} tone={s.tone} />
      {c.status === 'PENDING' ? (
        <Text variant="caption" color="mutedForeground">
          Support is reviewing this. Disagree? Open a dispute from the stay and tell them why.
        </Text>
      ) : (
        <Text variant="caption" color="mutedForeground">
          {c.deductedAmount != null
            ? `₦${c.deductedAmount.toLocaleString('en-NG')} kept from your deposit`
            : ''}
          {c.refundedAmount != null
            ? ` · ₦${c.refundedAmount.toLocaleString('en-NG')} returned to you`
            : ''}
          {c.resolution ? `\n“${c.resolution}”` : ''}
        </Text>
      )}
    </Card>
  );
}
