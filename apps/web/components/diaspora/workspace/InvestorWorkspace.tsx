'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  Clock,
  Globe,
  Handshake,
  KeyRound,
  Landmark,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
  Video,
  Wallet,
  type SgIcon,
} from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardSkeleton,
  CardTitle,
  DescriptionList,
  EmptyState,
  PageHeader,
  QueryState,
  StatGroup,
  StatGroupSkeleton,
  type DescriptionItem,
  type StatGroupItem,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { BACKEND_ROLE_TO_ID, ROUTES } from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';
import { DIASPORA_ROUTES, type InvestorPortal } from '@/lib/constants/diasporaRoutes';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { VISIT_ROUTES } from '@/lib/constants/visitRoutes';
import { formatCurrency, formatDualTime, formatLagosDate, timeZoneCity } from '@/lib/format';
import {
  buildAttentionQueue,
  countryName,
  greetingFor,
  humaniseStatus,
  identityHeadline,
  type InvestorAttentionKind,
  portfolioFigures,
  portfolioValuationSubtitle,
  portfolioValuationView,
  STATEMENT_PAYOUT_LABELS,
  valuationSentence,
} from '@sureground/shared';
import { buyerKeys, investorKeys } from '@/lib/queryKeys';
import { purchaseDisputeHref, purchaseWorkspaceHref } from '@/lib/transactionWorkspace';
import { buyerService } from '@/services/buyerService';
import { investorService } from '@/services/investorService';
import { siteTourKeys, siteTourService } from '@/services/siteTourService';
import {
  FOREIGN_IDENTITY_TAB_ID,
  useForeignIdentityStatus,
} from '@/components/diaspora/ForeignIdentityPanel';
import { AttentionList, type AttentionListItem } from '@/components/shared/attention/AttentionList';
import { IndicativeAmount } from '@/components/shared/money/IndicativeAmount';
import { PurchaseSummaryList } from '@/components/shared/purchases/PurchaseSummaryList';
import type { InvestorOverview } from '@/types/investor';
import { IdentityProgressCard, ProfileSummaryCard, dualMoment } from './InvestorWorkspaceRail';

const lagosDay = (iso: string) => formatLagosDate(iso, 'short');

/** Re-reads the clock every 30 seconds, so the times stay current while the page is open. */
const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
};

/** Enough rows to total the deposits held; a longer history shows the count only. */
const LIST_PAGE = 50;

/**
 * Purchases live in the buyer portal and managed property in the owner portal. Link across only
 * when the viewer holds that role, since the other portal turns everyone else away.
 */
const usePortalLinks = (portal: InvestorPortal) => {
  const user = useMemo(() => getStoredUser<{ roles?: string[]; fullName?: string }>(), []);
  const roles = useMemo(
    () => new Set((user?.roles ?? []).map((role) => BACKEND_ROLE_TO_ID[role])),
    [user]
  );
  const buyer = portal === 'buyer' || roles.has('buyer');
  const owner = portal === 'owner' || roles.has('owner');
  return {
    fullName: user?.fullName?.trim() || undefined,
    discover: buyer ? ROUTES.BUYER_DISCOVER : undefined,
    offers: buyer ? ROUTES.BUYER_OFFERS : undefined,
    transactions: buyer ? ROUTES.BUYER_TRANSACTIONS : undefined,
    landPurchases: buyer ? LAND_BUYER_ROUTES.HUB : undefined,
    tours: buyer ? VISIT_ROUTES.BUYER_TOURS : undefined,
    inspections: buyer ? VISIT_ROUTES.BUYER_INSPECTIONS : undefined,
    // The owner's own agreements with Sureground Managed (OWNER_MANAGED is the reverse).
    managed: owner ? ROUTES.OWNER_MANAGEMENT : undefined,
    // Agreement, approvals, repairs and the latest statement on one page.
    managedArea: owner ? DIASPORA_ROUTES.OWNER_MANAGED : undefined,
    approvals: owner ? ROUTES.OWNER_APPROVALS : undefined,
    documents: portal === 'buyer' ? ROUTES.BUYER_DOCUMENTS : ROUTES.OWNER_DOCUMENTS,
    identityAbroad: `${portal === 'buyer' ? ROUTES.BUYER_TRUST_PROFILE : ROUTES.OWNER_TRUST_PROFILE}?tab=${FOREIGN_IDENTITY_TAB_ID}`,
    messages: portal === 'buyer' ? ROUTES.BUYER_MESSAGES : ROUTES.OWNER_MESSAGES,
  };
};

type PortalLinks = ReturnType<typeof usePortalLinks>;

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

/** Shaped like the loaded page: queue, figures and purchases on the left, the rail on the right. */
const WorkspaceSkeleton = () => (
  <div className="grid gap-6 lg:grid-cols-12">
    <div className="min-w-0 space-y-6 lg:col-span-8">
      <CardSkeleton lines={3} />
      <StatGroupSkeleton groups={[4]} />
      <CardSkeleton lines={6} />
    </div>
    <div className="min-w-0 space-y-6 lg:col-span-4">
      <CardSkeleton lines={4} />
      <CardSkeleton lines={3} />
      <CardSkeleton lines={3} />
    </div>
  </div>
);

/** Managed property: agreements, spending waiting for approval and the latest statement. */
const PropertyCareCard = ({ data, links }: { data: InvestorOverview; links: PortalLinks }) => {
  const managed = data.activeManagedProperties ?? 0;
  const spend = data.pendingSpendApprovals;
  const statement = data.latestStatement ?? null;

  if (managed === 0 && !statement && !spend?.count) {
    return (
      <EmptyState
        icon={KeyRound}
        title="Let Sureground look after your property"
        description="With Sureground Managed we find tenants, collect rent, arrange repairs and send you a monthly statement. Spending above your limit waits for your approval."
        action={
          <Button href={links.managed ?? DIASPORA_ROUTES.PUBLIC}>
            {links.managed ? 'Set up Sureground Managed' : 'How Sureground Managed works'}
          </Button>
        }
      />
    );
  }

  const spendAmount = Number(spend?.totalAmount);
  const net = statement ? Number(statement.netAmount) : NaN;
  const rows: DescriptionItem[] = [
    { label: 'Active agreements', value: managed },
    {
      label: 'Spending awaiting your approval',
      value: spend?.count
        ? Number.isFinite(spendAmount)
          ? `${spend.count}, ${formatCurrency(spendAmount)} in total`
          : spend.count
        : 'None',
    },
    {
      label: 'Latest statement',
      value: statement
        ? Number.isFinite(net)
          ? `${formatCurrency(net)} net to you`
          : 'Issued'
        : 'None yet',
      hint: statement
        ? `${lagosDay(statement.periodStart)} to ${lagosDay(statement.periodEnd)} · ${
            STATEMENT_PAYOUT_LABELS[statement.payoutStatus] ??
            humaniseStatus(statement.payoutStatus)
          }`
        : undefined,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Property care</CardTitle>
        <CardDescription>Your homes under Sureground Managed.</CardDescription>
      </CardHeader>
      <div className="px-5 pb-2">
        <DescriptionList layout="rows" items={rows} />
      </div>
      {(links.managed || links.managedArea || (links.approvals && spend?.count)) && (
        <CardFooter className="justify-start">
          {links.managedArea ? (
            <Button href={links.managedArea}>
              {spend?.count ? 'Review spending' : 'Open property care'}
            </Button>
          ) : links.approvals && spend?.count ? (
            <Button href={links.approvals}>Review spending</Button>
          ) : null}
          {links.managed && (
            <Button href={links.managed} variant="outline">
              Your agreements
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export const InvestorWorkspace = ({ portal }: { portal: InvestorPortal }) => {
  const now = useNow();
  const links = usePortalLinks(portal);
  const identity = useForeignIdentityStatus();
  const overview = useQuery({
    queryKey: investorKeys.overview,
    queryFn: () => unwrap(investorService.getOverview()),
  });
  // Tours feed the attention queue (times offered).
  const tours = useQuery({
    queryKey: siteTourKeys.buyer('all'),
    queryFn: () => unwrap(siteTourService.mine('all')),
    enabled: Boolean(links.tours),
    retry: false,
  });
  // Deposit amounts: the overview counts purchases but does not total what is held.
  const transactions = useQuery({
    queryKey: [...buyerKeys.transactions, { investor: true, pageSize: LIST_PAGE }],
    queryFn: () => unwrap(buyerService.listTransactions({ page: 1, pageSize: LIST_PAGE })),
    enabled: Boolean(links.transactions),
    retry: false,
  });
  const data = overview.data;
  const profile = data?.profile ?? null;
  // Complete profile; the risk statement may still be owed, which the queue asks for.
  const profileComplete = Boolean(profile) && (profile?.missingFields ?? []).length === 0;
  const risk = data?.riskDeclaration ?? null;
  const timeZone = profile?.timeZone ?? null;
  const currency = profile?.displayCurrency ?? 'NGN';
  const firstName = links.fullName?.split(/\s+/)[0];

  const txList = transactions.data;
  const attention: AttentionListItem[] = buildAttentionQueue({
    riskAccepted: risk ? risk.accepted : undefined,
    purchases: data?.purchases,
    depositsDue: txList?.items
      .filter((t) => t.escrowStatus === 'deposit_pending')
      .map((t) => ({ id: t.id, propertyTitle: t.propertyTitle, depositAmount: t.depositAmount })),
    tours: tours.data,
    spendApprovals: data?.pendingSpendApprovals,
    identity: identity.data,
    links: {
      purchase: purchaseWorkspaceHref,
      risk: `${DIASPORA_ROUTES.onboarding(portal)}?step=risk`,
      tours: links.tours,
      approvals: links.approvals,
      identity: links.identityAbroad,
      dispute: purchaseDisputeHref,
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
      icon: Handshake,
      label: 'Active purchases',
      value: figures.activePurchases,
      subtitle: figures.representing
        ? `Plus ${figures.representing} you represent`
        : 'Homes and land in progress',
      href: links.transactions,
    });
  }
  if (figures.depositsHeldCount !== null) {
    const amount = figures.depositsHeldAmount;
    portfolio.push({
      icon: ShieldCheck,
      label: 'Deposits protected',
      value: amount !== null ? formatCurrency(amount) : figures.depositsHeldCount,
      subtitle:
        amount !== null
          ? `${figures.depositsHeldCount} under Payment Protection`
          : 'Under Payment Protection',
      supplement: amount ? (
        <IndicativeAmount naira={amount} currency={currency} labelDisplay="popover" />
      ) : undefined,
      href: links.transactions,
    });
  }
  if (figures.managedProperties !== null) {
    portfolio.push({
      icon: KeyRound,
      label: 'Properties managed',
      value: figures.managedProperties,
      subtitle: 'Under Sureground Managed',
      href: links.managed,
    });
  }
  // DIA-30: only figures with a record behind them.
  if (figures.acquisitionCost !== null) {
    portfolio.push({
      icon: Landmark,
      label: 'Acquisition cost',
      value: formatCurrency(figures.acquisitionCost),
      subtitle: 'Recorded prices of completed purchases',
    });
  }
  // DIA-30: only in-date reports by accredited valuers, always with the valuer and date.
  const valued = portfolioValuationView(data?.portfolio);
  if (valued && (valued.valuedCount > 0 || valued.notValuedCount > 0)) {
    portfolio.push({
      icon: BadgeCheck,
      label: 'Valued (accredited valuer)',
      value: valued.total !== null ? formatCurrency(valued.total) : 'Not valued',
      subtitle: portfolioValuationSubtitle(valued),
    });
  }
  if (figures.rentReceived12m !== null) {
    portfolio.push({
      icon: Banknote,
      label: 'Rent received',
      value: formatCurrency(figures.rentReceived12m),
      subtitle: 'Last 12 months, from your statements',
    });
  }
  if (figures.net12m !== null) {
    portfolio.push({
      icon: TrendingUp,
      label: 'Net to you',
      value: formatCurrency(figures.net12m),
      subtitle: 'Last 12 months, after costs and fees',
    });
  }
  if (figures.occupancyRate !== null) {
    portfolio.push({
      icon: Building2,
      label: 'Occupancy',
      value: `${figures.occupancyRate}%`,
      subtitle: 'Managed units with a running lease',
      href: links.managedArea,
    });
  }
  if (data && 'latestStatement' in data) {
    const statement = data.latestStatement;
    const net = figures.latestStatementNet;
    portfolio.push({
      icon: Wallet,
      label: 'Latest statement',
      value: net !== null ? formatCurrency(net) : 'None yet',
      subtitle: statement
        ? `Net to you, ${lagosDay(statement.periodStart)} to ${lagosDay(statement.periodEnd)}`
        : 'Monthly, once a property is managed',
      supplement: net ? (
        <IndicativeAmount naira={net} currency={currency} labelDisplay="popover" />
      ) : undefined,
      // The statement itself, with its breakdown, in property care.
      href:
        statement && links.managedArea ? DIASPORA_ROUTES.managedStatement(statement.id) : undefined,
    });
  }

  const livesIn = countryName(profile?.countryOfResidence) ?? profile?.countryOfResidence;
  const chip = identityHeadline(identity.data);
  const purchases = data?.purchases;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sureground Diaspora Invest"
        title={`${greetingFor(now, timeZone)}${firstName ? `, ${firstName}` : ''}`}
        description="Your purchases, property care and next steps in one place. Deadlines are Lagos dates; times show Lagos and yours."
        meta={
          <ul className="flex flex-wrap items-center gap-2" aria-label="At a glance">
            {(livesIn || timeZone) && (
              <li>
                <Badge icon={<Globe className="h-3.5 w-3.5" aria-hidden="true" />}>
                  {[livesIn, timeZone ? `${timeZoneCity(timeZone)} time` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Badge>
              </li>
            )}
            <li>
              <Badge icon={<Clock className="h-3.5 w-3.5" aria-hidden="true" />}>
                <time dateTime={now.toISOString()}>{formatDualTime(now, timeZone)}</time>
              </Badge>
            </li>
            {chip && (
              <li>
                <Badge variant={chip.tone} dot>
                  {chip.label}
                </Badge>
              </li>
            )}
          </ul>
        }
        actions={
          <>
            {links.tours && (
              <Button
                href={links.tours}
                variant="outline"
                icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
              >
                Book a video tour
              </Button>
            )}
            {links.discover && (
              <Button
                href={links.discover}
                icon={<Search className="h-4 w-4" aria-hidden="true" />}
              >
                Find a property
              </Button>
            )}
          </>
        }
      />

      <QueryState
        isLoading={overview.isLoading}
        isError={overview.isError}
        onRetry={() => overview.refetch()}
        isRetrying={overview.isFetching}
        loading={<WorkspaceSkeleton />}
        isEmpty={!profileComplete}
        empty={{
          icon: Globe,
          title: 'Set up your investor profile',
          description:
            'Tell us where you live, your time zone and what you are looking for, then read the risk statement. It takes a few minutes.',
          action: <Button href={DIASPORA_ROUTES.onboarding(portal)}>Get started</Button>,
        }}
      >
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 space-y-6 lg:col-span-8">
            <AttentionList
              items={attention}
              empty={{
                title: 'You’re all caught up',
                description:
                  'Nothing needs you right now. Deposits, approvals and tour times will appear here as they come up.',
              }}
            />

            {portfolio.length > 0 && (
              <StatGroup
                title="Portfolio"
                items={portfolio}
                maxColumns={3}
                footer={
                  <div className="space-y-2">
                    {valued && valued.valuations.length > 0 && (
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {valued.valuations.map((v) => (
                          <li key={v.id}>
                            <span className="font-medium text-foreground">{v.propertyTitle}</span>:{' '}
                            {valuationSentence(v)}
                            {v.outOfDate ? ' (out of date, not counted)' : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Payment Protection covers deposits only.
                    </p>
                  </div>
                }
              />
            )}

            {purchases ? (
              <Card>
                <CardHeader>
                  <CardTitle as="h2">Your purchases</CardTitle>
                </CardHeader>
                {purchases.length ? (
                  <div className="mt-4 border-t border-border">
                    <PurchaseSummaryList purchases={purchases} />
                  </div>
                ) : (
                  <EmptyState
                    icon={Building2}
                    title="No purchases yet"
                    description="When an offer is accepted, the purchase appears here with its progress, deposit and legal status."
                    action={
                      links.discover ? (
                        <Button href={links.discover} variant="outline">
                          Find a property
                        </Button>
                      ) : undefined
                    }
                    size="compact"
                    bare
                  />
                )}
                {purchases.length > 0 && links.transactions && (
                  <CardFooter className="justify-start">
                    <Button href={links.transactions} variant="link">
                      All purchases
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ) : null}

            {data && <PropertyCareCard data={data} links={links} />}
          </div>

          <aside
            className="min-w-0 space-y-6 lg:col-span-4"
            aria-label="Profile and identity checks"
          >
            {profile && (
              <ProfileSummaryCard
                summary={profile}
                risk={risk}
                portal={portal}
                fullName={links.fullName}
              />
            )}
            {identity.data?.eligible && (
              <IdentityProgressCard status={identity.data} href={links.identityAbroad} />
            )}
          </aside>
        </div>
      </QueryState>
    </div>
  );
};
