import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CircleAlert,
  Download,
  FileBarChart,
  Plus,
  Receipt,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Button,
  Card,
  ErrorState,
  IconButton,
  Price,
  SectionHeader,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';
import { errorText } from '@/components/estate/EstateUI';
import { isUpgradeError } from '@/components/host/HostUI';
import { ProUpsell } from '@/components/estate/governance/ProUpsell';
import {
  GenerateStatementSheet,
  PayoutAccountCard,
  StatementRow,
  StatementSheet,
} from '@/components/estate/governance/EstateStatements';
import { useEstate } from '@/hooks/useEstate';
import { isFreeEstate } from '@/lib/api/estateManager';
import {
  REPORT_PERIODS,
  estateGovernanceApi,
  governanceKeys,
  type EstateStatement,
  type ReportPeriod,
} from '@/lib/api/estateGovernance';
import { CSV_MIME, shareDownloadedFile } from '@/lib/shareFile';

/**
 * The estate's money. Reports (what came in, what's outstanding, the trend and
 * a CSV of every due) are Pro. Statements and the payout account are on every
 * plan: they are how collected dues reach the estate's bank.
 */
export default function EstateFinancials() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { estate, estateId, estates } = useEstate();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [generating, setGenerating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const free = isFreeEstate(estate);

  // Don't ask for reports the estate hasn't paid for.
  const stats = useQuery({
    queryKey: governanceKeys.financialStats(estateId, period),
    queryFn: () => estateGovernanceApi.financialStats(estateId, period),
    enabled: !!estateId && !free,
    retry: (n, e) => !isUpgradeError(e) && n < 2,
    placeholderData: (prev) => prev,
  });
  const locked = free || isUpgradeError(stats.error);
  const chart = useQuery({
    queryKey: governanceKeys.financialChart(estateId),
    queryFn: () => estateGovernanceApi.financialChart(estateId),
    enabled: !!estateId && !locked && stats.isFetched,
  });
  const account = useQuery({
    queryKey: governanceKeys.payoutAccount(estateId),
    queryFn: () => estateGovernanceApi.payoutAccount(estateId),
    enabled: !!estateId,
  });
  const statements = useInfiniteQuery({
    queryKey: governanceKeys.statementList(estateId),
    queryFn: ({ pageParam }) => estateGovernanceApi.statements(estateId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<EstateStatement[]>(
    () => statements.data?.pages.flatMap((p) => p.items) ?? [],
    [statements.data]
  );

  const refresh = () => {
    if (!locked) {
      void stats.refetch();
      void chart.refetch();
    }
    void account.refetch();
    void statements.refetch();
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { bytes } = await estateGovernanceApi.financialsExport(estateId);
      await shareDownloadedFile(bytes, 'getrentos-estate-dues.csv', CSV_MIME, 'Estate dues');
    } catch (e) {
      toast.show(errorText(e, 'Could not export the dues.'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const s = stats.data;
  const span = REPORT_PERIODS.find((p) => p.value === period)?.span ?? '';
  const trend = chart.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={stats.isRefetching || statements.isRefetching}
            onRefresh={refresh}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Estate office'}
          title="Financials"
          subtitle="Dues collected, statements and payouts"
          onBack={() => router.back()}
          accessory={
            locked ? null : (
              <IconButton
                accessibilityLabel="Export every due as a spreadsheet"
                disabled={!estateId || exporting}
                onPress={exportCsv}
                icon={
                  <Download
                    size={20}
                    color={exporting ? colors.mutedForeground : colors.foreground}
                  />
                }
              />
            )
          }
        />

        {locked ? (
          <ProUpsell
            title="Financial reports are part of Pro"
            description="See what the estate has collected and what it’s still owed, period by period."
            perks={[
              'Dues collected, outstanding and late fees by month, quarter or year',
              'Six months of collections at a glance',
              'Every due exported as a spreadsheet',
            ]}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            <SegmentedControl
              accessibilityLabel="Report period"
              value={period}
              onChange={setPeriod}
              options={REPORT_PERIODS.map(({ value, label }) => ({ value, label }))}
            />
            {stats.isError && !s ? (
              <ErrorState onRetry={() => stats.refetch()} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <Tile
                    Icon={Wallet}
                    tint={colors.success}
                    label="Collected"
                    amount={s?.duesCollected}
                  />
                  <Tile
                    Icon={CircleAlert}
                    tint={colors.destructive}
                    label="Outstanding now"
                    amount={s?.duesOutstanding}
                  />
                  <Tile
                    Icon={Receipt}
                    tint={colors.warning}
                    label="Late fees collected"
                    amount={s?.lateFeesCollected}
                  />
                  <Tile
                    Icon={Users}
                    tint={colors.primary}
                    label="Households that paid"
                    count={s?.householdsBilled}
                  />
                </View>
                {s ? (
                  <Text variant="caption" color="mutedForeground">
                    Collected, late fees and households cover {span}. Outstanding is everything
                    still owed today.
                  </Text>
                ) : null}
              </>
            )}
            <Card elevated style={{ gap: spacing.sm }}>
              <Text variant="bodyStrong">Dues collected</Text>
              <Text variant="caption" color="mutedForeground">
                Monthly, last 6 months
              </Text>
              {chart.isPending ? (
                <Skeleton height={120} radius={radius.md} />
              ) : trend.some((p) => p.value > 0) ? (
                <RevenueTrendChart points={trend} />
              ) : (
                <Text variant="callout" color="mutedForeground">
                  Nothing collected in the last 6 months yet.
                </Text>
              )}
            </Card>
          </View>
        )}

        <View style={{ gap: spacing.md }}>
          <SectionHeader title="Payout account" />
          {account.isError && !account.data ? (
            <ErrorState onRetry={() => account.refetch()} />
          ) : (
            <PayoutAccountCard
              estateId={estateId}
              account={account.data}
              loading={account.isPending && !!estateId}
            />
          )}
          {estates.length > 1 ? (
            <Text variant="caption" color="mutedForeground">
              The payout account and statements cover every estate your organisation runs, not just{' '}
              {estate?.name ?? 'this one'}.
            </Text>
          ) : null}
        </View>

        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <SectionHeader title="Dues statements" />
            </View>
            <Button
              label="Generate"
              size="sm"
              variant="secondary"
              fullWidth={false}
              disabled={!estateId}
              icon={<Plus size={14} color={colors.foreground} />}
              accessibilityLabel="Generate a statement"
              onPress={() => setGenerating(true)}
            />
          </View>
          {statements.isError && !statements.data ? (
            <ErrorState onRetry={() => statements.refetch()} />
          ) : statements.isPending ? (
            [0, 1].map((i) => <Skeleton key={i} height={72} radius={radius.lg} />)
          ) : !items.length ? (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <FileBarChart size={20} color={colors.mutedForeground} />
              <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                No statements yet. Generate one for a period to see what was collected and pay it
                out to the estate.
              </Text>
            </Card>
          ) : (
            <>
              {items.map((st) => (
                <StatementRow key={st.id} s={st} onPress={() => setOpenId(st.id)} />
              ))}
              {statements.hasNextPage ? (
                <Button
                  label="Show older statements"
                  variant="ghost"
                  loading={statements.isFetchingNextPage}
                  onPress={() => statements.fetchNextPage()}
                />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <GenerateStatementSheet
        open={generating}
        onClose={() => setGenerating(false)}
        estateId={estateId}
      />
      <StatementSheet
        estateId={estateId}
        statementId={openId}
        account={account.data}
        onClose={() => setOpenId(null)}
      />
    </View>
  );
}

function Tile({
  Icon,
  tint,
  label,
  amount,
  count,
}: {
  Icon: LucideIcon;
  tint: string;
  label: string;
  amount?: number;
  count?: number;
}) {
  const { spacing } = useTheme();
  const loading = amount === undefined && count === undefined;
  const value =
    amount !== undefined
      ? `${Math.round(amount).toLocaleString('en-NG')} naira`
      : (count ?? 0).toLocaleString('en-NG');
  return (
    <Card
      elevated
      accessible
      accessibilityLabel={loading ? `${label}, loading` : `${label}, ${value}`}
      style={{ flexBasis: '47%', flexGrow: 1, gap: spacing.xs }}
    >
      <Icon size={18} color={tint} />
      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
        {label}
      </Text>
      {loading ? (
        <Skeleton height={22} width="70%" />
      ) : amount !== undefined ? (
        <Price amount={amount} compact variant="subheading" />
      ) : (
        <Text variant="subheading">{(count ?? 0).toLocaleString('en-NG')}</Text>
      )}
    </Card>
  );
}
