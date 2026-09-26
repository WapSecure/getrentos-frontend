import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, TrendingUp } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  ErrorState,
  Price,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  creditReportingApi,
  CREDIT_BUREAUS,
  type CreditBureau,
  type CreditReportingProfile,
  type ReportedPayment,
} from '@/lib/api/creditReporting';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function CreditReporting() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: qk.renter.creditReporting,
    queryFn: creditReportingApi.getProfile,
  });

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
        <DetailHeader
          eyebrow="Financial reputation"
          title="Credit reporting"
          subtitle="Turn on-time rent into verified history"
          onBack={() => router.back()}
          style={{ flex: 1 }}
        />
      </View>

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={200} radius={16} />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.data.status === 'enrolled' ? (
        <EnrolledView profile={query.data} />
      ) : (
        <OptInView profile={query.data} />
      )}
    </View>
  );
}

function OptInView({ profile }: { profile: CreditReportingProfile }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [bureau, setBureau] = useState<CreditBureau>('CRC Credit Bureau');

  const mutation = useMutation({
    mutationFn: () => creditReportingApi.enroll(bureau),
    onSuccess: (updated) => {
      qc.setQueryData(qk.renter.creditReporting, updated);
      toast.show(
        `You're now enrolled — ${updated.totalPaymentsReported} months will be reported.`,
        'success'
      );
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not enroll right now.', 'error'),
  });

  return (
    <Screen padded>
      <Card elevated>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TrendingUp size={20} color={colors.primary} />
          <Text variant="heading">Turn rent into credit history</Text>
        </View>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Benefit text="Your on-time rent counts toward your credit score" />
          <Benefit text="Reported to real credit bureaus, not just GetRentos" />
          <Benefit text="Only positive payment history is shared" />
        </View>
      </Card>

      <Card elevated>
        <Text variant="bodyStrong" style={{ marginBottom: spacing.sm }}>
          Choose a bureau
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CREDIT_BUREAUS.map((b) => (
            <Chip
              key={b}
              label={b}
              selected={bureau === b}
              onPress={() => setBureau(b)}
              size="sm"
            />
          ))}
        </View>
      </Card>

      {profile.totalPaymentsReported > 0 ? (
        <Text variant="caption" color="mutedForeground" style={{ textAlign: 'center' }}>
          {profile.totalPaymentsReported} months of on-time payment history will be reported once
          you enroll.
        </Text>
      ) : null}

      <Button
        label="Start Reporting My Rent"
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </Screen>
  );
}

function Benefit({ text }: { text: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <CheckCircle2 size={15} color={colors.success} />
      <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function EnrolledView({ profile }: { profile: CreditReportingProfile }) {
  const { spacing } = useTheme();

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Card elevated>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Badge label="Enrolled" tone="success" />
          {profile.enrolledAt ? (
            <Text variant="caption" color="mutedForeground">
              Since {formatDate(profile.enrolledAt, 'short')}
            </Text>
          ) : null}
        </View>
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
          Reporting to {profile.bureau}
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg }}>
          <Stat label="On-time streak" value={`${profile.consecutiveOnTimeMonths} mo`} />
          <Stat label="Payments reported" value={String(profile.totalPaymentsReported)} />
          <Stat label="Next report" value={formatDate(profile.nextReportDate, 'short')} />
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="heading">Reporting history</Text>
        {profile.reportedPayments.length === 0 ? (
          <Text variant="callout" color="mutedForeground">
            Nothing reported yet.
          </Text>
        ) : (
          <Card elevated padding="none">
            {profile.reportedPayments.map((p: ReportedPayment, i) => (
              <View key={p.id}>
                {i > 0 ? <Divider /> : null}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.lg,
                  }}
                >
                  <View>
                    <Text variant="callout">{p.month}</Text>
                    <Text variant="caption" color="mutedForeground">
                      Reported {formatDate(p.reportedDate, 'short')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Price amount={p.amount} variant="callout" />
                    <Badge
                      label={p.status === 'on_time' ? 'On time' : 'Late'}
                      tone={p.status === 'on_time' ? 'success' : 'danger'}
                    />
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="bodyStrong">{value}</Text>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}
