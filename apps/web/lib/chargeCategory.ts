export type ChargeCategory = 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY' | 'LATE_FEE';

const LABELS: Record<ChargeCategory, string> = {
  RENT: 'Rent',
  SERVICE_CHARGE: 'Service charge',
  DEPOSIT: 'Deposit',
  LEVY: 'Levy',
  LATE_FEE: 'Late fee',
};

/** Lower-case label for running text, e.g. "to service charge due Mar 15". */
export const chargeLabel = (category?: ChargeCategory): string =>
  (category ? LABELS[category] : LABELS.RENT).toLowerCase();
