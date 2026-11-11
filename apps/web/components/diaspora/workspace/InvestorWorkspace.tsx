'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Globe, MessageCircle, Settings2, ShieldCheck } from '@sureground/icons';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DescriptionList,
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
import { countryName } from '@/lib/constants/countries';
import { DIASPORA_ROUTES, type InvestorPortal } from '@/lib/constants/diasporaRoutes';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { formatCurrency, formatDualTime, formatLagosDate } from '@/lib/format';
import { investorKeys } from '@/lib/queryKeys';
import { investorService } from '@/services/investorService';
import {
  FOREIGN_IDENTITY_TAB_ID,
  useForeignIdentityEligible,
} from '@/components/diaspora/ForeignIdentityPanel';
import type { InvestorOverview, InvestorProfile, InvestorStatusCounts } from '@/types/investor';
import {
  BUDGET_BAND_LABELS,
  HORIZON_LABELS,
  INTENDED_USE_LABELS,
  LAND_PURCHASE_STATUS_LABELS,
  OFFER_STATUS_LABELS,
  OWNERSHIP_LABELS,
  PROTECTED_PAYMENT_STATUS_LABELS,
  STATEMENT_PAYOUT_LABELS,
  PROPERTY_TYPE_LABELS,
  humaniseStatus,
  listLabels,
} from '../labels';

/** "Held by Sureground: 2 · Released: 1": the non-zero statuses, largest first. */
const breakdown = (counts: InvestorStatusCounts, labels: Record<string, string>) =>
  Object.entries(counts.byStatus ?? {})
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([status, n]) => `${labels[status] ?? humaniseStatus(status)}: ${n}`)
    .join(' · ') || undefined;

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

/**
 * Purchases live in the buyer portal and managed property in the owner portal. Link across only
 * when the viewer holds that role, since the other portal turns everyone else away.
 */
const usePortalLinks = (portal: InvestorPortal) => {
  const roles = useMemo(() => {
    const stored = getStoredUser<{ roles?: string[] }>()?.roles ?? [];
    return new Set(stored.map((role) => BACKEND_ROLE_TO_ID[role]));
  }, []);
  const buyer = portal === 'buyer' || roles.has('buyer');
  const owner = portal === 'owner' || roles.has('owner');
  return {
    offers: buyer ? ROUTES.BUYER_OFFERS : undefined,
    transactions: buyer ? ROUTES.BUYER_TRANSACTIONS : undefined,
    landPurchases: buyer ? LAND_BUYER_ROUTES.HUB : undefined,
    managed: owner ? ROUTES.OWNER_MANAGED : undefined,
    approvals: owner ? ROUTES.OWNER_APPROVALS : undefined,
    documents: portal === 'buyer' ? ROUTES.BUYER_DOCUMENTS : ROUTES.OWNER_DOCUMENTS,
    identityAbroad: `${portal === 'buyer' ? ROUTES.BUYER_TRUST_PROFILE : ROUTES.OWNER_TRUST_PROFILE}?tab=${FOREIGN_IDENTITY_TAB_ID}`,
    messages: portal === 'buyer' ? ROUTES.BUYER_MESSAGES : ROUTES.OWNER_MESSAGES,
  };
};

const ProfileCard = ({
  summary,
  risk,
  portal,
}: {
  summary: NonNullable<InvestorOverview['profile']>;
  risk: InvestorOverview['riskDeclaration'];
  portal: InvestorPortal;
}) => {
  const now = useNow();
  // The overview carries only the zone and country; the rest of the profile comes from its own call.
  const full = useQuery({
    queryKey: investorKeys.profile,
    queryFn: () => investorService.getProfile(),
  });
  const profile: Partial<InvestorProfile> = { ...summary, ...(full.data ?? {}) };
  const items: DescriptionItem[] = [
    {
      label: 'Time now',
      value: formatDualTime(now, profile.timeZone),
      hint: 'Payment and contract deadlines are Lagos dates.',
      wide: true,
    },
    {
      label: 'Lives in',
      value: countryName(profile.countryOfResidence) ?? profile.countryOfResidence,
    },
    { label: 'Nationality', value: countryName(profile.nationality) ?? profile.nationality },
    { label: 'Time zone', value: profile.timeZone },
    {
      label: 'Ownership',
      value: profile.ownershipStructure ? OWNERSHIP_LABELS[profile.ownershipStructure] : null,
    },
    { label: 'Looking for', value: listLabels(profile.intendedUses, INTENDED_USE_LABELS) },
    { label: 'Property types', value: listLabels(profile.propertyTypes, PROPERTY_TYPE_LABELS) },
    {
      label: 'Budget',
      value: profile.budgetBand ? BUDGET_BAND_LABELS[profile.budgetBand] : null,
    },
    { label: 'Horizon', value: profile.horizon ? HORIZON_LABELS[profile.horizon] : null },
  ];
  if (risk) {
    items.push({
      label: 'Risk statement',
      value:
        risk.accepted && risk.acceptedAt
          ? `Accepted ${formatLagosDate(risk.acceptedAt, 'long')}`
          : 'Not accepted yet',
      hint: risk.version ? `Version ${risk.version}` : undefined,
      wide: true,
    });
  }
  return (
    <Card>
      <CardHeader
        action={
          <Button
            href={DIASPORA_ROUTES.onboarding(portal)}
            variant="secondary"
            size="sm"
            icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}
          >
            Edit profile
          </Button>
        }
      >
        <CardTitle as="h2">Your profile</CardTitle>
        <CardDescription>Used to tailor your workspace and the checks you need.</CardDescription>
      </CardHeader>
      <CardContent>
        <DescriptionList items={items} columns={2} />
      </CardContent>
    </Card>
  );
};

export const InvestorWorkspace = ({ portal }: { portal: InvestorPortal }) => {
  const links = usePortalLinks(portal);
  const identityAbroad = useForeignIdentityEligible();
  const overview = useQuery({
    queryKey: investorKeys.overview,
    queryFn: () => unwrap(investorService.getOverview()),
  });
  const data = overview.data;
  const profile = data?.profile ?? null;
  // Complete profile; the risk statement may still be owed, which the alert below asks for.
  const profileComplete = Boolean(profile) && (profile?.missingFields ?? []).length === 0;
  const risk = data?.riskDeclaration ?? null;

  const purchases: StatGroupItem[] = [];
  if (data?.offers) {
    purchases.push({
      label: 'Offers',
      value: data.offers.total,
      subtitle: breakdown(data.offers, OFFER_STATUS_LABELS),
      href: links.offers,
    });
  }
  if (data?.protectedPurchases) {
    purchases.push({
      label: 'Protected purchases',
      value: data.protectedPurchases.total,
      subtitle: breakdown(data.protectedPurchases, PROTECTED_PAYMENT_STATUS_LABELS),
      href: links.transactions,
    });
  }
  if (data?.landPurchases) {
    purchases.push({
      label: 'Land purchases',
      value: data.landPurchases.total,
      subtitle: breakdown(data.landPurchases, LAND_PURCHASE_STATUS_LABELS),
      href: links.landPurchases,
    });
  }

  const care: StatGroupItem[] = [];
  if (typeof data?.activeManagedProperties === 'number') {
    care.push({
      label: 'Sureground Managed',
      value: data.activeManagedProperties,
      subtitle: 'Properties under an active agreement',
      href: links.managed,
    });
  }
  if (data?.pendingSpendApprovals) {
    const { count, totalAmount } = data.pendingSpendApprovals;
    const amount = Number(totalAmount);
    care.push({
      label: 'Awaiting your approval',
      value: count,
      subtitle:
        count > 0 && Number.isFinite(amount)
          ? `${formatCurrency(amount)} of spending`
          : 'Spending above your limit',
      href: links.approvals,
      attention: count > 0,
    });
  }
  if (data && 'latestStatement' in data) {
    const statement = data.latestStatement;
    const net = statement ? Number(statement.netAmount) : NaN;
    care.push({
      label: 'Latest statement',
      value: statement && Number.isFinite(net) ? formatCurrency(net) : 'None yet',
      subtitle: statement
        ? [
            `Net to you, ${lagosDay(statement.periodStart)} to ${lagosDay(statement.periodEnd)}`,
            STATEMENT_PAYOUT_LABELS[statement.payoutStatus] ??
              humaniseStatus(statement.payoutStatus),
          ].join(' · ')
        : undefined,
      href: statement ? links.managed : undefined,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sureground Diaspora Invest"
        title="Your investor workspace"
        description="Your purchases and managed property in one place, with your own time shown next to Lagos time."
      />

      <QueryState
        isLoading={overview.isLoading}
        isError={overview.isError}
        onRetry={() => overview.refetch()}
        isRetrying={overview.isFetching}
        loading={<StatGroupSkeleton groups={[3, 3]} />}
        isEmpty={!profileComplete}
        empty={{
          icon: Globe,
          title: 'Set up your investor profile',
          description:
            'Tell us where you live, your time zone and what you are looking for, then read the risk statement. It takes a few minutes.',
          action: <Button href={DIASPORA_ROUTES.onboarding(portal)}>Get started</Button>,
        }}
      >
        <div className="space-y-6">
          {risk && !risk.accepted && (
            <Alert
              variant="warning"
              title="Accept the risk statement before your first offer or purchase"
              action={
                <Button href={`${DIASPORA_ROUTES.onboarding(portal)}?step=risk`} size="sm">
                  Read the statement
                </Button>
              }
            >
              It sets out what Sureground checks, what it cannot promise and the risks of buying
              property from abroad.
            </Alert>
          )}

          {profile && <ProfileCard summary={profile} risk={risk} portal={portal} />}

          {purchases.length > 0 && <StatGroup title="Purchases" items={purchases} />}
          {care.length > 0 && <StatGroup title="Property care" items={care} />}

          <Card>
            <CardHeader>
              <CardTitle as="h2">Documents and messages</CardTitle>
              <CardDescription>
                Contracts, receipts and reports for your purchases, and your conversations with
                sellers, managers and Sureground.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                href={links.documents}
                variant="secondary"
                icon={<FolderOpen className="h-4 w-4" aria-hidden="true" />}
              >
                Documents
              </Button>
              <Button
                href={links.messages}
                variant="secondary"
                icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
              >
                Messages
              </Button>
              {identityAbroad && (
                <Button
                  href={links.identityAbroad}
                  variant="secondary"
                  icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                >
                  Passport and address abroad
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </QueryState>
    </div>
  );
};
