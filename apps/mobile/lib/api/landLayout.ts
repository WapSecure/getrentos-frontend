import type { BadgeTone } from '@getrentos/ui-native';
import { ApiError, apiFetch } from './client';
import type { LandAreaUnit } from './ownerLand';
import { applyBps } from './landSales';

/**
 * A developer's estate on one parcel: the layout (draft, on sale, closed), its
 * plots, the payment plans buyers choose from, and how the seller's listings
 * are doing. Money is whole naira; rates are basis points (1% = 100).
 */

export type LayoutStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export const PLOT_STATUSES = [
  'AVAILABLE',
  'RESERVED',
  'UNDER_INSTALLMENT',
  'SOLD',
  'ALLOCATED',
  'WITHHELD',
] as const;
export type PlotStatus = (typeof PLOT_STATUSES)[number];

export const LAYOUT_STATUS: Record<LayoutStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PUBLISHED: { label: 'On sale', tone: 'success' },
  CLOSED: { label: 'Closed', tone: 'warning' },
};

export const PLOT_STATUS: Record<PlotStatus, { label: string; tone: BadgeTone }> = {
  AVAILABLE: { label: 'Available', tone: 'success' },
  RESERVED: { label: 'Reserved', tone: 'info' },
  UNDER_INSTALLMENT: { label: 'Under installment', tone: 'warning' },
  SOLD: { label: 'Sold', tone: 'neutral' },
  ALLOCATED: { label: 'Allocated', tone: 'neutral' },
  WITHHELD: { label: 'Withheld', tone: 'danger' },
};

export interface PlanTerms {
  /** 0 is an outright purchase. */
  durationMonths: number;
  initialDepositBps: number;
  priceUpliftBps: number;
  gracePeriodDays: number;
  lateFeeBps: number;
  defaultAfterDays: number;
  revocationChargeBps: number;
}

export interface PaymentPlan extends PlanTerms {
  id: string;
  name: string;
  active: boolean;
}

export interface Layout {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  status: LayoutStatus;
  layoutApprovalReference?: string;
  layoutPlanDocumentId?: string;
  reservationHoldHours: number;
  inspectionHoldDays: number;
  fees: { documentationFee: number; surveyFee: number; developmentLevy: number; total: number };
  publishedAt?: string;
  closedAt?: string;
  paymentPlans: PaymentPlan[];
  plotCounts: Partial<Record<PlotStatus, number>>;
}

export interface LayoutInput {
  name: string;
  description?: string | null;
  layoutApprovalReference?: string | null;
  layoutPlanDocumentId?: string | null;
  reservationHoldHours?: number;
  inspectionHoldDays?: number;
  documentationFee?: number;
  surveyFee?: number;
  developmentLevy?: number;
}

export interface Plot {
  id: string;
  plotNumber: string;
  block?: string;
  areaValue: number;
  areaUnit: LandAreaUnit;
  isCorner: boolean;
  tags: string[];
  price: number;
  pricePerSqm?: number;
  status: PlotStatus;
  heldUntil?: string;
}

export interface PlotInput {
  plotNumber: string;
  block?: string;
  areaValue: number;
  areaUnit: LandAreaUnit;
  price: number;
  isCorner?: boolean;
  tags?: string[];
}

export interface InventoryDashboard {
  status: LayoutStatus;
  counts: Partial<Record<PlotStatus, number>>;
  totalPlots: number;
  totalValue: number;
  availableValue: number;
  soldValue: number;
  sellThroughPercent: number;
  purchases: {
    live: number;
    collected: number;
    outstanding: number;
    overdueAmount: number;
    defaulted: number;
  };
}

export interface SellerAnalytics {
  areaSqm?: number;
  listings: {
    listingId: string;
    status: string;
    askingPrice: number;
    publishedAt: string | null;
    daysOnMarket: number | null;
    views: number;
    saves: number;
    viewings: number;
    totalOffers: number;
    latestOffer: {
      amount: number;
      status: string;
      createdAt: string;
      vsAskingPercent: number;
    } | null;
  }[];
  market: {
    area: string;
    sampleSize: number;
    subjectPricePerSqm?: number;
    marketMedianPricePerSqm?: number;
    percentile?: number;
    pricingHint?: string;
  } | null;
}

/* ------------------------------ layout form ------------------------------ */

export interface LayoutForm {
  name: string;
  description: string;
  layoutApprovalReference: string;
  layoutPlanDocumentId: string;
  reservationHoldHours: string;
  inspectionHoldDays: string;
  documentationFee: string;
  surveyFee: string;
  developmentLevy: string;
}

export const layoutToForm = (l?: Layout | null): LayoutForm => ({
  name: l?.name ?? '',
  description: l?.description ?? '',
  layoutApprovalReference: l?.layoutApprovalReference ?? '',
  layoutPlanDocumentId: l?.layoutPlanDocumentId ?? '',
  reservationHoldHours: String(l?.reservationHoldHours ?? 48),
  inspectionHoldDays: String(l?.inspectionHoldDays ?? 7),
  documentationFee: String(l?.fees.documentationFee ?? 0),
  surveyFee: String(l?.fees.surveyFee ?? 0),
  developmentLevy: String(l?.fees.developmentLevy ?? 0),
});

/** What the server would refuse in the layout form, or null. */
export function layoutProblem(f: LayoutForm): string | null {
  if (f.name.trim().length < 2) return 'Name the estate (at least 2 characters).';
  const hold = Number(f.reservationHoldHours);
  if (!Number.isInteger(hold) || hold < 1 || hold > 336) {
    return 'Reservation hold: between 1 and 336 hours (14 days).';
  }
  const days = Number(f.inspectionHoldDays);
  if (!Number.isInteger(days) || days < 0 || days > 14) {
    return 'Inspection hold: between 0 and 14 days.';
  }
  return null;
}

const money = (v: string) => Math.max(0, Math.round(Number(v) || 0));

/**
 * The body to send. On an edit, a cleared optional text is sent as null so the
 * server clears it; on create it is left out.
 */
export function layoutInput(f: LayoutForm, editing: boolean): LayoutInput {
  const opt = (v: string) => (v.trim() ? v.trim() : editing ? null : undefined);
  return {
    name: f.name.trim(),
    description: opt(f.description),
    layoutApprovalReference: opt(f.layoutApprovalReference),
    layoutPlanDocumentId: f.layoutPlanDocumentId || (editing ? null : undefined),
    reservationHoldHours: Number(f.reservationHoldHours),
    inspectionHoldDays: Number(f.inspectionHoldDays),
    documentationFee: money(f.documentationFee),
    surveyFee: money(f.surveyFee),
    developmentLevy: money(f.developmentLevy),
  };
}

/** What publishing needs: a sale-ready parcel, an available plot, an active plan. */
export function publishChecklist(input: {
  parcelSaleReady: boolean;
  available: number;
  activePlans: number;
}) {
  return [
    {
      done: input.parcelSaleReady,
      label: 'Master parcel verified',
      detail: 'The property and its land diligence must be verified and in date.',
    },
    {
      done: input.available > 0,
      label: 'At least one available plot',
      detail: `${input.available} available now.`,
    },
    {
      done: input.activePlans > 0,
      label: 'At least one active payment plan',
      detail: `${input.activePlans} active now.`,
    },
  ];
}

/* ------------------------------- plot form ------------------------------- */

export const parseTags = (value: string) =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

/** Plots that can still be edited, withheld or released. */
export const EDITABLE_PLOT = new Set<PlotStatus>(['AVAILABLE', 'WITHHELD']);

export function plotProblem(
  editing: boolean,
  f: { plotNumber: string; areaValue: string; price: string; tags: string }
): string | null {
  if (!editing && !f.plotNumber.trim()) return 'Give the plot number.';
  if (!editing && !(Number(f.areaValue) >= 0.01)) return 'Enter the plot size.';
  if (!(Number(f.price) >= 1)) return 'Enter the asking price.';
  const tags = parseTags(f.tags);
  if (tags.length > 20) return 'At most 20 tags.';
  if (tags.some((t) => t.length > 40)) return 'Each tag must be 40 characters or fewer.';
  return null;
}

/* ------------------------------- plan form ------------------------------- */

export const percentToBps = (p: string | number) => {
  const v = Number(p);
  return Number.isFinite(v) ? Math.round(v * 100) : 0;
};
export const bpsToPercent = (bps: number) => bps / 100;

export interface PlanField {
  key:
    | 'durationMonths'
    | 'deposit'
    | 'uplift'
    | 'gracePeriodDays'
    | 'lateFee'
    | 'defaultAfterDays'
    | 'forfeiture';
  label: string;
  hint: string;
  min: number;
  max: number;
  integer: boolean;
}

export const PLAN_FIELDS: PlanField[] = [
  {
    key: 'durationMonths',
    label: 'Duration (months)',
    hint: '0 months is an outright purchase.',
    min: 0,
    max: 120,
    integer: true,
  },
  {
    key: 'deposit',
    label: 'Deposit (%)',
    hint: 'Share of the price paid to start.',
    min: 0,
    max: 100,
    integer: false,
  },
  {
    key: 'uplift',
    label: 'Installment premium (%)',
    hint: 'Added to the price for paying over time.',
    min: 0,
    max: 100,
    integer: false,
  },
  {
    key: 'gracePeriodDays',
    label: 'Grace period (days)',
    hint: 'Days after a due date before a late fee.',
    min: 0,
    max: 60,
    integer: true,
  },
  {
    key: 'lateFee',
    label: 'Late fee (%)',
    hint: 'Charged once on a late installment.',
    min: 0,
    max: 20,
    integer: false,
  },
  {
    key: 'defaultAfterDays',
    label: 'Default after (days)',
    hint: 'Days overdue before the purchase defaults.',
    min: 1,
    max: 365,
    integer: true,
  },
  {
    key: 'forfeiture',
    label: 'Forfeiture on revocation (%)',
    hint: 'Kept from what was paid if you revoke.',
    min: 0,
    max: 50,
    integer: false,
  },
];

export type PlanForm = Record<PlanField['key'] | 'name', string>;

export const planToForm = (p?: PaymentPlan | null): PlanForm => ({
  name: p?.name ?? '',
  durationMonths: String(p?.durationMonths ?? 12),
  deposit: String(bpsToPercent(p?.initialDepositBps ?? 3000)),
  uplift: String(bpsToPercent(p?.priceUpliftBps ?? 0)),
  gracePeriodDays: String(p?.gracePeriodDays ?? 7),
  lateFee: String(bpsToPercent(p?.lateFeeBps ?? 0)),
  defaultAfterDays: String(p?.defaultAfterDays ?? 60),
  forfeiture: String(bpsToPercent(p?.revocationChargeBps ?? 2000)),
});

export function planFieldError(field: PlanField, raw: string): string | null {
  const v = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(v)) return `${field.label}: required.`;
  if (field.integer && !Number.isInteger(v)) return `${field.label}: use a whole number.`;
  if (!field.integer && (raw.trim().split('.')[1]?.length ?? 0) > 2) {
    return `${field.label}: at most 2 decimal places.`;
  }
  if (v < field.min || v > field.max)
    return `${field.label}: between ${field.min} and ${field.max}.`;
  return null;
}

export const planInput = (f: PlanForm) => ({
  name: f.name.trim(),
  durationMonths: Number(f.durationMonths),
  initialDepositBps: percentToBps(f.deposit),
  priceUpliftBps: percentToBps(f.uplift),
  gracePeriodDays: Number(f.gracePeriodDays),
  lateFeeBps: percentToBps(f.lateFee),
  defaultAfterDays: Number(f.defaultAfterDays),
  revocationChargeBps: percentToBps(f.forfeiture),
});

/** Plan terms the server would refuse, phrased for the form. */
export function planTermProblems(t: PlanTerms): string[] {
  const problems: string[] = [];
  if (t.durationMonths > 0 && t.initialDepositBps >= 10_000) {
    problems.push('An installment plan needs a deposit below 100%. Use 0 months for outright.');
  }
  if (t.defaultAfterDays <= t.gracePeriodDays) {
    problems.push('Default must come later than the grace period ends.');
  }
  return problems;
}

/** The first thing wrong with the plan form, or null. */
export function planProblem(f: PlanForm): string | null {
  if (f.name.trim().length < 2) return 'Name the plan (at least 2 characters).';
  for (const field of PLAN_FIELDS) {
    const e = planFieldError(field, f[field.key]);
    if (e) return e;
  }
  return planTermProblems(planInput(f))[0] ?? null;
}

/** What a buyer would pay on this plan for a plot at `plotPrice`, as the server prices it. */
export function priceExample(
  plotPrice: number,
  fees: number,
  t: Pick<PlanTerms, 'durationMonths' | 'initialDepositBps' | 'priceUpliftBps'>
) {
  const months = Math.max(0, Math.floor(t.durationMonths));
  const priceUplift = months > 0 ? applyBps(plotPrice, t.priceUpliftBps) : 0;
  const contractPrice = plotPrice + priceUplift;
  const totalPrice = contractPrice + fees;
  const initialPayment =
    months === 0 ? totalPrice : applyBps(contractPrice, t.initialDepositBps) + fees;
  const balance = totalPrice - initialPayment;
  let monthlyInstallment = 0;
  let finalInstallment = 0;
  if (months > 0 && balance > 0) {
    monthlyInstallment = Math.floor(balance / months);
    finalInstallment = balance - monthlyInstallment * (months - 1);
  }
  return { priceUplift, totalPrice, initialPayment, monthlyInstallment, finalInstallment, months };
}

/* ---------------------------------- api ---------------------------------- */

const layoutPath = (propertyId: string) => `/owner/land/${encodeURIComponent(propertyId)}/layout`;

export const landLayoutApi = {
  /** The layout, or null when none has been set up yet. */
  get: async (propertyId: string) => {
    try {
      return await apiFetch<Layout>(layoutPath(propertyId));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  create: (propertyId: string, input: LayoutInput) =>
    apiFetch<Layout>(layoutPath(propertyId), { method: 'POST', body: input }),
  update: (propertyId: string, input: LayoutInput) =>
    apiFetch<Layout>(layoutPath(propertyId), { method: 'PATCH', body: input }),
  publish: (propertyId: string) =>
    apiFetch<Layout>(`${layoutPath(propertyId)}/publish`, { method: 'POST' }),
  close: (propertyId: string) =>
    apiFetch<Layout>(`${layoutPath(propertyId)}/close`, { method: 'POST' }),
  dashboard: (propertyId: string) =>
    apiFetch<InventoryDashboard>(`${layoutPath(propertyId)}/dashboard`),
  plots: (propertyId: string, status?: PlotStatus) =>
    apiFetch<Plot[]>(`${layoutPath(propertyId)}/plots${status ? `?status=${status}` : ''}`),
  addPlot: (propertyId: string, input: PlotInput) =>
    apiFetch<Plot>(`${layoutPath(propertyId)}/plots`, { method: 'POST', body: input }),
  updatePlot: (
    propertyId: string,
    plotId: string,
    input: { price?: number; tags?: string[]; isCorner?: boolean }
  ) =>
    apiFetch<Plot>(`${layoutPath(propertyId)}/plots/${plotId}`, { method: 'PATCH', body: input }),
  withholdPlot: (propertyId: string, plotId: string) =>
    apiFetch<Plot>(`${layoutPath(propertyId)}/plots/${plotId}/withhold`, { method: 'POST' }),
  releasePlot: (propertyId: string, plotId: string) =>
    apiFetch<Plot>(`${layoutPath(propertyId)}/plots/${plotId}/release`, { method: 'POST' }),
  createPlan: (propertyId: string, input: PlanTerms & { name: string }) =>
    apiFetch<PaymentPlan>(`${layoutPath(propertyId)}/plans`, { method: 'POST', body: input }),
  updatePlan: (
    propertyId: string,
    planId: string,
    input: Partial<PlanTerms & { name: string }> & { active?: boolean }
  ) =>
    apiFetch<PaymentPlan>(`${layoutPath(propertyId)}/plans/${planId}`, {
      method: 'PATCH',
      body: input,
    }),
  analytics: (propertyId: string) =>
    apiFetch<SellerAnalytics>(`/owner/land/${encodeURIComponent(propertyId)}/analytics`),
};
