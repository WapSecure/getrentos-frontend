import { apiDownload, apiFetch } from './client';
import type { BadgeTone } from '@sureground/ui-native';

export type ExpenseCategory =
  | 'UTILITIES'
  | 'INSURANCE'
  | 'TAX'
  | 'REPAIRS'
  | 'MANAGEMENT_FEE'
  | 'LEGAL'
  | 'OTHER';
export type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  UTILITIES: 'Utilities',
  INSURANCE: 'Insurance',
  TAX: 'Tax',
  REPAIRS: 'Repairs',
  MANAGEMENT_FEE: 'Management fee',
  LEGAL: 'Legal',
  OTHER: 'Other',
};
export const PERIOD_LABEL: Record<BudgetPeriod, string> = {
  MONTHLY: 'This month',
  QUARTERLY: 'This quarter',
  ANNUAL: 'This year',
};
export const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
];
/** `ALL` is a whole-property budget across every category. */
export const BUDGET_CATEGORIES: { value: ExpenseCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Whole property' },
  ...(Object.keys(CATEGORY_LABEL) as ExpenseCategory[]).map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
  })),
];

export interface Budget {
  id: string;
  propertyId: string;
  propertyTitle: string;
  category: ExpenseCategory | null;
  period: BudgetPeriod;
  amount: number;
  currency: string;
  actual: number;
  variance: number;
  utilisationPct: number;
  periodStart: string;
  periodEnd: string;
}

export function utilisationTone(pct: number): BadgeTone {
  if (pct > 100) return 'danger';
  if (pct >= 80) return 'warning';
  return 'success';
}

export type PayoutFrequency = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
export type PayoutStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'HELD';

export const FREQUENCIES: { value: PayoutFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Every week' },
  { value: 'FORTNIGHTLY', label: 'Every two weeks' },
  { value: 'MONTHLY', label: 'Every month' },
];

export const PAYOUT_STATUS: Record<PayoutStatus, { label: string; tone: BadgeTone }> = {
  SUCCESS: { label: 'Paid out', tone: 'success' },
  PENDING: { label: 'Payout pending', tone: 'warning' },
  // Held is the control working: an amount over the auto-payout limit waits
  // for a second approver on an owner statement.
  HELD: { label: 'Needs approval', tone: 'info' },
  FAILED: { label: 'Failed', tone: 'danger' },
};

export interface PayoutRecord {
  id: string;
  amount: number;
  reserveAmount: number;
  balanceBefore: number;
  status: PayoutStatus;
  heldReason: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PayoutSchedule {
  schedule: {
    frequency: PayoutFrequency;
    reserveAmount: number;
    enabled: boolean;
    nextRunAt: string;
  } | null;
  /** Whole naira Sureground holds for the landlord. */
  balance: number;
  recent: PayoutRecord[];
}

export const payableNow = (balance: number, reserve: number) => Math.max(0, balance - reserve);

export interface RentRollRow {
  propertyTitle: string;
  unitName: string;
  tenantName: string | null;
  occupied: boolean;
  rentAmount: number | null;
  rentPeriod: string | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  outstanding: number;
}

export interface PnlReport {
  from: string;
  to: string;
  rows: {
    propertyId: string;
    propertyTitle: string;
    income: number;
    expenses: number;
    net: number;
  }[];
  totals: { income: number; expenses: number; net: number };
}

export const RENT_PERIOD_SUFFIX: Record<string, string> = {
  MONTHLY: '/mo',
  QUARTERLY: '/qtr',
  ANNUAL: '/yr',
};

/** `yyyy-MM-dd`, n months before `from` (today by default). */
export function monthsAgo(n: number, from = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

export type ReportExport = 'rent-roll' | 'pnl' | 'arrears' | 'statements';

export const EXPORTS: Record<ReportExport, { label: string; file: string }> = {
  'rent-roll': { label: 'Rent roll', file: 'sureground-rent-roll.csv' },
  pnl: { label: 'Income & expenses', file: 'sureground-income-expenses.csv' },
  arrears: { label: 'Arrears', file: 'sureground-arrears.csv' },
  statements: { label: 'Statement history', file: 'sureground-statements.csv' },
};

export function exportPath(kind: ReportExport, range?: { from: string; to: string }) {
  const base = `/landlord/reports/${kind}/export`;
  return kind === 'pnl' && range
    ? `${base}?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`
    : base;
}

export interface PropertyPerformance {
  propertyId: string;
  name: string;
  city: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number | null;
  annualRentRoll: number;
  rentCollected: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  expenseRatio: number | null;
  estimatedValue?: number;
  purchasePrice?: number;
  capRate: number | null;
  grossYield: number | null;
  yieldOnCost: number | null;
  appreciation: number | null;
  capRateVsPortfolio: number | null;
  missing: ('estimatedValue' | 'purchasePrice')[];
}

export interface PortfolioAnalytics {
  summary: {
    windowMonths: number;
    propertyCount: number;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number | null;
    rentCollected: number;
    operatingExpenses: number;
    netOperatingIncome: number;
    portfolioValue: number;
    valuedPropertyCount: number;
    capRate: number | null;
    yieldOnCost: number | null;
    bestCapRatePropertyId: string | null;
    weakestCapRatePropertyId: string | null;
  };
  properties: PropertyPerformance[];
}

export interface PortfolioBriefing {
  hasData: boolean;
  headline: string;
  insights: string[];
  actions: string[];
  source: 'ai' | 'heuristic';
  generatedAt: string;
}

export type PortfolioSort = 'netOperatingIncome' | 'capRate' | 'yieldOnCost' | 'occupancyRate';
export const PORTFOLIO_SORTS: { value: PortfolioSort; label: string }[] = [
  { value: 'netOperatingIncome', label: 'Net income' },
  { value: 'capRate', label: 'Cap rate' },
  { value: 'yieldOnCost', label: 'Yield' },
  { value: 'occupancyRate', label: 'Occupancy' },
];

export const sortPerformance = (rows: PropertyPerformance[], key: PortfolioSort) =>
  [...rows].sort((a, b) => (b[key] ?? -Infinity) - (a[key] ?? -Infinity));

export const percent = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)}%`);

export function optionalAmount(text: string): number | undefined | null {
  const t = text.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export const landlordFinanceApi = {
  budgets: () => apiFetch<Budget[]>('/landlord/budgets'),
  setBudget: (input: {
    propertyId: string;
    category?: ExpenseCategory;
    period: BudgetPeriod;
    amount: number;
  }) => apiFetch<Budget>('/landlord/budgets', { method: 'PUT', body: input }),
  removeBudget: (id: string) => apiFetch<void>(`/landlord/budgets/${id}`, { method: 'DELETE' }),

  payouts: () => apiFetch<PayoutSchedule>('/landlord/disbursement-schedule'),
  setPayouts: (input: { frequency: PayoutFrequency; reserveAmount: number; enabled: boolean }) =>
    apiFetch<PayoutSchedule>('/landlord/disbursement-schedule', { method: 'PUT', body: input }),

  rentRoll: () => apiFetch<RentRollRow[]>('/landlord/reports/rent-roll'),
  pnl: (from: string, to: string) =>
    apiFetch<PnlReport>(
      `/landlord/reports/pnl?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    ),
  download: (kind: ReportExport, range?: { from: string; to: string }) =>
    apiDownload(exportPath(kind, range)),

  portfolio: () => apiFetch<PortfolioAnalytics>('/landlord/portfolio/analytics'),
  briefing: () => apiFetch<PortfolioBriefing>('/ai/portfolio/briefing'),
  setValues: (propertyId: string, input: { estimatedValue?: number; purchasePrice?: number }) =>
    apiFetch<unknown>(`/landlord/properties/${propertyId}`, { method: 'PATCH', body: input }),
};
