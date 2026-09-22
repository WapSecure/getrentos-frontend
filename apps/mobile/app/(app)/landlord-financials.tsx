import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Download, ReceiptText, Wallet } from 'lucide-react-native';
import {
  Card,
  Divider,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi } from '@/lib/api/landlord';
import { IncomeExpenseChart } from '@/components/landlord/IncomeExpenseChart';
import { ApiError } from '@/lib/api/client';
import { CSV_MIME, shareDownloadedFile } from '@/lib/shareFile';

export default function LandlordFinancials() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { bytes } = await landlordApi.financialsExport();
      await shareDownloadedFile(bytes, 'getrentos-financials.csv', CSV_MIME, 'Financials');
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not export that.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const stats = useQuery({
    queryKey: qk.landlord.financialsStats,
    queryFn: landlordApi.financialsStats,
  });
  const chart = useQuery({
    queryKey: qk.landlord.financialsChart,
    queryFn: landlordApi.financialsChart,
  });

  const s = stats.data;

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
          <Text variant="title">Financials</Text>
        </View>
        <Pressable
          onPress={exportCsv}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel="Export as CSV"
          accessibilityState={{ busy: exporting }}
          hitSlop={10}
        >
          <Download size={20} color={exporting ? colors.mutedForeground : colors.foreground} />
        </Pressable>
      </View>

      {stats.isError ? (
        <ErrorState onRetry={() => stats.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
        >
          {/* Net profit is the headline — a single figure, so no chart. */}
          <Card elevated>
            {stats.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                <Skeleton height={14} width="40%" />
                <Skeleton height={30} width="65%" />
              </View>
            ) : (
              <View style={{ gap: 2 }}>
                <Text variant="caption" color="mutedForeground">
                  Net profit
                </Text>
                <Price
                  amount={s?.netProfit ?? 0}
                  variant="display"
                  color={(s?.netProfit ?? 0) >= 0 ? 'foreground' : 'destructive'}
                />
              </View>
            )}
          </Card>

          <Card elevated padding="none">
            <Row label="Rental income" amount={s?.rentalIncome ?? 0} loading={stats.isLoading} />
            <Divider />
            <Row
              label="Maintenance costs"
              amount={s?.maintenanceCosts ?? 0}
              loading={stats.isLoading}
            />
            <Divider />
            <Row
              label="Outstanding rent"
              amount={s?.outstandingRent ?? 0}
              loading={stats.isLoading}
              tone={(s?.outstandingRent ?? 0) > 0 ? 'destructive' : undefined}
            />
          </Card>

          {(chart.data ?? []).length > 0 ? (
            <View style={{ gap: spacing.md }}>
              <Text variant="heading">Income vs expenses</Text>
              <Card elevated>
                <IncomeExpenseChart points={chart.data ?? []} />
              </Card>
            </View>
          ) : null}

          <Card padding="none">
            <LinkRow
              icon={<ReceiptText size={18} color={colors.primary} />}
              label="Expenses"
              description="Log and track what a property costs"
              onPress={() => router.push('/(app)/landlord-expenses')}
            />
            <Divider />
            <LinkRow
              icon={<Wallet size={18} color={colors.primary} />}
              label="Owner statements"
              description="Payouts, fees and period summaries"
              onPress={() => router.push('/(app)/landlord-owner-statements')}
            />
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

function Row({
  label,
  amount,
  loading,
  tone,
}: {
  label: string;
  amount: number;
  loading?: boolean;
  tone?: 'destructive';
}) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
      }}
    >
      <Text variant="callout" color="mutedForeground">
        {label}
      </Text>
      {loading ? (
        <Skeleton height={16} width={90} />
      ) : (
        <Price amount={amount} variant="bodyStrong" color={tone} />
      )}
    </View>
  );
}

function LinkRow({
  icon,
  label,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {description}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
