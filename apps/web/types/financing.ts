export type FinancingPlanLength = 3 | 6 | 12;

export type FinancingApplicationStatus = 'not_applied' | 'pending_review' | 'approved' | 'rejected';

export type FinancingPlanStatus = 'active' | 'completed' | 'defaulted';

export type InstallmentStatus = 'upcoming' | 'due' | 'paid' | 'overdue';

export interface FinancingInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidDate?: string;
}

export interface FinancingPlanOption {
  months: FinancingPlanLength;
  feePercent: number;
  totalRepayable: number;
  monthlyInstallment: number;
}

export interface FinancingPlan {
  id: string;
  propertyName: string;
  landlordName: string;
  rentAmount: number;
  planLengthMonths: FinancingPlanLength;
  feePercent: number;
  feeAmount: number;
  totalRepayable: number;
  monthlyInstallment: number;
  status: FinancingPlanStatus;
  appliedAt: string;
  landlordPaidAt?: string;
  installments: FinancingInstallment[];
}

export interface FinancingOverview {
  rentAmount: number;
  trustScore: number;
  propertyName: string;
  landlordName: string;
  applicationStatus: FinancingApplicationStatus;
  plan?: FinancingPlan;
}
