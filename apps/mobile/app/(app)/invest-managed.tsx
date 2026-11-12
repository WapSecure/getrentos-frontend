import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyRound, ReceiptText, ShieldCheck, Wrench } from '@sureground/icons/native';
import {
  STATEMENT_PAYOUT_LABELS,
  humaniseStatus,
  type InvestorManagedProperty,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  ListSkeleton,
  QueryState,
  SegmentedControl,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { investorApi } from '@/lib/api/investor';
import { managementApi } from '@/lib/api/management';
import { homeCareApi } from '@/lib/api/homeCare';
import { MANDATE_STATUS, type MandateStatus } from '@/lib/api/managedService';
import { formatDate, formatNaira } from '@/lib/format';
import { goBack } from '@/lib/goBack';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { FactList, type Fact } from '@/components/diaspora/FactList';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { SpendApprovalCard } from '@/components/management/SpendApprovalCard';
import { WorkOrderCard } from '@/components/homecare/WorkOrderCard';

/** Past this many properties a segmented control stops fitting a phone. */
const SEGMENTED_MAX = 3;
const JOB_PAGE_SIZE = 10;
const STATEMENT_STATUS_LABELS: Record<string, string> = { DRAFT: 'Draft', ISSUED: 'Issued' };

const isSet = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined;

/**
 * Sureground Managed for an investor (DIA-20): one property at a time, with its agreement, the
 * spending waiting for them, its repairs and the latest statement. Changes to the agreement stay
 * on the management screens; this one links there.
 */
export default function InvestManaged() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const managed = useQuery({ queryKey: qk.investor.managed, queryFn: investorApi.managed });
  const properties = managed.data?.properties ?? [];
  const [chosenId, setChosenId] = useState<string | null>(null);
  const property = properties.find((p) => p.propertyId === chosenId) ?? properties[0] ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Invest"
        title="Managed"
        subtitle="Agreement, spending, repairs and statements"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={managed.isRefetching}
            onRefresh={() => void managed.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState
          query={managed}
          skeleton={<ListSkeleton rows={3} variant="card" height={140} />}
          errorTitle="Your managed properties could not be loaded"
          isEmpty={properties.length === 0}
          empty={{
            icon: <KeyRound size={32} color={colors.mutedForeground} />,
            title: 'No property under Sureground Managed yet',
            description:
              'We find tenants, collect rent, arrange repairs and send you a monthly statement. Spending above your limit waits for your approval.',
            action: (
              <Button
                label="Set up Sureground Managed"
                onPress={() => router.push('/(app)/get-managed')}
              />
            ),
          }}
        >
          {property ? (
            <View style={{ gap: spacing.lg }}>
              {properties.length > 1 ? (
                <PropertyPicker
                  properties={properties}
                  value={property.propertyId}
                  onChange={setChosenId}
                />
              ) : null}
              <AgreementCard property={property} />
              <StatementCard property={property} />
              <Approvals key={`a-${property.propertyId}`} propertyId={property.propertyId} />
              <Jobs key={`j-${property.propertyId}`} propertyId={property.propertyId} />
            </View>
          ) : null}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function PropertyPicker({
  properties,
  value,
  onChange,
}: {
  properties: InvestorManagedProperty[];
  value: string;
  onChange: (id: string) => void;
}) {
  const label = (p: InvestorManagedProperty) =>
    p.pendingApprovals ? `${p.title} (${p.pendingApprovals})` : p.title;
  const options = properties.map((p) => ({ value: p.propertyId, label: label(p) }));
  if (properties.length <= SEGMENTED_MAX) {
    return (
      <SegmentedControl
        options={options}
        value={value}
        onChange={onChange}
        accessibilityLabel="Property"
      />
    );
  }
  return <ChipSelect label="Property" options={options} value={value} onChange={onChange} scroll />;
}

function AgreementCard({ property }: { property: InvestorManagedProperty }) {
  const { spacing } = useTheme();
  const { mandate, intake } = property;
  const status = mandate
    ? (MANDATE_STATUS[mandate.status as MandateStatus] ?? {
        label: humaniseStatus(mandate.status),
        tone: 'neutral' as const,
      })
    : null;
  const bands = mandate?.bands;

  const facts: Fact[] = mandate
    ? [
        {
          label: 'Status',
          value: status ? <Badge label={status.label} tone={status.tone} /> : null,
        },
        {
          label: 'Management fee',
          value: isSet(mandate.feePercent) ? `${mandate.feePercent}%` : null,
        },
        {
          label: 'Started',
          value: mandate.startedAt ? formatDate(mandate.startedAt, 'short') : null,
        },
        {
          label: 'Routine spending',
          value: isSet(bands?.routineCap) ? formatNaira(bands.routineCap) : 'Not set',
          hint: isSet(bands?.routineCap)
            ? 'Your manager spends up to this without asking.'
            : 'Until you set one, your manager can approve repairs of any amount.',
        },
        {
          label: 'Emergency spending',
          value: isSet(bands?.emergencyCap) ? formatNaira(bands.emergencyCap) : 'Not set',
          hint: isSet(bands?.emergencyCap)
            ? 'Urgent repairs up to this go ahead first; you are told at once.'
            : 'Urgent repairs follow your routine limit.',
        },
        {
          label: 'Explicit authorisation',
          value: isSet(bands?.explicitAbove)
            ? `Above ${formatNaira(bands.explicitAbove)}`
            : 'Not set',
          hint: 'You confirm it is you before approving.',
        },
      ]
    : intake
      ? [
          {
            label: 'Setting up',
            value: <Badge label={humaniseStatus(intake.status)} tone="info" />,
          },
        ]
      : [];

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="heading" headingLevel={2}>
          Agreement
        </Text>
        <Text variant="caption" color="mutedForeground">
          {property.title}
        </Text>
      </View>
      {facts.length ? (
        <FactList facts={facts} />
      ) : (
        <Text variant="callout" color="mutedForeground">
          No agreement yet.
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button
          label={mandate ? 'Manage agreement' : 'Continue setting up'}
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={() => router.push('/(app)/get-managed')}
        />
        {mandate?.status === 'ACTIVE' ? (
          <Button
            label="Change limits"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => router.push('/(app)/spend-approvals')}
          />
        ) : null}
      </View>
    </Card>
  );
}

function StatementCard({ property }: { property: InvestorManagedProperty }) {
  const { colors, spacing } = useTheme();
  const statement = property.lastStatement;
  const net = statement ? Number(statement.net) : NaN;

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="heading" headingLevel={2}>
          Latest statement
        </Text>
        <Text variant="caption" color="mutedForeground">
          Rent collected, less fees and repairs.
        </Text>
      </View>
      {statement ? (
        <>
          <FactList
            facts={[
              {
                label: 'Period',
                value: `${formatDate(statement.periodStart, 'short')} to ${formatDate(statement.periodEnd, 'short')}`,
              },
              {
                label: 'Statement net',
                value: Number.isFinite(net) ? formatNaira(net) : null,
                hint: 'For the whole statement, which can cover more than one property.',
              },
              {
                label: 'Status',
                value:
                  STATEMENT_STATUS_LABELS[statement.status] ??
                  STATEMENT_PAYOUT_LABELS[statement.status] ??
                  humaniseStatus(statement.status),
              },
            ]}
          />
          <Button
            label="See the breakdown"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => router.push('/(app)/landlord-owner-statements')}
          />
        </>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <ReceiptText size={18} color={colors.mutedForeground} />
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {property.mandate?.status === 'ACTIVE'
              ? 'Your first statement arrives at the end of the month.'
              : 'Statements start once Sureground manages this property.'}
          </Text>
        </View>
      )}
    </Card>
  );
}

function Approvals({ propertyId }: { propertyId: string }) {
  const { colors, spacing } = useTheme();
  const list = useQuery({
    queryKey: [...qk.management.spendApprovals('owner'), 'pending', propertyId],
    queryFn: () => managementApi.spendApprovals('owner', 1, 20, { status: 'PENDING', propertyId }),
  });
  const items = list.data?.items ?? [];
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" headingLevel={2}>
        Waiting for your approval
      </Text>
      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={1} variant="card" height={120} />}
        isEmpty={items.length === 0}
        empty={{
          icon: <ShieldCheck size={28} color={colors.mutedForeground} />,
          title: 'Nothing waiting for you',
          description: 'Spend above your routine limit on this property will appear here.',
        }}
      >
        <View style={{ gap: spacing.sm }}>
          {items.map((a) => (
            <SpendApprovalCard key={a.id} approval={a} role="owner" />
          ))}
        </View>
      </QueryState>
    </View>
  );
}

function Jobs({ propertyId }: { propertyId: string }) {
  const { colors, spacing } = useTheme();
  const jobs = useQuery({
    queryKey: qk.homeCare.workOrders(`property:${propertyId}`),
    queryFn: () => homeCareApi.workOrders(undefined, 1, JOB_PAGE_SIZE, propertyId),
  });
  const items = jobs.data?.items ?? [];
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" headingLevel={2}>
        Repairs and jobs
      </Text>
      <QueryState
        query={jobs}
        skeleton={<ListSkeleton rows={2} variant="card" height={96} />}
        errorTitle="Repairs could not be loaded"
        isEmpty={items.length === 0}
        empty={{
          icon: <Wrench size={28} color={colors.mutedForeground} />,
          title: 'No repairs on this property',
          description:
            'Jobs your manager raises appear here with their photos, quotes and invoices.',
        }}
      >
        <View style={{ gap: spacing.sm }}>
          {items.map((w) => (
            <WorkOrderCard key={w.id} w={w} />
          ))}
        </View>
      </QueryState>
    </View>
  );
}
