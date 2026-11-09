import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download } from 'lucide-react-native';
import {
  Button,
  Card,
  DateField,
  Divider,
  ListSkeleton,
  Price,
  QueryState,
  Text,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  EXPORTS,
  landlordFinanceApi,
  monthsAgo,
  RENT_PERIOD_SUFFIX,
  type ReportExport,
} from '@/lib/api/landlordFinance';
import { errorMessage } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { CSV_MIME, shareDownloadedFile } from '@/lib/shareFile';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { planRefusal, retryUnlessPlanGate } from '@/lib/api/estateGate';
import { ProUpsell } from '@/components/estate/governance/ProUpsell';

/**
 * Reports: the rent roll, income and expenses per property over a chosen
 * window, and CSV exports of each, plus arrears and statement history.
 */
export default function LandlordReports() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [from, setFrom] = useState(() => monthsAgo(12));
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [exporting, setExporting] = useState<ReportExport | null>(null);

  const roll = useQuery({
    queryKey: qk.landlord.rentRoll,
    queryFn: landlordFinanceApi.rentRoll,
    retry: retryUnlessPlanGate,
  });
  const pnl = useQuery({
    queryKey: qk.landlord.pnl(from, to),
    queryFn: () => landlordFinanceApi.pnl(from, to),
    placeholderData: keepPreviousData,
    enabled: !!from && !!to,
    retry: retryUnlessPlanGate,
  });
  const locked = !!planRefusal(roll.error) || !!planRefusal(pnl.error);

  const exportCsv = async (kind: ReportExport) => {
    setExporting(kind);
    try {
      const { bytes } = await landlordFinanceApi.download(kind, { from, to });
      await shareDownloadedFile(bytes, EXPORTS[kind].file, CSV_MIME, EXPORTS[kind].label);
    } catch (e) {
      toast.show(errorMessage(e, 'Could not export that.'), 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Financials"
        title="Reports"
        subtitle="Rent roll, income and expenses, exports"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.xl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={roll.isRefetching || pnl.isRefetching}
            onRefresh={() => {
              roll.refetch();
              pnl.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
      >
        {locked ? (
          <ProUpsell
            title="Reports are part of Pro"
            description="Your rent roll and income and expenses, ready to export."
            perks={[
              'Rent roll across every unit, with what is outstanding',
              'Income and expenses per property for any window',
              'CSV exports, including arrears and statement history',
            ]}
            note={null}
          />
        ) : (
          <>
            <View style={{ gap: spacing.md }}>
              <SectionHead
                title="Income & expenses"
                action={<ExportButton kind="pnl" exporting={exporting} onExport={exportCsv} />}
              />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <DateField label="From" value={from} onChange={setFrom} max={to} />
                </View>
                <View style={{ flex: 1 }}>
                  <DateField label="To" value={to} onChange={setTo} min={from} />
                </View>
              </View>
              <QueryState query={pnl} skeleton={<ListSkeleton rows={3} />}>
                {!pnl.data || pnl.data.rows.length === 0 ? (
                  <Text variant="callout" color="mutedForeground">
                    No income or expenses in this period.
                  </Text>
                ) : (
                  <Card padding="none">
                    {pnl.data.rows.map((r, i) => (
                      <View key={r.propertyId}>
                        {i > 0 ? <Divider /> : null}
                        <PnlLine
                          title={r.propertyTitle}
                          income={r.income}
                          expenses={r.expenses}
                          net={r.net}
                        />
                      </View>
                    ))}
                    <Divider />
                    <PnlLine
                      title="Total"
                      income={pnl.data.totals.income}
                      expenses={pnl.data.totals.expenses}
                      net={pnl.data.totals.net}
                      strong
                    />
                  </Card>
                )}
              </QueryState>
            </View>

            <View style={{ gap: spacing.md }}>
              <SectionHead
                title="Rent roll"
                action={
                  <ExportButton kind="rent-roll" exporting={exporting} onExport={exportCsv} />
                }
              />
              <QueryState query={roll} skeleton={<ListSkeleton rows={4} />}>
                {!roll.data || roll.data.length === 0 ? (
                  <Text variant="callout" color="mutedForeground">
                    No units yet.
                  </Text>
                ) : (
                  <Card padding="none">
                    {roll.data.map((r, i) => (
                      <View key={`${r.propertyTitle}-${r.unitName}-${i}`}>
                        {i > 0 ? <Divider /> : null}
                        <View style={{ padding: spacing.lg, gap: 2 }}>
                          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                            <Text
                              variant="callout"
                              style={{ flex: 1, fontWeight: '600' }}
                              numberOfLines={1}
                            >
                              {r.unitName}
                            </Text>
                            <Text variant="callout">
                              {r.rentAmount != null
                                ? `${formatNaira(r.rentAmount)}${RENT_PERIOD_SUFFIX[r.rentPeriod ?? ''] ?? ''}`
                                : '—'}
                            </Text>
                          </View>
                          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                            {r.propertyTitle} · {r.occupied ? r.tenantName || 'Tenant' : 'Vacant'}
                          </Text>
                          {r.outstanding > 0 ? (
                            <Text
                              variant="caption"
                              style={{ color: colors.warning, fontWeight: '600' }}
                            >
                              {formatNaira(r.outstanding)} outstanding
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </Card>
                )}
              </QueryState>
            </View>

            <View style={{ gap: spacing.md }}>
              <Text variant="heading">More exports</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <ExportButton
                  kind="arrears"
                  label="Arrears (CSV)"
                  exporting={exporting}
                  onExport={exportCsv}
                />
                <ExportButton
                  kind="statements"
                  label="Statement history (CSV)"
                  exporting={exporting}
                  onExport={exportCsv}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionHead({ title, action }: { title: string; action: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Text variant="heading" style={{ flex: 1 }}>
        {title}
      </Text>
      {action}
    </View>
  );
}

function PnlLine({
  title,
  income,
  expenses,
  net,
  strong,
}: {
  title: string;
  income: number;
  expenses: number;
  net: number;
  strong?: boolean;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ padding: spacing.lg, gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Text variant={strong ? 'bodyStrong' : 'callout'} style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
        <Price
          amount={net}
          variant={strong ? 'bodyStrong' : 'callout'}
          color={net >= 0 ? 'success' : 'destructive'}
        />
      </View>
      <Text variant="caption" color="mutedForeground">
        {formatNaira(income)} in · {formatNaira(expenses)} out
      </Text>
    </View>
  );
}

function ExportButton({
  kind,
  label,
  exporting,
  onExport,
}: {
  kind: ReportExport;
  label?: string;
  exporting: ReportExport | null;
  onExport: (kind: ReportExport) => void;
}) {
  const { colors } = useTheme();
  return (
    <Button
      label={label ?? 'Export CSV'}
      size="sm"
      variant="secondary"
      icon={<Download size={14} color={colors.foreground} />}
      loading={exporting === kind}
      disabled={!!exporting}
      onPress={() => onExport(kind)}
    />
  );
}
