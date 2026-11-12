import { formatCurrency } from '../utils/format';

/**
 * DIA-30: a value exists only as a dated report by an accredited valuer. It is always shown with the valuer and
 * the date, never as "market value" or "worth". A report over 12 months old is shown as out of date and never
 * counted in a total. Nothing is estimated between reports.
 */
export type ValuationMethod = 'COMPARABLE_SALES' | 'INCOME' | 'COST' | 'RESIDUAL';

export const VALUATION_METHOD_LABELS: Record<ValuationMethod, string> = {
  COMPARABLE_SALES: 'Comparable sales',
  INCOME: 'Income',
  COST: 'Cost',
  RESIDUAL: 'Residual',
};

export const VALUATION_METHOD_OPTIONS = (
  Object.keys(VALUATION_METHOD_LABELS) as ValuationMethod[]
).map((value) => ({ value, label: VALUATION_METHOD_LABELS[value] }));

export interface PropertyValuation {
  id: string;
  propertyId: string;
  /** Whole naira, as a string. */
  amount: string;
  method: ValuationMethod;
  methodLabel: string;
  valuerName: string;
  inspectedAt: string;
  reportDate: string;
  validUntil: string;
  /** Over 12 months old: shown, never counted. */
  outOfDate: boolean;
  /** Portfolio rows only. */
  propertyTitle?: string;
}

/** "1 June 2026", in Lagos, as the report is dated. */
export const valuationDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });

const naira = (amount: string | number) => {
  const n = Number(amount);
  return Number.isFinite(n) ? formatCurrency(n) : null;
};

/** "Valued at ₦95,000,000 by Ada Okafor, 1 June 2026". */
export const valuationSentence = (v: PropertyValuation): string =>
  `Valued at ${naira(v.amount) ?? '—'} by ${v.valuerName}, ${valuationDate(v.reportDate)}`;

/** "Ada Okafor, 1 June 2026": for a table cell under the figure. */
export const valuerAndDate = (v: PropertyValuation): string =>
  `${v.valuerName}, ${valuationDate(v.reportDate)}`;

/** The method, or why the figure no longer counts. */
export const valuationNote = (v: PropertyValuation): string =>
  v.outOfDate
    ? 'Out of date: the report is over 12 months old and is not counted'
    : `${v.methodLabel} method, accredited valuer`;

export interface PortfolioValuationView {
  /** Whole naira; null when no property has an in-date report. */
  total: number | null;
  valuedCount: number;
  notValuedCount: number;
  valuations: PropertyValuation[];
}

/** Null when the API sent no valuation fields at all (an older backend). */
export const portfolioValuationView = (
  portfolio?: {
    valuedTotal?: string | null;
    valuedCount?: number;
    notValuedCount?: number;
    valuations?: PropertyValuation[];
  } | null
): PortfolioValuationView | null => {
  if (!portfolio || typeof portfolio.valuedCount !== 'number') return null;
  const total = portfolio.valuedTotal == null ? null : Number(portfolio.valuedTotal);
  return {
    total: total !== null && Number.isFinite(total) ? total : null,
    valuedCount: portfolio.valuedCount,
    notValuedCount: portfolio.notValuedCount ?? 0,
    valuations: portfolio.valuations ?? [],
  };
};

/** The line under the total: one valuer named outright, several summarised by count. */
export const portfolioValuationSubtitle = (view: PortfolioValuationView): string => {
  const counted = view.valuations.filter((v) => !v.outOfDate);
  const notValued = view.notValuedCount ? `; ${view.notValuedCount} not valued` : '';
  if (counted.length === 1) return `${valuerAndDate(counted[0])}${notValued}`;
  if (counted.length > 1) return `${counted.length} reports under 12 months old${notValued}`;
  return view.notValuedCount
    ? 'No report from an accredited valuer in the last 12 months'
    : 'Not valued';
};
