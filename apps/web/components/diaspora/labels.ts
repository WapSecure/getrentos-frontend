import type {
  BudgetBand,
  DisplayCurrency,
  IntendedUse,
  InvestmentHorizon,
  InvestorPropertyType,
  OwnershipStructure,
} from '@/types/investor';

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
