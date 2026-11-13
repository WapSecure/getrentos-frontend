import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Building2,
  Clock,
  Globe,
  Handshake,
  KeyRound,
  Scale,
  Search,
  Settings2,
  ShieldCheck,
  Video,
  Wallet,
  type SgIcon,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  LinkButton,
  ListSkeleton,
  QueryState,
  StatGroup,
  Text,
  useTheme,
  type StatGroupItem,
} from '@sureground/ui-native';
import {
  BUDGET_BAND_LABELS,
  CURRENCY_LABELS,
  FOREIGN_CHECK_STATUS,
  HORIZON_LABELS,
  INTENDED_USE_LABELS,
  OWNERSHIP_LABELS,
  PROPERTY_TYPE_LABELS,
  STATEMENT_PAYOUT_LABELS,
  buildAttentionQueue,
  countryName,
  formatDualTime,
  getInitials,
  greetingFor,
  humaniseStatus,
  identityHeadline,
  identityProgress,
  listLabels,
  portfolioFigures,
  portfolioValuationSubtitle,
  portfolioValuationView,
  timeZoneCity,
  valuationSentence,
  type ForeignIdentityStatus,
  type InvestorAttentionKind,
  type InvestorOverview,
  type InvestorProfile,
} from '@sureground/shared';
import { qk } from '@/lib/query/keys';
import { investorApi } from '@/lib/api/investor';
import { buyerTransactionsApi } from '@/lib/api/buyerTransactions';
import { deviceTimeZone, landBuyerExtrasApi } from '@/lib/api/landBuyerExtras';
import { formatDate, formatNaira } from '@/lib/format';
import { goBack } from '@/lib/goBack';
import { IndicativeAmount } from '@/components/money/IndicativeAmount';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useForeignIdentityStatus } from '@/hooks/useForeignIdentityStatus';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { AttentionList, type AttentionListItem } from '@/components/attention/AttentionList';
import { FactList, type Fact } from '@/components/diaspora/FactList';
import { PurchaseSummaryList } from '@/components/purchases/PurchaseSummaryList';
import { StepProgress } from '@/components/purchases/StepProgress';
import { purchaseWorkspaceHref } from '@/components/purchases/purchaseHref';

/** Enough rows to total the deposits held; a longer history shows the count only. */
const LIST_PAGE = 50;

const KIND_ICON: Record<InvestorAttentionKind, SgIcon> = {
  risk: AlertCircle,
  deposit: ShieldCheck,
  approval: Handshake,
  purchase: Building2,
  tour: Video,
  spending: Wallet,
  identity: Globe,
  dispute: Scale,
};

const ROUTES = {
  onboarding: '/(app)/invest-onboarding',
  risk: '/(app)/invest-onboarding?step=risk',
  identity: '/(app)/invest-identity',
  managedArea: '/(app)/invest-managed',
  agreements: '/(app)/get-managed',
  approvals: '/(app)/spend-approvals',
  discover: '/(app)/(buyer)/discover',
  transactions: '/(app)/buyer-transactions',
  tours: '/(app)/buyer-land-tours',
} as const;

const go = (path: string) => () => router.push(path as Href);

/** "12 Nov 2026 · 10:00 Lagos · 09:00 London": business dates stay Lagos (D2). */
const dualMoment = (iso: string, timeZone?: string | null) =>
  `${formatDate(iso, 'short')} · ${formatDualTime(iso, timeZone)}`;

/** Re-reads the clock every 30 seconds, so the times stay current while the screen is open. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * Sureground Diaspora Invest: the investor's one place for what needs them, their portfolio,
 * purchases, property care, profile and identity checks. The same sections as the web workspace.
 */
export default function InvestorWorkspace() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { profile: account, workspaces } = useAuth();
  // Purchases live with buying and managed property with owning: link across only for that role.
  const buyer = workspaces.includes('buyer');
  const owner = workspaces.includes('owner');

  const overview = useQuery({ queryKey: qk.investor.overview, queryFn: investorApi.overview });
  const identity = useForeignIdentityStatus();
  const tours = useQuery({
    queryKey: qk.buyerLand.tours,
    queryFn: landBuyerExtrasApi.tours,
    enabled: buyer,
    retry: false,
  });
  // Deposit amounts: the overview counts purchases but does not total what is held.
  const transactions = useQuery({
    queryKey: [...qk.investor.transactions, LIST_PAGE],
    queryFn: () => buyerTransactionsApi.list(1, LIST_PAGE),
    enabled: buyer,
    retry: false,
  });

  const data = overview.data;
  const profile = data?.profile ?? null;
  const profileComplete = Boolean(profile) && (profile?.missingFields ?? []).length === 0;
  const timeZone = profile?.timeZone ?? deviceTimeZone();
  const firstName = account?.legalName?.trim().split(/\s+/)[0];
  const livesIn = countryName(profile?.countryOfResidence) ?? profile?.countryOfResidence;
  const chip = identityHeadline(identity.data);
  const currency = profile?.displayCurrency ?? 'NGN';

  const txList = transactions.data;
  const attention: AttentionListItem[] = buildAttentionQueue({
    riskAccepted: data?.riskDeclaration ? data.riskDeclaration.accepted : undefined,
    purchases: data?.purchases,
    depositsDue: txList?.items
      .filter((t) => t.escrowStatus === 'deposit_pending')
      .map((t) => ({ id: t.id, propertyTitle: t.propertyTitle, depositAmount: t.depositAmount })),
    tours: tours.data,
    spendApprovals: data?.pendingSpendApprovals,
    identity: identity.data,
    links: {
      purchase: purchaseWorkspaceHref,
      risk: ROUTES.risk,
      tours: buyer ? ROUTES.tours : undefined,
      approvals: owner ? ROUTES.approvals : undefined,
      // No dispute screens on mobile yet, so a dispute opens its purchase workspace (no `dispute` link).
      identity: ROUTES.identity,
    },
  }).map((item) => ({
    ...item,
    icon: KIND_ICON[item.kind],
    due: item.dueAt
      ? `${item.dueLabel ? `${item.dueLabel}: ` : ''}${dualMoment(item.dueAt, timeZone)}`
      : undefined,
  }));

  const figures = portfolioFigures(
    data,
    txList ? { items: txList.items, complete: txList.total <= txList.items.length } : undefined
  );
  const portfolio: StatGroupItem[] = [];
  if (figures.activePurchases !== null) {
    portfolio.push({
      label: 'Active purchases',
      value: figures.activePurchases,
      subtitle: figures.representing
        ? `Plus ${figures.representing} you represent`
        : 'Homes and land in progress',
      onPress: buyer ? go(ROUTES.transactions) : undefined,
    });
  }
  if (figures.depositsHeldCount !== null) {
    const amount = figures.depositsHeldAmount;
    portfolio.push({
      label: 'Deposits protected',
      value: amount !== null ? formatNaira(amount) : figures.depositsHeldCount,
      subtitle:
        amount !== null
          ? `${figures.depositsHeldCount} under Payment Protection`
          : 'Under Payment Protection',
      supplement: amount ? (
        <IndicativeAmount naira={amount} currency={currency} labelDisplay="popover" />
      ) : undefined,
      onPress: buyer ? go(ROUTES.transactions) : undefined,
    });
  }
  if (figures.managedProperties !== null) {
    portfolio.push({
      label: 'Properties managed',
      value: figures.managedProperties,
      subtitle: 'Under Sureground Managed',
      onPress: owner ? go(ROUTES.managedArea) : undefined,
    });
  }
  // DIA-30: only in-date reports by accredited valuers, always with the valuer and date.
  const valued = portfolioValuationView(data?.portfolio);
  if (valued && (valued.valuedCount > 0 || valued.notValuedCount > 0)) {
    portfolio.push({
      label: 'Valued (accredited valuer)',
      value: valued.total !== null ? formatNaira(valued.total) : 'Not valued',
      subtitle: portfolioValuationSubtitle(valued),
    });
  }
  if (data && 'latestStatement' in data) {
    const statement = data.latestStatement;
    const net = figures.latestStatementNet;
    portfolio.push({
      label: 'Latest statement',
      value: net !== null ? formatNaira(net) : 'None yet',
      subtitle: statement
        ? `Net to you, ${formatDate(statement.periodStart, 'short')} to ${formatDate(statement.periodEnd, 'short')}`
        : 'Monthly, once a property is managed',
      supplement: net ? (
        <IndicativeAmount naira={net} currency={currency} labelDisplay="popover" />
      ) : undefined,
      onPress: statement && owner ? go(ROUTES.managedArea) : undefined,
    });
  }

  const refreshing = overview.isRefetching || identity.isRefetching;
  const refresh = () => {
    void overview.refetch();
    void identity.refetch();
    if (buyer) {
      void tours.refetch();
      void transactions.refetch();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Sureground Diaspora Invest"
        title={`${greetingFor(now, profile?.timeZone)}${firstName ? `, ${firstName}` : ''}`}
        subtitle="Deadlines are Lagos dates; times show Lagos and yours"
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
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {livesIn || profile?.timeZone ? (
            <Meta
              Icon={Globe}
              label={[livesIn, profile?.timeZone ? `${timeZoneCity(profile.timeZone)} time` : null]
                .filter(Boolean)
                .join(' · ')}
            />
          ) : null}
          <Meta Icon={Clock} label={formatDualTime(now, timeZone)} />
          {chip ? <Badge label={chip.label} tone={chip.tone} /> : null}
        </View>
        {buyer ? (
          <Button
            label="Find a property"
            icon={<Search size={16} color={colors.primaryForeground} />}
            onPress={go(ROUTES.discover)}
          />
        ) : null}

        <QueryState
          query={overview}
          skeleton={<ListSkeleton rows={3} variant="card" height={140} />}
          isEmpty={!profileComplete}
          empty={{
            icon: <Globe size={32} color={colors.mutedForeground} />,
            title: 'Set up your investor profile',
            description:
              'Tell us where you live, your time zone and what you are looking for, then read the risk statement. It takes a few minutes.',
            action: <Button label="Get started" onPress={go(ROUTES.onboarding)} />,
          }}
        >
          <View style={{ gap: spacing.lg }}>
            <AttentionList
              items={attention}
              empty={{
                title: 'You’re all caught up',
                description:
                  'Nothing needs you right now. Deposits, approvals and tour times will appear here as they come up.',
              }}
            />

            {portfolio.length > 0 ? (
              <StatGroup
                title="Portfolio"
                items={portfolio}
                footer={
                  <View style={{ gap: spacing.xs }}>
                    {valued?.valuations.map((v) => (
                      <Text key={v.id} variant="caption" color="mutedForeground">
                        {v.propertyTitle}: {valuationSentence(v)}
                        {v.outOfDate ? ' (out of date, not counted)' : ''}
                      </Text>
                    ))}
                    <Text variant="caption" color="mutedForeground">
                      Payment Protection covers deposits only.
                    </Text>
                  </View>
                }
              />
            ) : null}

            {data?.purchases ? (
              <Card style={{ gap: spacing.md }}>
                <Text variant="subheading" accessibilityRole="header">
                  Your purchases
                </Text>
                {data.purchases.length ? (
                  <>
                    <PurchaseSummaryList purchases={data.purchases} />
                    {buyer ? (
                      <LinkButton label="All purchases" onPress={go(ROUTES.transactions)} />
                    ) : null}
                  </>
                ) : (
                  <EmptyState
                    size="compact"
                    icon={<Building2 size={28} color={colors.mutedForeground} />}
                    title="No purchases yet"
                    description="When an offer is accepted, the purchase appears here with its progress, deposit and legal status."
                  />
                )}
              </Card>
            ) : null}

            {data ? <PropertyCare data={data} owner={owner} /> : null}
            {profile ? <ProfileSummary summary={profile} risk={data?.riskDeclaration} /> : null}
            {identity.data?.eligible ? <IdentityChecks status={identity.data} /> : null}
          </View>
        </QueryState>
      </ScrollView>
    </View>
  );
}

function Meta({ Icon, label }: { Icon: SgIcon; label: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: colors.secondary,
      }}
    >
      <Icon size={13} color={colors.mutedForeground} />
      <Text variant="caption" color="mutedForeground" style={{ fontVariant: ['tabular-nums'] }}>
        {label}
      </Text>
    </View>
  );
}

/** Managed property: agreements, spending waiting for approval and the latest statement. */
function PropertyCare({ data, owner }: { data: InvestorOverview; owner: boolean }) {
  const { colors, spacing } = useTheme();
  const managed = data.activeManagedProperties ?? 0;
  const spend = data.pendingSpendApprovals;
  const statement = data.latestStatement ?? null;

  if (managed === 0 && !statement && !spend?.count) {
    return (
      <Card>
        <EmptyState
          size="compact"
          icon={<KeyRound size={28} color={colors.mutedForeground} />}
          title="Let Sureground look after your property"
          description="With Sureground Managed we find tenants, collect rent, arrange repairs and send you a monthly statement. Spending above your limit waits for your approval."
          action={
            owner ? (
              <Button label="Set up Sureground Managed" onPress={go(ROUTES.agreements)} />
            ) : undefined
          }
        />
      </Card>
    );
  }

  const spendAmount = Number(spend?.totalAmount);
  const net = statement ? Number(statement.netAmount) : NaN;
  const facts: Fact[] = [
    { label: 'Active agreements', value: String(managed) },
    {
      label: 'Spending awaiting your approval',
      value: spend?.count
        ? Number.isFinite(spendAmount)
          ? `${spend.count}, ${formatNaira(spendAmount)} in total`
          : String(spend.count)
        : 'None',
    },
    {
      label: 'Latest statement',
      value: statement
        ? Number.isFinite(net)
          ? `${formatNaira(net)} net to you`
          : 'Issued'
        : 'None yet',
      hint: statement
        ? `${formatDate(statement.periodStart, 'short')} to ${formatDate(statement.periodEnd, 'short')} · ${
            STATEMENT_PAYOUT_LABELS[statement.payoutStatus] ??
            humaniseStatus(statement.payoutStatus)
          }`
        : undefined,
    },
  ];

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="subheading" accessibilityRole="header">
          Property care
        </Text>
        <Text variant="caption" color="mutedForeground">
          Your homes under Sureground Managed.
        </Text>
      </View>
      <FactList facts={facts} />
      {owner ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Button
            label={spend?.count ? 'Review spending' : 'Open property care'}
            size="sm"
            onPress={go(ROUTES.managedArea)}
          />
          <Button
            label="Your agreements"
            size="sm"
            variant="outline"
            onPress={go(ROUTES.agreements)}
          />
        </View>
      ) : null}
    </Card>
  );
}

/** Compact profile: who, where and what they are after; everything else behind a toggle. */
function ProfileSummary({
  summary,
  risk,
}: {
  summary: NonNullable<InvestorOverview['profile']>;
  risk: InvestorOverview['riskDeclaration'];
}) {
  const { colors, spacing, radius } = useTheme();
  const { profile: account } = useAuth();
  const [open, setOpen] = useState(false);
  // The overview carries only the zone and country; the rest comes from the profile itself.
  const full = useQuery({ queryKey: qk.investor.profile, queryFn: investorApi.profile });
  const profile: Partial<InvestorProfile> = { ...summary, ...(full.data ?? {}) };
  const livesIn = countryName(profile.countryOfResidence) ?? profile.countryOfResidence;
  const name = account?.legalName?.trim();

  const glance: Fact[] = [
    { label: 'Budget', value: profile.budgetBand ? BUDGET_BAND_LABELS[profile.budgetBand] : null },
    { label: 'Horizon', value: profile.horizon ? HORIZON_LABELS[profile.horizon] : null },
    { label: 'Looking for', value: listLabels(profile.intendedUses, INTENDED_USE_LABELS) },
  ];
  const details: Fact[] = [
    { label: 'Nationality', value: countryName(profile.nationality) ?? profile.nationality },
    { label: 'Time zone', value: profile.timeZone },
    {
      label: 'Show amounts in',
      value: profile.displayCurrency ? CURRENCY_LABELS[profile.displayCurrency] : null,
    },
    {
      label: 'Ownership',
      value: profile.ownershipStructure ? OWNERSHIP_LABELS[profile.ownershipStructure] : null,
    },
    { label: 'Property types', value: listLabels(profile.propertyTypes, PROPERTY_TYPE_LABELS) },
    ...(risk
      ? [
          {
            label: 'Risk statement',
            value:
              risk.accepted && risk.acceptedAt
                ? `Accepted ${formatDate(risk.acceptedAt)}`
                : 'Not accepted yet',
            hint: risk.version ? `Version ${risk.version}` : undefined,
          },
        ]
      : []),
  ];

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.lg,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="callout" style={{ color: colors.primaryForeground, fontWeight: '600' }}>
            {getInitials(name || 'Investor')}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="subheading" numberOfLines={1} accessibilityRole="header">
            {name || 'Your profile'}
          </Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {livesIn ? `Lives in ${livesIn}` : 'Investor'}
          </Text>
        </View>
      </View>
      <FactList facts={glance} />
      <LinkButton
        label={open ? 'Hide profile details' : 'All profile details'}
        onPress={() => setOpen((v) => !v)}
      />
      {open ? <FactList facts={details} /> : null}
      <Divider />
      <Button
        label="Edit profile"
        size="sm"
        variant="outline"
        icon={<Settings2 size={16} color={colors.foreground} />}
        onPress={go(ROUTES.onboarding)}
        style={{ alignSelf: 'flex-start' }}
      />
    </Card>
  );
}

/** Passport, address abroad and bank statement, with how far along they are and what is next. */
function IdentityChecks({ status }: { status: ForeignIdentityStatus }) {
  const { colors, spacing } = useTheme();
  const { steps, approved, next } = identityProgress(status);

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="subheading" accessibilityRole="header">
          Identity checks
        </Text>
        <Text variant="caption" color="mutedForeground">
          Your passport, address and bank account abroad, checked so sellers and lawyers know who is
          buying.
        </Text>
      </View>
      <StepProgress label="Checks approved" done={approved} total={steps.length} />
      <FactList
        facts={steps.map((step) => {
          const badge = FOREIGN_CHECK_STATUS[step.state];
          return { label: step.label, value: <Badge label={badge.label} tone={badge.tone} /> };
        })}
      />
      <Button
        label={next ? `Next: ${next.label.replace(/ \(tier 3\)$/, '')}` : 'View your checks'}
        size="sm"
        variant={next ? 'primary' : 'outline'}
        icon={<ShieldCheck size={16} color={next ? colors.primaryForeground : colors.foreground} />}
        onPress={go(ROUTES.identity)}
        style={{ alignSelf: 'flex-start' }}
      />
    </Card>
  );
}
