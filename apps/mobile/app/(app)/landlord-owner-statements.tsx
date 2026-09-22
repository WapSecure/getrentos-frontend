import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, RotateCcw, Send, Wallet, Plus } from 'lucide-react-native';
import {
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { GenerateStatementSheet } from '@/components/landlord/SmallFormSheets';
import { landlordApi, PAYOUT_TONE, type OwnerStatement } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

export default function LandlordOwnerStatements() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.ownerStatements(),
    queryFn: () => landlordApi.ownerStatements(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['landlord', 'owner-statements'] });
  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const issue = useMutation({
    mutationFn: (id: string) => landlordApi.issueOwnerStatement(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      invalidate();
      toast.show('Statement issued.', 'success');
    },
    onError: (e) => fail(e, 'Could not issue that statement.'),
  });

  const retry = useMutation({
    mutationFn: (id: string) => landlordApi.retryPayout(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      invalidate();
      toast.show('Payout retried.', 'success');
    },
    onError: (e) => fail(e, 'Could not retry that payout.'),
  });

  const items = query.data?.items ?? [];

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
        <Text variant="title" style={{ flex: 1 }}>
          Owner statements
        </Text>
        <Pressable
          onPress={() => setCreating(true)}
          accessibilityRole="button"
          accessibilityLabel="Generate a statement"
          hitSlop={10}
        >
          <Plus size={22} color={colors.primary} />
        </Pressable>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(s) => s.id}
          renderItem={({ item }: { item: OwnerStatement }) => (
            <StatementCard
              statement={item}
              busy={busyId === item.id}
              onIssue={() => issue.mutate(item.id)}
              onRetry={() => retry.mutate(item.id)}
            />
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
            query.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                {[0, 1].map((i) => (
                  <Skeleton key={i} height={160} radius={radius.lg} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<Wallet size={32} color={colors.mutedForeground} />}
                title="No statements yet"
                description="Period statements summarise gross income, fees and what was paid out."
              />
            )
          }
        />
      )}

      <GenerateStatementSheet open={creating} onClose={() => setCreating(false)} />
    </View>
  );
}

function StatementCard({
  statement: s,
  busy,
  onIssue,
  onRetry,
}: {
  statement: OwnerStatement;
  busy: boolean;
  onIssue: () => void;
  onRetry: () => void;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {formatDate(s.periodStart, 'short')} – {formatDate(s.periodEnd, 'short')}
          </Text>
          <Badge label={s.status} tone="neutral" />
          <Badge label={s.payoutStatus} tone={PAYOUT_TONE[s.payoutStatus]} />
        </View>

        <View style={{ gap: 4 }}>
          <Line label="Gross income" amount={s.grossIncome} />
          <Line label="Expenses" amount={-s.totalExpenses} />
          <Line label="Management fee" amount={-s.managementFee} />
          <Divider />
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text variant="callout" style={{ fontWeight: '700' }}>
              Net payout
            </Text>
            <Price amount={s.netPayout} variant="bodyStrong" />
          </View>
        </View>

        {s.paidAt ? (
          <Text variant="caption" color="mutedForeground">
            Paid {formatDate(s.paidAt, 'short')}
            {s.transferRef ? ` · ref ${s.transferRef}` : ''}
          </Text>
        ) : null}

        {s.status === 'draft' || s.payoutStatus === 'failed' ? (
          <Pressable
            onPress={s.payoutStatus === 'failed' ? onRetry : onIssue}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={
              s.payoutStatus === 'failed' ? 'Retry payout' : 'Issue this statement'
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.primary,
              opacity: busy ? 0.5 : 1,
              marginTop: 2,
            }}
          >
            {s.payoutStatus === 'failed' ? (
              <RotateCcw size={14} color={colors.primaryForeground} />
            ) : (
              <Send size={14} color={colors.primaryForeground} />
            )}
            <Text variant="caption" style={{ color: colors.primaryForeground, fontWeight: '600' }}>
              {s.payoutStatus === 'failed' ? 'Retry payout' : 'Issue statement'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

function Line({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Price amount={amount} variant="caption" />
    </View>
  );
}
