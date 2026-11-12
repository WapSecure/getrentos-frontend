/**
 * Indicative foreign-currency figures beside a naira price (diaspora plan D1). Naira stays the
 * price and the payment currency: these are display only, never a quote, never something to pay in.
 *
 * Rounding rule: two significant figures, in whole units of the currency, half up
 * (£82,345 → about £82,000; £8,250 → about £8,300; £947 → about £950; £3.40 → about £3).
 * Anything that rounds to under one unit, or a non-positive amount, gives no figure at all.
 */

export const INDICATIVE_CURRENCIES = ['GBP', 'USD', 'EUR', 'CAD'] as const;
export type IndicativeCurrency = (typeof INDICATIVE_CURRENCIES)[number];

export const INDICATIVE_SIGNIFICANT_FIGURES = 2;

export const isIndicativeCurrency = (code: string | null | undefined): code is IndicativeCurrency =>
  (INDICATIVE_CURRENCIES as readonly string[]).includes(code ?? '');

export interface IndicativeAmount {
  /** Rounded, whole units of `currency`. */
  amount: number;
  currency: IndicativeCurrency;
  /** "about £82,000" */
  text: string;
}

/** Whole naira as a number, from a number, bigint, or a digit string (BIGINT columns arrive as strings). */
function nairaNumber(naira: number | bigint | string): number | null {
  if (typeof naira === 'number') return Number.isFinite(naira) ? naira : null;
  if (typeof naira === 'bigint') return Number(naira);
  const trimmed = naira.trim();
  // Precision past 2^53 does not matter: the result keeps two significant figures.
  return /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : null;
}

export function roundIndicative(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const magnitude = Math.floor(Math.log10(value));
  const step = Math.max(1, 10 ** (magnitude - INDICATIVE_SIGNIFICANT_FIGURES + 1));
  return Math.round(value / step) * step;
}

const amountFormatters = new Map<IndicativeCurrency, Intl.NumberFormat>();
function formatAmount(amount: number, currency: IndicativeCurrency): string {
  let formatter = amountFormatters.get(currency);
  if (!formatter) {
    // en-GB writes £, US$, € and CA$, so the dollar currencies cannot be confused.
    formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    amountFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

/**
 * `rate` is 1 NGN in `currency` (as `GET /fx/indicative` returns it). Null when there is
 * nothing honest to show: no usable rate, an unsupported currency, or an amount under one unit.
 */
export function indicativeAmount(
  nairaWhole: number | bigint | string,
  rate: number | null | undefined,
  currency: string
): IndicativeAmount | null {
  if (!isIndicativeCurrency(currency)) return null;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
  const naira = nairaNumber(nairaWhole);
  if (naira === null) return null;
  const amount = roundIndicative(naira * rate);
  if (amount < 1) return null;
  return { amount, currency, text: `about ${formatAmount(amount, currency)}` };
}

const LAGOS_TIME_ZONE = 'Africa/Lagos';
const lagosTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: LAGOS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const lagosDay = new Intl.DateTimeFormat('en-GB', {
  timeZone: LAGOS_TIME_ZONE,
  day: 'numeric',
  month: 'short',
});

/** "Indicative, Open Exchange Rates rate at 14:05 Lagos, 11 Nov. You pay in naira." */
export function indicativeRateLabel(source: string, asOf: string | Date): string | null {
  const when = asOf instanceof Date ? asOf : new Date(asOf);
  if (!source.trim() || Number.isNaN(when.getTime())) return null;
  return `Indicative, ${source.trim()} rate at ${lagosTime.format(when)} Lagos, ${lagosDay.format(when)}. You pay in naira.`;
}

/**
 * `GET /fx/indicative` (public). `rates` is 1 NGN in each currency. `available: false` means the
 * rate source is not set up, is down, or its rate is over 24 hours old: show naira only.
 */
export interface IndicativeRates {
  available: boolean;
  source: string | null;
  asOf: string | null;
  rates: Partial<Record<IndicativeCurrency, number>>;
}

export const UNAVAILABLE_RATES: IndicativeRates = {
  available: false,
  source: null,
  asOf: null,
  rates: {},
};
