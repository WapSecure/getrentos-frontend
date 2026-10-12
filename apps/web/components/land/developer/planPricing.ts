import type { LandInstallment, LandPaymentPlanTerms } from '@/types/landDeveloper';

/**
 * Client mirror of the backend's land purchase arithmetic
 * (src/modules/land/domain/payment-schedule.ts), used for live previews only:
 * the server computes the real contract. BigInt keeps `amount × bps` exact
 * for amounts up to the API's ₦1tn ceiling.
 */

const BPS = BigInt(10_000);
const HALF = BigInt(5_000);
const ZERO = BigInt(0);

/** amount × bps / 10 000, rounded half up. */
export const applyBps = (amount: number, bps: number): number =>
  Number((BigInt(Math.round(amount)) * BigInt(Math.round(bps)) + HALF) / BPS);

export const bpsToPercent = (bps: number): number => bps / 100;

/** "12.5" -> 1250. Non-numbers become 0. */
export const percentToBps = (percent: number | string): number => {
  const value = typeof percent === 'number' ? percent : Number(percent);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
};

export const formatBps = (bps: number): string => `${Number((bps / 100).toFixed(2))}%`;

export interface PlanPriceExample {
  plotPrice: number;
  priceUplift: number;
  fees: number;
  totalPrice: number;
  /** Deposit share of the uplifted price plus all fees; everything for outright. */
  initialPayment: number;
  /** A regular monthly installment after the deposit; 0 for outright. */
  monthlyInstallment: number;
  /** The final installment absorbs the rounding remainder, so it can differ. */
  finalInstallment: number;
  durationMonths: number;
}

type PricingTerms = Pick<
  LandPaymentPlanTerms,
  'durationMonths' | 'initialDepositBps' | 'priceUpliftBps'
>;

export const priceExample = (
  plotPrice: number,
  fees: number,
  terms: PricingTerms
): PlanPriceExample => {
  const months = Math.max(0, Math.floor(terms.durationMonths));
  const priceUplift = months > 0 ? applyBps(plotPrice, terms.priceUpliftBps) : 0;
  const contractPrice = plotPrice + priceUplift;
  const totalPrice = contractPrice + fees;
  const initialPayment =
    months === 0 ? totalPrice : applyBps(contractPrice, terms.initialDepositBps) + fees;

  const balance = BigInt(totalPrice - initialPayment);
  let monthlyInstallment = 0;
  let finalInstallment = 0;
  if (months > 0 && balance > ZERO) {
    const base = balance / BigInt(months);
    monthlyInstallment = Number(base);
    finalInstallment = Number(balance - base * BigInt(months - 1));
  }

  return {
    plotPrice,
    priceUplift,
    fees,
    totalPrice,
    initialPayment,
    monthlyInstallment,
    finalInstallment,
    durationMonths: months,
  };
};

/**
 * What the buyer gets back if a purchase is revoked now: everything paid less
 * the plan's forfeiture charge. Late fees already paid are kept, so they are
 * taken out first, exactly as the server does.
 */
export const refundPreview = (
  amountPaid: number,
  installments: Pick<LandInstallment, 'status' | 'lateFee'>[],
  revocationChargeBps: number
): { lateFeesPaid: number; principalPaid: number; charge: number; refund: number } => {
  const lateFeesPaid = installments
    .filter((installment) => installment.status === 'PAID')
    .reduce((sum, installment) => sum + installment.lateFee, 0);
  const principalPaid = Math.max(0, amountPaid - lateFeesPaid);
  const charge = applyBps(principalPaid, revocationChargeBps);
  return { lateFeesPaid, principalPaid, charge, refund: principalPaid - charge };
};

/** Plan terms the server would refuse, phrased for the form. */
export const planTermProblems = (terms: LandPaymentPlanTerms): string[] => {
  const problems: string[] = [];
  if (terms.durationMonths > 0 && terms.initialDepositBps >= 10_000) {
    problems.push('An installment plan needs a deposit below 100%. Use 0 months for outright.');
  }
  if (terms.defaultAfterDays <= terms.gracePeriodDays) {
    problems.push('Default must come later than the grace period ends.');
  }
  return problems;
};
