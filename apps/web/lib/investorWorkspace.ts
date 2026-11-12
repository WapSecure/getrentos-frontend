import type { AttentionItem } from '@/types/attention';
import type { ForeignDocumentStatus, ForeignIdentityStatus } from '@/types/foreignIdentity';
import type { InvestorOverview, InvestorStatusCounts } from '@/types/investor';
import type { PurchaseSummary } from '@/types/transactionWorkspace';
import { formatCurrency } from './format';
import { purchaseWorkspaceHref } from './transactionWorkspace';

// Pure helpers for the investor workspace (Diaspora Invest, DIA-30/31). Everything here is built
// from figures the API already returns: nothing is estimated, and Sureground holds only deposits (D11).

export type InvestorAttentionKind =
  | 'risk'
  | 'deposit'
  | 'approval'
  | 'purchase'
  | 'tour'
  | 'spending'
  | 'identity';

export interface InvestorAttentionItem extends AttentionItem {
  kind: InvestorAttentionKind;
  /** ISO date-time the item is due or expected by, shown as Lagos time beside the investor's own. */
  dueAt?: string;
  /** What `dueAt` means, e.g. "Earliest time offered". */
  dueLabel?: string;
}

/** A sale whose deposit the buyer has not paid yet (`GET buyer/transactions`, `deposit_pending`). */
export interface DepositDue {
  id: string;
  propertyTitle: string;
  depositAmount?: number;
}

/** A video tour, as far as the queue and the agenda need it. */
export interface TourLike {
  id: string;
  status: string;
  land: string;
  proposedSlots?: { at: string }[];
  scheduledAt?: string;
}

/** A pre-purchase inspection, as far as the agenda needs it. */
export interface InspectionLike {
  id: string;
  status: string;
  land: string;
  dueBy: string | null;
}

export interface AttentionLinks {
  risk: string;
  tours?: string;
  approvals?: string;
  identity: string;
}

export interface AttentionInput {
  riskAccepted?: boolean;
  purchases?: PurchaseSummary[];
  depositsDue?: DepositDue[];
  tours?: TourLike[];
  spendApprovals?: InvestorOverview['pendingSpendApprovals'];
  identity?: ForeignIdentityStatus | null;
  links: AttentionLinks;
}

const SEVERITY_ORDER: Record<AttentionItem['severity'], number> = { urgent: 0, soon: 1, info: 2 };

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

const earliest = (dates: string[]): string | undefined =>
  dates
    .filter((d) => !Number.isNaN(new Date(d).getTime()))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

const IDENTITY_CHECKS: { key: 'passport' | 'address' | 'bankStatement'; what: string }[] = [
  { key: 'passport', what: 'passport and live photo' },
  { key: 'address', what: 'proof of address abroad' },
  { key: 'bankStatement', what: 'bank statement from abroad' },
];

const identityItems = (identity: ForeignIdentityStatus, href: string): InvestorAttentionItem[] => {
  const items: InvestorAttentionItem[] = [];
  for (const { key, what } of IDENTITY_CHECKS) {
    const status: ForeignDocumentStatus = identity[key];
    if (status.state === 'REJECTED') {
      items.push({
        key: `identity-${key}`,
        kind: 'identity',
        severity: 'urgent',
        title: `Send your ${what} again`,
        detail: 'Our team could not approve the last one. The reason is on the check.',
        link: { path: href, label: 'See why' },
      });
    } else if (status.state === 'IN_REVIEW') {
      items.push({
        key: `identity-${key}`,
        kind: 'identity',
        severity: 'info',
        title: `Your ${what} is with our team`,
        detail: 'Nothing to do now. We will tell you when it is reviewed.',
        dueAt: status.reviewDueAt ?? undefined,
        dueLabel: 'Reply by',
        link: { path: href, label: 'View' },
      });
    }
  }
  // Only the passport is asked for up front; address and bank statement follow when needed.
  if (identity.passport.state === 'NOT_STARTED') {
    items.push({
      key: 'identity-passport-start',
      kind: 'identity',
      severity: 'soon',
      title: 'Verify your passport',
      detail: 'A passport and a live photo confirm who you are before you buy.',
      link: { path: href, label: 'Start' },
    });
  }
  return items;
};

/**
 * "What needs me now": one row per thing waiting for the investor, most pressing first. A purchase
 * appears once, preferring the deposit row because it carries the amount.
 */
export const buildAttentionQueue = (input: AttentionInput): InvestorAttentionItem[] => {
  const items: InvestorAttentionItem[] = [];
  const { links } = input;

  if (input.riskAccepted === false) {
    items.push({
      key: 'risk',
      kind: 'risk',
      severity: 'urgent',
      title: 'Accept the risk statement',
      detail: 'Needed before your first offer or purchase.',
      link: { path: links.risk, label: 'Read the statement' },
    });
  }

  const seen = new Set<string>();
  for (const deposit of input.depositsDue ?? []) {
    seen.add(deposit.id);
    items.push({
      key: `deposit-${deposit.id}`,
      kind: 'deposit',
      severity: 'urgent',
      title: `Pay the deposit for ${deposit.propertyTitle}`,
      detail:
        typeof deposit.depositAmount === 'number'
          ? `${formatCurrency(deposit.depositAmount)}, protected by Payment Protection until you release it`
          : 'Protected by Payment Protection until you release it',
      link: {
        path: purchaseWorkspaceHref({ role: 'BUYER', transactionId: deposit.id }),
        label: 'Pay deposit',
      },
    });
  }

  for (const purchase of input.purchases ?? []) {
    if (seen.has(purchase.transactionId)) continue;
    const forWhom =
      purchase.role === 'REPRESENTATIVE' && purchase.representing
        ? ` for ${purchase.representing.principalName}`
        : '';
    const path = purchaseWorkspaceHref(purchase);
    if (purchase.pendingApprovals > 0) {
      items.push({
        key: `approval-${purchase.role}-${purchase.transactionId}`,
        kind: 'approval',
        severity: 'soon',
        title: `${plural(purchase.pendingApprovals, 'approval')} waiting for you`,
        detail: `${purchase.title}${forWhom}`,
        link: { path, label: 'Review' },
      });
    } else if (purchase.waitingForYou) {
      items.push({
        key: `purchase-${purchase.role}-${purchase.transactionId}`,
        kind: 'purchase',
        severity: 'soon',
        title: purchase.nextAction ?? 'Your purchase needs you',
        detail: `${purchase.title}${forWhom}`,
        link: { path, label: 'Open' },
      });
    }
  }

  if (links.tours) {
    for (const tour of input.tours ?? []) {
      if (tour.status !== 'PROPOSED') continue;
      items.push({
        key: `tour-${tour.id}`,
        kind: 'tour',
        severity: 'soon',
        title: 'Choose a time for your video tour',
        detail: tour.land,
        dueAt: earliest((tour.proposedSlots ?? []).map((s) => s.at)),
        dueLabel: 'Earliest time offered',
        link: { path: links.tours, label: 'Choose a time' },
      });
    }
  }

  const spend = input.spendApprovals;
  if (links.approvals && spend && spend.count > 0) {
    const amount = Number(spend.totalAmount);
    items.push({
      key: 'spending',
      kind: 'spending',
      severity: 'soon',
      title: `Approve spending on your managed property`,
      detail: Number.isFinite(amount)
        ? `${plural(spend.count, 'request')}, ${formatCurrency(amount)} in total`
        : plural(spend.count, 'request'),
      link: { path: links.approvals, label: 'Review' },
    });
  }

  if (input.identity?.eligible) items.push(...identityItems(input.identity, links.identity));

  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const bySeverity = SEVERITY_ORDER[a.item.severity] - SEVERITY_ORDER[b.item.severity];
      if (bySeverity) return bySeverity;
      const aDue = a.item.dueAt ? new Date(a.item.dueAt).getTime() : Infinity;
      const bDue = b.item.dueAt ? new Date(b.item.dueAt).getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return a.index - b.index;
    })
    .map(({ item }) => item);
};

/** The usual path of a purchase; paused and cancelled sit outside it. */
const STAGE_PATH = [
  'INTERESTED',
  'OFFER_ACCEPTED',
  'RESERVED',
  'DILIGENCE_IN_PROGRESS',
  'FINDINGS_SHARED',
  'CONTRACT_PREPARED',
  'COMPLETING',
  'HANDED_OVER',
] as const;

/** Where a purchase is on its usual path ("3 of 8"), or null when paused, cancelled or unknown. */
export const stageProgress = (code: string): { step: number; total: number } | null => {
  const index = (STAGE_PATH as readonly string[]).indexOf(code);
  return index < 0 ? null : { step: index + 1, total: STAGE_PATH.length };
};

const CLOSED_STAGES = new Set(['HANDED_OVER', 'CANCELLED']);
// Sale statuses (EscrowStatus) that are over, and land purchase statuses that are over.
const CLOSED_SALE = new Set(['RELEASED', 'REFUNDED']);
const CLOSED_LAND = new Set(['COMPLETED', 'CANCELLED', 'REVOKED', 'DEFAULTED']);
/** Payment Protection still holds the deposit in these sale statuses. */
const HELD_SALE = [
  'FUNDS_HELD',
  'VERIFICATION_PENDING',
  'SETTLEMENT_PENDING',
  'FROZEN',
  'DISPUTED',
];

const openCount = (counts: InvestorStatusCounts | undefined, closed: Set<string>) =>
  Object.entries(counts?.byStatus ?? {}).reduce(
    (sum, [status, n]) => (closed.has(status) ? sum : sum + n),
    0
  );

export interface PortfolioFigures {
  /** My own purchases still in progress (sales and land). */
  activePurchases: number | null;
  /** Purchases I follow as someone's representative. */
  representing: number;
  /** Sales whose deposit Payment Protection still holds. */
  depositsHeldCount: number | null;
  /** Their total in whole naira, only when every held deposit's amount is known. */
  depositsHeldAmount: number | null;
  managedProperties: number | null;
  /** Net to the owner on the latest issued statement, whole naira. */
  latestStatementNet: number | null;
  /** Recorded prices of completed purchases, whole naira. Never a valuation. */
  acquisitionCost: number | null;
  /** Statement income over the last 12 months, whole naira. */
  rentReceived12m: number | null;
  /** Net paid on those statements, whole naira. */
  net12m: number | null;
  /** Occupied out of managed units, percent. */
  occupancyRate: number | null;
}

/** A whole-naira string from the API as a number; null when absent or unreadable. */
const nairaOrNull = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Buyer transactions as listed by `GET buyer/transactions` (lower-case statuses). */
export interface HeldDepositSource {
  escrowStatus: string;
  depositAmount?: number;
}

/**
 * The portfolio row. Counts come from the overview; the naira total only from the buyer's own
 * transaction list, and only when that list is complete and every held deposit has an amount.
 */
export const portfolioFigures = (
  overview: InvestorOverview | undefined,
  transactions?: { items: HeldDepositSource[]; complete: boolean }
): PortfolioFigures => {
  const purchases = overview?.purchases;
  const own = purchases?.filter((p) => p.role === 'BUYER');
  const ownActive = own?.filter((p) => !CLOSED_STAGES.has(p.operationalStage.code)).length;

  let activePurchases: number | null = null;
  if (overview?.protectedPurchases || overview?.landPurchases || own) {
    // `purchases` covers sales only; land purchases still come from their own counts.
    const sales = own ? (ownActive ?? 0) : openCount(overview?.protectedPurchases, CLOSED_SALE);
    activePurchases = sales + openCount(overview?.landPurchases, CLOSED_LAND);
  }

  const depositsHeldCount = overview?.protectedPurchases
    ? HELD_SALE.reduce((sum, s) => sum + (overview.protectedPurchases?.byStatus[s] ?? 0), 0)
    : null;

  let depositsHeldAmount: number | null = null;
  if (transactions?.complete) {
    const held = transactions.items.filter(
      (t) => t.escrowStatus === 'funds_held' || t.escrowStatus === 'frozen'
    );
    if (held.every((t) => typeof t.depositAmount === 'number')) {
      depositsHeldAmount = held.reduce((sum, t) => sum + (t.depositAmount ?? 0), 0);
    }
  }

  const net = overview?.latestStatement ? Number(overview.latestStatement.netAmount) : NaN;
  const portfolio = overview?.portfolio;

  return {
    activePurchases,
    representing: purchases?.filter((p) => p.role === 'REPRESENTATIVE').length ?? 0,
    depositsHeldCount,
    depositsHeldAmount,
    managedProperties:
      typeof overview?.activeManagedProperties === 'number'
        ? overview.activeManagedProperties
        : null,
    latestStatementNet: Number.isFinite(net) ? net : null,
    acquisitionCost: nairaOrNull(portfolio?.acquisitionCost),
    rentReceived12m: nairaOrNull(portfolio?.rentReceived12m),
    net12m: nairaOrNull(portfolio?.net12m),
    occupancyRate:
      typeof portfolio?.occupancyRate === 'number' && Number.isFinite(portfolio.occupancyRate)
        ? portfolio.occupancyRate
        : null,
  };
};

export interface IdentityStep {
  key: 'passport' | 'address' | 'bankStatement';
  label: string;
  state: ForeignDocumentStatus['state'];
}

/** The three checks abroad, how many are approved, and the first one still to do. */
export const identityProgress = (
  identity: ForeignIdentityStatus
): { steps: IdentityStep[]; approved: number; next: IdentityStep | null } => {
  const steps: IdentityStep[] = [
    { key: 'passport', label: 'Passport and live photo', state: identity.passport.state },
    { key: 'address', label: 'Address abroad', state: identity.address.state },
    { key: 'bankStatement', label: 'Bank statement (tier 3)', state: identity.bankStatement.state },
  ];
  return {
    steps,
    approved: steps.filter((s) => s.state === 'APPROVED').length,
    next: steps.find((s) => s.state === 'NOT_STARTED' || s.state === 'REJECTED') ?? null,
  };
};

/** "Good morning" in the investor's own zone; Lagos when the zone is unknown. */
export const greetingFor = (now: Date, timeZone?: string | null): string => {
  let hour = now.getUTCHours() + 1; // Lagos is UTC+1 all year.
  if (timeZone) {
    try {
      hour = Number(
        new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(
          now
        )
      );
    } catch {
      // Unknown zone: keep Lagos.
    }
  }
  hour %= 24;
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
