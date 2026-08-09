import type { FinancingPlanLength, FinancingPlanOption } from '@/types/financing';

const FEE_SCHEDULE: Record<FinancingPlanLength, number> = {
  3: 6,
  6: 9,
  12: 14,
};

export const getFinancingPlanOptions = (rentAmount: number): FinancingPlanOption[] => {
  return ([3, 6, 12] as FinancingPlanLength[]).map((months) => {
    const feePercent = FEE_SCHEDULE[months];
    const totalRepayable = Math.round(rentAmount * (1 + feePercent / 100));
    return {
      months,
      feePercent,
      totalRepayable,
      monthlyInstallment: Math.round(totalRepayable / months),
    };
  });
};

export const MIN_TRUST_SCORE_FOR_FINANCING = 65;
