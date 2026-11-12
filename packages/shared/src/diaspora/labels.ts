import type {
  BudgetBand,
  DisplayCurrency,
  ForeignCheckState,
  IntendedUse,
  InvestmentHorizon,
  InvestorPropertyType,
  OwnershipStructure,
  SourceOfFundsSupportingKind,
  SummaryChannel,
  SummaryFrequency,
} from './types';
import type { StatusTone } from '../utils/landTrust';

// Investor labels for web and mobile. Users never see "escrow".

export const INTENDED_USE_LABELS: Record<IntendedUse, string> = {
  HOME: 'A home for me or my family',
  RENTAL_INCOME: 'Rental income',
  APPRECIATION: 'Long-term growth in value',
  DEVELOPMENT: 'Building or developing',
};

export const PROPERTY_TYPE_LABELS: Record<InvestorPropertyType, string> = {
  HOUSE: 'House',
  FLAT: 'Flat',
  LAND: 'Land',
  COMMERCIAL: 'Commercial',
};

export const BUDGET_BAND_LABELS: Record<BudgetBand, string> = {
  UNDER_50M: 'Under ₦50m',
  FROM_50M_TO_150M: '₦50m to ₦150m',
  FROM_150M_TO_500M: '₦150m to ₦500m',
  OVER_500M: 'Over ₦500m',
};

export const HORIZON_LABELS: Record<InvestmentHorizon, string> = {
  UNDER_2_YEARS: 'Under 2 years',
  TWO_TO_5_YEARS: '2 to 5 years',
  FIVE_TO_10_YEARS: '5 to 10 years',
  OVER_10_YEARS: 'Over 10 years',
};

export const OWNERSHIP_LABELS: Record<OwnershipStructure, string> = {
  INDIVIDUAL: 'In my own name',
  JOINT: 'Jointly with someone else',
  COMPANY: 'Through a company',
};

export const SUMMARY_FREQUENCY_LABELS: Record<SummaryFrequency, string> = {
  NONE: 'No summary',
  WEEKLY: 'Weekly, on Monday',
  MONTHLY: 'Monthly, on the 1st',
};

export const SUMMARY_CHANNEL_LABELS: Record<SummaryChannel, string> = {
  EMAIL: 'Email',
  PUSH: 'Push notification',
};

export const CURRENCY_LABELS: Record<DisplayCurrency, string> = {
  NGN: 'Naira (₦)',
  GBP: 'Pounds sterling (£)',
  USD: 'US dollars (US$)',
  EUR: 'Euros (€)',
  CAD: 'Canadian dollars (CA$)',
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Sent',
  COUNTERED: 'Countered',
  ACCEPTED: 'Accepted',
  REJECTED: 'Declined',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired',
  CLOSED: 'Closed',
};

// Users never see "escrow": these are the payment states of a protected purchase.
export const PROTECTED_PAYMENT_STATUS_LABELS: Record<string, string> = {
  DEPOSIT_PENDING: 'Deposit due',
  FUNDS_HELD: 'Held by Sureground',
  VERIFICATION_PENDING: 'Being checked',
  SETTLEMENT_PENDING: 'Being released',
  RELEASED: 'Released',
  FROZEN: 'On hold',
  DISPUTED: 'In dispute',
  REFUNDED: 'Refunded',
};

export const LAND_PURCHASE_STATUS_LABELS: Record<string, string> = {
  PENDING_DEPOSIT: 'Deposit due',
  ACTIVE: 'Paying instalments',
  PAID_IN_FULL: 'Paid in full',
  COMPLETED: 'Completed',
  DEFAULTED: 'Defaulted',
  REVOKED: 'Revoked',
  CANCELLED: 'Cancelled',
};

export const STATEMENT_PAYOUT_LABELS: Record<string, string> = {
  PENDING: 'Payout pending',
  AWAITING_APPROVAL: 'Payout awaiting approval',
  PAID: 'Paid out',
  FAILED: 'Payout failed',
  REJECTED: 'Payout not sent',
};

/** "SOME_NEW_STATUS" → "Some new status": the fallback for a status without a label. */
export const humaniseStatus = (status: string): string => {
  const words = status.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const listLabels = <K extends string>(
  values: readonly K[] | undefined,
  labels: Record<K, string>
): string => (values ?? []).map((value) => labels[value] ?? value).join(', ');

/** Passport, address and bank statement checks. "Approved" by staff or Smile ID, never "verified property". */
export const FOREIGN_CHECK_STATUS: Record<ForeignCheckState, { label: string; tone: StatusTone }> =
  {
    NOT_STARTED: { label: 'Not started', tone: 'neutral' },
    CHECKING: { label: 'Checking', tone: 'info' },
    IN_REVIEW: { label: 'With our team', tone: 'warning' },
    APPROVED: { label: 'Approved', tone: 'success' },
    REJECTED: { label: 'Not approved', tone: 'danger' },
  };

/** DIA-07: what can go with the bank statements. A gift or inheritance letter also needs the donor's ID. */
export const SOURCE_OF_FUNDS_SUPPORTING_LABELS: Record<SourceOfFundsSupportingKind, string> = {
  PAYSLIPS: 'Payslips',
  TAX_RETURN: 'Tax return',
  ASSET_SALE_CONTRACT: 'Sale contract for an asset',
  INHERITANCE_OR_GIFT_LETTER: 'Inheritance or gift letter',
  BUSINESS_ACCOUNTS: 'Business accounts',
};

/** Fallback when the API sends no reason line. */
export const SOURCE_OF_FUNDS_WHY =
  'Nigerian and international anti-money-laundering rules require us to confirm where larger sums come from.';
