'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  FolderOpen,
  Globe,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Video,
  type SgIcon,
} from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DescriptionList,
  Disclosure,
  EmptyState,
  Progress,
  Timeline,
  type DescriptionItem,
  type TimelineItem,
  type TimelineState,
} from '@sureground/ui';
import { countryName } from '@/lib/constants/countries';
import { DIASPORA_ROUTES, type InvestorPortal } from '@/lib/constants/diasporaRoutes';
import { formatDualTime, formatLagosDate, getInitials } from '@/lib/format';
import { identityProgress, type AgendaEntry, type IdentityStep } from '@/lib/investorWorkspace';
import { investorKeys } from '@/lib/queryKeys';
import { foreignCheckBadges } from '@/lib/statusBadge';
import { investorService } from '@/services/investorService';
import type { ForeignIdentityStatus } from '@/types/foreignIdentity';
import type { InvestorOverview, InvestorProfile } from '@/types/investor';
import {
  BUDGET_BAND_LABELS,
  CURRENCY_LABELS,
  HORIZON_LABELS,
  INTENDED_USE_LABELS,
  OWNERSHIP_LABELS,
  PROPERTY_TYPE_LABELS,
  listLabels,
} from '../labels';

/** "12 Nov 2026 · 10:00 Lagos · 09:00 London": business dates stay Lagos (D2). */
export const dualMoment = (iso: string, timeZone?: string | null) =>
  `${formatLagosDate(iso)} · ${formatDualTime(iso, timeZone)}`;

/** Compact profile: who, where and what they are after; everything else behind a disclosure. */
export const ProfileSummaryCard = ({
  summary,
  risk,
  portal,
  fullName,
}: {
  summary: NonNullable<InvestorOverview['profile']>;
  risk: InvestorOverview['riskDeclaration'];
  portal: InvestorPortal;
  fullName?: string;
}) => {
  // The overview carries only the zone and country; the rest of the profile comes from its own call.
  const full = useQuery({
    queryKey: investorKeys.profile,
    queryFn: () => investorService.getProfile(),
  });
  const profile: Partial<InvestorProfile> = { ...summary, ...(full.data ?? {}) };
  const livesIn = countryName(profile.countryOfResidence) ?? profile.countryOfResidence;

  const glance: DescriptionItem[] = [
    { label: 'Budget', value: profile.budgetBand ? BUDGET_BAND_LABELS[profile.budgetBand] : null },
    { label: 'Horizon', value: profile.horizon ? HORIZON_LABELS[profile.horizon] : null },
    { label: 'Looking for', value: listLabels(profile.intendedUses, INTENDED_USE_LABELS) },
  ];
  const details: DescriptionItem[] = [
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
  ];
  if (risk) {
    details.push({
      label: 'Risk statement',
      value:
        risk.accepted && risk.acceptedAt
          ? `Accepted ${formatLagosDate(risk.acceptedAt, 'long')}`
          : 'Not accepted yet',
      hint: risk.version ? `Version ${risk.version}` : undefined,
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            {getInitials(fullName || 'Investor')}
          </span>
          <div className="min-w-0">
            <CardTitle as="h2" className="truncate">
              {fullName || 'Your profile'}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{livesIn ? `Lives in ${livesIn}` : 'Investor'}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 pt-3">
        <DescriptionList layout="rows" items={glance} />
      </CardContent>
      <Disclosure summary="All profile details" className="border-t border-border">
        <DescriptionList layout="rows" items={details} />
      </Disclosure>
      <CardFooter className="justify-start">
        <Button
          href={DIASPORA_ROUTES.onboarding(portal)}
          variant="outline"
          icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}
        >
          Edit profile
        </Button>
      </CardFooter>
    </Card>
  );
};

const STEP_STATE: Record<IdentityStep['state'], TimelineState> = {
  APPROVED: 'done',
  CHECKING: 'current',
  IN_REVIEW: 'current',
  REJECTED: 'blocked',
  NOT_STARTED: 'pending',
};

/** Passport, address abroad and bank statement, with how far along they are and what is next. */
export const IdentityProgressCard = ({
  status,
  href,
}: {
  status: ForeignIdentityStatus;
  href: string;
}) => {
  const { steps, approved, next } = identityProgress(status);
  // The timeline has one current step; a second check in progress shows as waiting.
  const firstCurrent = steps.findIndex((step) => STEP_STATE[step.state] === 'current');
  const items: TimelineItem[] = steps.map((step, index) => {
    const mapped = STEP_STATE[step.state];
    const state: TimelineState =
      mapped === 'current' && index !== firstCurrent ? 'pending' : mapped;
    const badge = foreignCheckBadges[step.state];
    return {
      id: step.key,
      title: step.label,
      state,
      badge: (
        <Badge variant={badge.variant} dot>
          {badge.label}
        </Badge>
      ),
    };
  });
  const done = approved === steps.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Identity checks</CardTitle>
        <CardDescription>
          Your passport, address and bank account abroad, checked so sellers and lawyers know who is
          buying.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress
          label="Checks approved"
          value={approved}
          max={steps.length}
          showValue="fraction"
          tone={done ? 'success' : 'primary'}
        />
        <Timeline items={items} aria-label="Identity checks" />
      </CardContent>
      <CardFooter className="justify-start">
        <Button
          href={href}
          variant={next ? 'primary' : 'outline'}
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
        >
          {next ? `Next: ${next.label.replace(/ \(tier 3\)$/, '')}` : 'View your checks'}
        </Button>
      </CardFooter>
    </Card>
  );
};

/** Booked tours and inspection reports still to come, each in Lagos time and the investor's own. */
export const AgendaCard = ({
  entries,
  timeZone,
  toursHref,
  inspectionsHref,
}: {
  entries: AgendaEntry[];
  timeZone?: string | null;
  toursHref?: string;
  inspectionsHref?: string;
}) => {
  const items: TimelineItem[] = entries.map((entry) => {
    const Icon = entry.kind === 'tour' ? Video : ClipboardCheck;
    const href = entry.kind === 'tour' ? toursHref : inspectionsHref;
    return {
      id: entry.key,
      state: 'pending',
      icon: <Icon className="h-3.5 w-3.5" aria-hidden="true" />,
      title: href ? (
        <Link href={href} className="hover:text-primary hover:underline">
          {entry.title}
        </Link>
      ) : (
        entry.title
      ),
      description: (
        <>
          <span className="block">{entry.place}</span>
          <time dateTime={entry.at} className="block tabular-nums">
            {dualMoment(entry.at, timeZone)}
          </time>
        </>
      ),
    };
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Coming up</CardTitle>
        <CardDescription>Video tours and inspection reports.</CardDescription>
      </CardHeader>
      {items.length ? (
        <CardContent>
          <Timeline
            items={items}
            variant="feed"
            aria-label="Coming up"
            stateLabels={{ pending: 'Upcoming' }}
          />
        </CardContent>
      ) : (
        <EmptyState
          icon={CalendarClock}
          title="Nothing booked"
          description="Tour a property by video from wherever you are, with a Sureground host on site."
          action={
            toursHref ? (
              <Button href={toursHref} variant="outline">
                Your video tours
              </Button>
            ) : undefined
          }
          size="compact"
          bare
        />
      )}
    </Card>
  );
};

export interface ShortcutRow {
  key: string;
  icon: SgIcon;
  label: string;
  hint?: string;
  href: string;
  /** Shown as a badge, e.g. unread messages. */
  count?: number;
}

/** Documents, messages and checks abroad as a compact list with counts. */
export const ShortcutsCard = ({ rows }: { rows: ShortcutRow[] }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle as="h2">Documents and messages</CardTitle>
    </CardHeader>
    <ul className="divide-y divide-border border-t border-border">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <li key={row.key}>
            <Link
              href={row.href}
              className="group flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{row.label}</span>
                {row.hint && (
                  <span className="block truncate text-xs text-muted-foreground">{row.hint}</span>
                )}
              </span>
              {typeof row.count === 'number' && row.count > 0 && (
                <Badge variant="primary">{row.count}</Badge>
              )}
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  </Card>
);

export const SHORTCUT_ICONS = { documents: FolderOpen, messages: MessageCircle, abroad: Globe };
