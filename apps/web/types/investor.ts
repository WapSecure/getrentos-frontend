// Sureground Diaspora Invest: the investor profile, risk acknowledgement and workspace overview.

import type { PurchaseSummary } from './transactionWorkspace';

export const DISPLAY_CURRENCIES = ['NGN', 'GBP', 'USD', 'EUR', 'CAD'] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const INTENDED_USES = ['HOME', 'RENTAL_INCOME', 'APPRECIATION', 'DEVELOPMENT'] as const;
export type IntendedUse = (typeof INTENDED_USES)[number];

export const INVESTOR_PROPERTY_TYPES = ['HOUSE', 'FLAT', 'LAND', 'COMMERCIAL'] as const;
export type InvestorPropertyType = (typeof INVESTOR_PROPERTY_TYPES)[number];

export const BUDGET_BANDS = [
  'UNDER_50M',
  'FROM_50M_TO_150M',
  'FROM_150M_TO_500M',
  'OVER_500M',
] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

export const INVESTMENT_HORIZONS = [
  'UNDER_2_YEARS',
  'TWO_TO_5_YEARS',
  'FIVE_TO_10_YEARS',
  'OVER_10_YEARS',
] as const;
export type InvestmentHorizon = (typeof INVESTMENT_HORIZONS)[number];

export const OWNERSHIP_STRUCTURES = ['INDIVIDUAL', 'JOINT', 'COMPANY'] as const;
export type OwnershipStructure = (typeof OWNERSHIP_STRUCTURES)[number];

/** PUT merges: send only the fields being saved. Country codes are upper-case alpha-2. */
export interface InvestorProfileInput {
  /** ISO 3166-1 alpha-2, e.g. GB. */
  countryOfResidence?: string;
  /** ISO 3166-1 alpha-2, e.g. NG. */
  nationality?: string;
  /** IANA zone spelt exactly as Intl names it, e.g. Europe/London. */
  timeZone?: string;
  displayCurrency?: DisplayCurrency;
  /** Non-empty, no repeats. */
  intendedUses?: IntendedUse[];
  /** Non-empty, no repeats. */
  propertyTypes?: InvestorPropertyType[];
  budgetBand?: BudgetBand;
  horizon?: InvestmentHorizon;
  ownershipStructure?: OwnershipStructure;
}

export type InvestorProfileField =
  | 'countryOfResidence'
  | 'nationality'
  | 'timeZone'
  | 'intendedUses'
  | 'propertyTypes'
  | 'budgetBand'
  | 'horizon'
  | 'ownershipStructure';

/** Fields stay null until the investor fills them in. */
export interface InvestorProfile {
  countryOfResidence: string | null;
  nationality: string | null;
  timeZone: string | null;
  displayCurrency: DisplayCurrency;
  intendedUses: IntendedUse[];
  propertyTypes: InvestorPropertyType[];
  budgetBand: BudgetBand | null;
  horizon: InvestmentHorizon | null;
  ownershipStructure: OwnershipStructure | null;
  /** Required fields still empty. */
  missingFields: string[];
  /** Set once the profile is complete and the current risk statement is accepted. */
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiskDeclaration {
  version: string;
  points: string[];
  accepted: boolean;
  acceptedAt: string | null;
}

export interface InvestorAvailability {
  enabled: boolean;
}

export interface InvestorStatusCounts {
  total: number;
  /** Every status, with 0 for the empty ones. */
  byStatus: Record<string, number>;
}

export interface InvestorStatementSummary {
  id: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string | null;
  /** Whole naira, as a string. */
  netAmount: string;
  payoutStatus: string;
}

/** Fields are optional on read: the workspace renders what arrives and skips the rest. */
export interface InvestorOverview {
  profile?: Pick<
    InvestorProfile,
    | 'countryOfResidence'
    | 'timeZone'
    | 'displayCurrency'
    | 'missingFields'
    | 'onboardingCompletedAt'
  > | null;
  riskDeclaration?: Pick<RiskDeclaration, 'version' | 'accepted' | 'acceptedAt'> | null;
  offers?: InvestorStatusCounts;
  /** Sale purchases through Payment Protection, by EscrowStatus (never shown as "escrow"). */
  protectedPurchases?: InvestorStatusCounts;
  landPurchases?: InvestorStatusCounts;
  activeManagedProperties?: number;
  pendingSpendApprovals?: { count: number; totalAmount: string };
  latestStatement?: InvestorStatementSummary | null;
  /** My purchases with their three statuses, then those I see as a representative. */
  purchases?: PurchaseSummary[];
}
