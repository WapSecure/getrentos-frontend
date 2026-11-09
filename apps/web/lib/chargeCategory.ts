export type ChargeCategory = 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY' | 'LATE_FEE';

const LABELS: Record<ChargeCategory, string> = {
  RENT: 'Rent',
  SERVICE_CHARGE: 'Service charge',
  DEPOSIT: 'Deposit',
  LEVY: 'Levy',
  LATE_FEE: 'Late fee',
};

export const chargeLabel = (category?: ChargeCategory): string =>
  (category ? LABELS[category] : LABELS.RENT).toLowerCase();

export const chargeTitle = (category?: ChargeCategory): string =>
  category ? (LABELS[category] ?? 'Charge') : LABELS.RENT;
