export type RentPaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'PROCESSING';
export type RentEscrowStatus = 'HELD' | 'PENDING_REVIEW' | 'RELEASED' | 'FROZEN';
export type RentPaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'WALLET';
export type RentChargeCategory = 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY';
export type RentBillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type OwnerStatementStatus = 'DRAFT' | 'ISSUED';
export type ExpenseCategory =
  | 'UTILITIES'
  | 'INSURANCE'
  | 'TAX'
  | 'REPAIRS'
  | 'MANAGEMENT_FEE'
  | 'OTHER';

export interface AdminRentFinanceOverview {
  totalPayments: number;
  collectedCount: number;
  collectedAmount: number;
  heldEscrowCount: number;
  heldEscrowAmount: number;
  dueForSettlementCount: number;
  dueForSettlementAmount: number;
  pendingReviewCount: number;
  pendingReviewAmount: number;
  frozenCount: number;
  frozenAmount: number;
  releasedCount: number;
  releasedAmount: number;
  arrearsCount: number;
  arrearsAmount: number;
}

export interface AdminRentPayment {
  id: string;
  leaseId: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  unitId: string;
  unitName: string;
  tenantId: string | null;
  tenantName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: RentPaymentStatus;
  escrowStatus: RentEscrowStatus;
  releaseDate: string | null;
  disputeReason: string | null;
  method: RentPaymentMethod | null;
  providerReference: string | null;
  category: RentChargeCategory;
  billingCycle: RentBillingCycle;
  createdAt: string;
  isArrears: boolean;
}

export interface AdminOwnerStatementLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface AdminOwnerStatement {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  periodStart: string;
  periodEnd: string;
  grossIncome: number;
  totalExpenses: number;
  managementFee: number;
  netPayout: number;
  status: OwnerStatementStatus;
  generatedAt: string;
  issuedAt: string | null;
}

export interface AdminOwnerStatementDetail extends AdminOwnerStatement {
  lineItems: AdminOwnerStatementLineItem[];
}

export interface AdminPayoutAccount {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordEmail: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  verified: boolean;
  complete: boolean;
  updatedAt: string;
}

export interface AdminExpense {
  id: string;
  propertyId: string;
  propertyTitle: string;
  city: string | null;
  ownerId: string | null;
  ownerName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  incurredAt: string;
  note: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
}
