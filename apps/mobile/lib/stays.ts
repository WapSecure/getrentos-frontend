/**
 * The guest side of short stays: vocabulary and small rules shared by the
 * search, stay, booking and report screens. Free of UI imports so it can be
 * tested on its own.
 */
import { INTERNET_TYPES, POWER_SOURCES, WATER_SUPPLY } from './api/hostShortlets';
import type {
  GuestPromiseOutcome,
  GuestPromiseProblem,
  ShortletAvailability,
  ShortletBooking,
  ShortletDiscountType,
  ShortletListing,
} from './api/shortlets';
import type { DisputeCategory } from './api/hostShortlets';

/* ------------------------------ guest promise ----------------------------- */

export const GUEST_PROMISE_TEXT =
  "If the place isn't as described, you can't get in, or it's unsafe, tell us within 24 hours of check-in. We hold the host's payment while we check, and refund you if we uphold it.";

export const PAYMENT_PROTECTION_TEXT =
  'You pay GetRentos, not the host. We only pay the host after you check in.';

export const PROBLEM_OPTIONS: { value: GuestPromiseProblem; label: string; hint: string }[] = [
  {
    value: 'NOT_AS_DESCRIBED',
    label: 'Not as described',
    hint: 'It looks different from the photos or the listing.',
  },
  {
    value: 'NO_ACCESS',
    label: "Couldn't get in",
    hint: 'Wrong address, locked gate, or the host isn’t answering.',
  },
  {
    value: 'UNSAFE_OR_UNCLEAN',
    label: 'Unsafe or unclean',
    hint: 'Dirty, broken, or not safe to stay in.',
  },
  {
    value: 'MISSING_ESSENTIALS',
    label: 'Missing what was promised',
    hint: 'No power, water or internet the host said it has.',
  },
];

export const OUTCOME_LABEL: Record<GuestPromiseOutcome, string> = {
  FULL_REFUND: 'Upheld: full refund',
  PARTIAL_REFUND: 'Partly upheld: partial refund',
  NOT_UPHELD: 'Not upheld',
};

/** "27 Sept 2026, 11:00 pm" in Lagos time: report deadlines are to the hour. */
export const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });

export type PromiseState =
  | { kind: 'none' }
  | { kind: 'upcoming'; opensAt: string; closesAt: string }
  | { kind: 'open'; closesAt: string }
  | { kind: 'closed' }
  | { kind: 'reported'; status?: string }
  | { kind: 'decided'; outcome: GuestPromiseOutcome; refundAmount?: number };

/** Where a paid stay stands with the Guest Promise right now. */
export function promiseState(b: ShortletBooking, now = new Date()): PromiseState {
  const p = b.guestPromise;
  if (!p) return { kind: 'none' };
  if (p.outcome) return { kind: 'decided', outcome: p.outcome, refundAmount: p.refundAmount };
  if (p.reportId) return { kind: 'reported', status: p.reportStatus };
  // The promise covers paid stays that are going ahead; after a stay ends
  // without a report there is nothing left to say about it.
  if (b.status !== 'CONFIRMED' || b.paymentStatus !== 'PAID') return { kind: 'none' };
  if (p.canReport) return { kind: 'open', closesAt: p.closesAt };
  if (now < new Date(p.opensAt))
    return { kind: 'upcoming', opensAt: p.opensAt, closesAt: p.closesAt };
  return { kind: 'closed' };
}

/* -------------------------------- disputes -------------------------------- */

/** The guest's words for the dispute categories. */
export const GUEST_DISPUTE_CATEGORIES: { value: DisputeCategory; label: string; hint: string }[] = [
  {
    value: 'DAMAGE',
    label: 'Deposit or damage',
    hint: 'A claim on your deposit you disagree with.',
  },
  {
    value: 'PAYMENT',
    label: 'Payment or refund',
    hint: 'You were charged or refunded the wrong amount.',
  },
  {
    value: 'CANCELLATION',
    label: 'Cancellation',
    hint: 'Something went wrong with a cancellation.',
  },
  { value: 'SERVICE_QUALITY', label: 'The stay', hint: 'The host or the stay fell short.' },
  { value: 'OTHER', label: 'Something else', hint: 'Anything else support should look at.' },
];

/* --------------------------------- pricing -------------------------------- */

export const nightsLabel = (n: number) => `${n} ${n === 1 ? 'night' : 'nights'}`;
export const guestsLabel = (n: number) => `${n} ${n === 1 ? 'guest' : 'guests'}`;

const DISCOUNT_NAME: Record<ShortletDiscountType, string> = {
  WEEKLY: 'Weekly discount',
  TWO_WEEK: 'Two-week discount',
  MONTHLY: 'Monthly discount',
  LAST_MINUTE: 'Last-minute discount',
};

export const discountLabel = (type: ShortletDiscountType, pct?: number) =>
  pct ? `${DISCOUNT_NAME[type]} (${pct}%)` : DISCOUNT_NAME[type];

export interface PriceLine {
  label: string;
  amount: number;
  /** Money off, shown with a minus. */
  credit?: boolean;
  note?: string;
}

/**
 * The quote for a range as the lines a guest reads: nights, the one discount
 * that applied, cleaning and tax. The total is separate so it can be styled.
 */
export function quoteLines(q: ShortletAvailability): PriceLine[] {
  const nights = q.estimatedNights ?? 0;
  const base = q.estimatedBaseSubtotal ?? q.estimatedSubtotal ?? 0;
  const lines: PriceLine[] = [];
  if (nights) {
    const avg = Math.round(base / nights);
    lines.push({
      label: q.seasonalNights
        ? nightsLabel(nights)
        : `₦${avg.toLocaleString('en-NG')} × ${nightsLabel(nights)}`,
      amount: base,
      note: q.seasonalNights ? `${nightsLabel(q.seasonalNights)} at peak-season rates` : undefined,
    });
  }
  if (q.discountType && q.discountAmount) {
    lines.push({
      label: discountLabel(q.discountType, q.discountPct),
      amount: q.discountAmount,
      credit: true,
    });
  }
  if (q.estimatedCleaningFee) lines.push({ label: 'Cleaning fee', amount: q.estimatedCleaningFee });
  if (q.estimatedTax) {
    lines.push({
      label: q.taxPct ? `${q.taxName ?? 'Tax'} (${q.taxPct}%)` : (q.taxName ?? 'Tax'),
      amount: q.estimatedTax,
    });
  }
  return lines;
}

/** The discounts a listing offers, as short phrases ("10% off 7+ nights"). */
export function discountPhrases(l: ShortletListing): string[] {
  const out: string[] = [];
  if (l.weeklyDiscountPct) out.push(`${l.weeklyDiscountPct}% off 7+ nights`);
  if (l.twoWeekDiscountPct) out.push(`${l.twoWeekDiscountPct}% off 14+ nights`);
  if (l.monthlyDiscountPct) out.push(`${l.monthlyDiscountPct}% off 28+ nights`);
  if (l.lastMinuteDiscountPct && l.lastMinuteDays)
    out.push(
      `${l.lastMinuteDiscountPct}% off within ${l.lastMinuteDays} ${l.lastMinuteDays === 1 ? 'day' : 'days'} of arrival`
    );
  return out;
}

/** "20 Dec – 3 Jan" for a season's first and last nights. */
export function seasonRange(startDate: string, endDate: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
    });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

/** "Sun 20 Dec": a trip day, short enough for one line. */
export const tripDay = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/* ------------------------------- essentials ------------------------------- */

const labelOf = (list: readonly { value: string; label: string }[], v?: string) =>
  list.find((x) => x.value === v)?.label;

/** "24 hours a day · Grid, Generator", or null when the host hasn't said. */
export function powerSummary(l: ShortletListing): string | null {
  const sources = (l.powerSources ?? [])
    .map((s) => labelOf(POWER_SOURCES, s))
    .filter(Boolean)
    .join(', ');
  const hours =
    l.powerHoursPerDay == null
      ? null
      : l.powerHoursPerDay >= 24
        ? '24 hours a day'
        : `About ${l.powerHoursPerDay} hours a day`;
  const parts = [hours, sources || null].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

export const waterSummary = (l: ShortletListing) => labelOf(WATER_SUPPLY, l.waterSupply) ?? null;

export function internetSummary(l: ShortletListing): string | null {
  if (!l.internetType) return null;
  if (l.internetType === 'NONE') return 'No internet';
  const kind = labelOf(INTERNET_TYPES, l.internetType) ?? l.internetType;
  return l.internetSpeedMbps ? `${kind} · about ${l.internetSpeedMbps} Mbps` : kind;
}

export type RuleAnswer = 'yes' | 'no' | 'unknown';
export const ruleAnswer = (v?: boolean): RuleAnswer =>
  v === true ? 'yes' : v === false ? 'no' : 'unknown';

/* ------------------------------- inspection ------------------------------- */

export const CONDITION_LABEL = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
} as const;

/* -------------------------------- my stays -------------------------------- */

/**
 * What the guest pays for a booking, deposit aside. A booking's `total` is the
 * stay (nights after discount, plus cleaning); tax is charged on top of it.
 */
export const guestTotal = (b: Pick<ShortletBooking, 'total' | 'taxAmount'>) =>
  b.total + (b.taxAmount ?? 0);

/**
 * What came back to the guest for the stay. When the host cancels, the stay,
 * tax and deposit all come back, though the booking records only the stay.
 */
export const stayRefund = (b: ShortletBooking): number | undefined =>
  b.cancelledBy === 'HOST' && b.paymentStatus === 'REFUNDED' ? guestTotal(b) : b.refundAmount;

export type StayTab = 'upcoming' | 'past' | 'cancelled';

/** Which tab a booking belongs in, judged by the checkout day (local). */
export function stayTab(b: ShortletBooking, today: string): StayTab {
  if (b.status === 'CANCELLED' || b.status === 'DECLINED') return 'cancelled';
  if (b.status === 'COMPLETED') return 'past';
  return b.checkOut.slice(0, 10) < today ? 'past' : 'upcoming';
}

/* ----------------------------- detty december ----------------------------- */

/** The first peak week of this year's season, so pages open on real December totals. */
export function peakWeek(now = new Date()): { checkIn: string; checkOut: string } {
  const year =
    now.getMonth() === 0 && now.getDate() <= 3 ? now.getFullYear() - 1 : now.getFullYear();
  return { checkIn: `${year}-12-20`, checkOut: `${year}-12-27` };
}

/** Detty December is sold from September until the season ends on 3 January. */
export const isDettySeason = (now = new Date()) =>
  now.getMonth() >= 8 || (now.getMonth() === 0 && now.getDate() <= 3);

/* ------------------------------ stay headline ----------------------------- */

export type HeadlineTone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';

export interface StayHeadline {
  /** The status in a word or two, for the pill. */
  pill: string;
  tone: HeadlineTone;
  /** One line: what this means for the guest. */
  title: string;
  detail?: string;
  /** The one thing to do next, if any. */
  action?: 'pay' | 'review' | 'report' | 'rebook';
}

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

/** Days from `today` (yyyy-MM-dd) to a date, by calendar day. */
function daysFrom(today: string, iso: string): number {
  const a = new Date(`${today}T12:00:00`).getTime();
  const b = new Date(`${iso.slice(0, 10)}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Where a stay stands, told from the guest's side. */
export function stayHeadline(b: ShortletBooking, today: string, now = new Date()): StayHeadline {
  const refund = b.refundAmount ? naira(b.refundAmount) : null;
  switch (b.status) {
    case 'REQUESTED':
      return {
        pill: 'Requested',
        tone: 'warning',
        title: 'Waiting for the host to confirm',
        detail: "You won't pay anything until they accept.",
      };
    case 'DECLINED':
      return {
        pill: 'Declined',
        tone: 'neutral',
        title: "The host couldn't take this stay",
        detail: 'Nothing was charged. Plenty of other stays are open for these dates.',
        action: 'rebook',
      };
    case 'CANCELLED':
      if (b.cancelledBy === 'HOST')
        return {
          pill: 'Cancelled by host',
          tone: 'danger',
          title: 'The host cancelled this stay',
          detail:
            b.paymentStatus === 'UNPAID'
              ? 'Nothing was charged.'
              : 'You get everything back, including the deposit.',
          action: 'rebook',
        };
      return {
        pill: 'Cancelled',
        tone: 'neutral',
        title:
          b.cancelledBy === 'ADMIN' ? 'GetRentos cancelled this stay' : 'You cancelled this stay',
        detail: refund
          ? `${refund} refunded under the ${b.cancellationPolicy.toLowerCase()} policy.`
          : undefined,
      };
    case 'COMPLETED':
      return {
        pill: 'Completed',
        tone: 'info',
        title: b.reviewed ? 'Thanks for staying' : 'How was your stay?',
        detail: b.reviewed ? undefined : 'A review helps the next guest, and the host.',
        action: b.reviewed ? undefined : 'review',
      };
    case 'CONFIRMED': {
      if (b.paymentRequired || b.paymentStatus === 'UNPAID')
        return {
          pill: 'Awaiting payment',
          tone: 'warning',
          title: 'Confirmed: pay to secure it',
          detail: 'Your money is held by GetRentos and only paid to the host after you check in.',
          action: 'pay',
        };
      if (b.paymentStatus === 'PROCESSING')
        return { pill: 'Confirming payment', tone: 'info', title: 'We’re confirming your payment' };
      const p = promiseState(b, now);
      if (p.kind === 'reported')
        return {
          pill: 'Reported',
          tone: 'warning',
          title: 'We’re looking into your report',
          detail: 'The host isn’t paid while we check. Follow it in Disputes.',
        };
      if (p.kind === 'open')
        return {
          pill: 'Checked in',
          tone: 'success',
          title: 'Is everything as described?',
          detail: `If not, report it by ${formatDeadline(p.closesAt)} and we'll hold the host's payment.`,
          action: 'report',
        };
      const days = daysFrom(today, b.checkIn);
      return {
        pill: 'Confirmed',
        tone: 'success',
        title:
          days > 1
            ? `You're all set: ${days} days to go`
            : days === 1
              ? "You're all set: check-in is tomorrow"
              : days === 0
                ? 'Check-in is today'
                : 'Enjoy your stay',
        detail:
          days > 0
            ? 'Paid and held by GetRentos until you check in.'
            : 'GetRentos releases your payment to the host after check-in.',
      };
    }
    default:
      return { pill: b.status, tone: 'neutral', title: '' };
  }
}
