import { apiFetch } from './client';
import type { Paginated } from './properties';
import { providerQuery, type PaymentProvider } from './paymentStatus';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'processing';
export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';

/** Matches web `paymentStatusBadges`: an unpaid charge that is not late is "Due", never "Pending", which would read as money already sent. */
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Due',
  overdue: 'Overdue',
  processing: 'Processing',
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, 'success' | 'neutral' | 'danger' | 'info'> =
  {
    paid: 'success',
    pending: 'neutral',
    overdue: 'danger',
    processing: 'info',
  };

export interface Payment {
  id: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  receiptUrl?: string;
  description: string;
  dueDate: string;
  escrowStatus: 'not_funded' | 'held' | 'pending_review' | 'released' | 'frozen';
  /** Present when a real payment gateway is configured — open in a browser to complete checkout. */
  authorizationUrl?: string;
  /** A checkout the tenant opened and closed, which they can go back to until `expiresAt`. */
  resumeCheckout?: { url: string; reference: string; expiresAt: string };
  reference?: string;
  disputeReason?: string;
  /** While the money is held, when it releases to the landlord automatically. */
  releaseDate?: string;
  outstanding?: number;
  /** Naira paid against this charge so far (part-payments and credit). */
  amountPaid?: number;
  /** Card or bank fee the payer covered on top of the charge, when the API knows it. */
  feeNaira?: number;
  /** Amount plus fee: what the payer was charged in all. Sent with `feeNaira`. */
  totalChargedNaira?: number;
  /** Naira Sureground is holding for this charge right now (0 once released). */
  heldAmountNaira?: number;
}

/** Account-wide payment figures, over every charge (not one page). */
export interface PaymentsSummary {
  amountOwedNaira: number;
  openCount: number;
  overdueCount: number;
  nextDueDate: string | null;
  totalPaidNaira: number;
  totalHeldNaira: number;
}

export interface PaymentsPage extends Paginated<Payment> {
  /** Older APIs leave it out. */
  summary?: PaymentsSummary;
}

export type ChargeCategory = 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY' | 'LATE_FEE';

export const CHARGE_CATEGORY_LABEL: Record<ChargeCategory, string> = {
  RENT: 'Rent',
  SERVICE_CHARGE: 'Service charge',
  DEPOSIT: 'Deposit',
  LEVY: 'Levy',
  LATE_FEE: 'Late fee',
};

export interface Receipt {
  id: string;
  paymentId: string;
  propertyName: string;
  amount: number;
  date: string;
  fileName: string;
  url: string;
  /** What the charge was for. Older APIs leave it out. */
  category?: ChargeCategory;
  /** The period billed, when the charge came from a rent schedule. */
  periodStart?: string;
  periodEnd?: string;
  reference?: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
}

export interface CreatePaymentMethodInput {
  type: SavedPaymentMethod['type'];
  name: string;
  last4?: string;
  expiry?: string;
}

export const PAYMENT_METHOD_TYPE_LABEL: Record<SavedPaymentMethod['type'], string> = {
  card: 'Card',
  bank: 'Bank account',
  wallet: 'Wallet',
};

export const paymentsApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch<PaymentsPage>(`/renter/payments?page=${page}&pageSize=${pageSize}`),

  listReceipts: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<Receipt>>(`/renter/payments/receipts?page=${page}&pageSize=${pageSize}`),

  /** `provider` names the company that takes it (Paystack or Monnify); omitted, the default one. */
  payNow: (id: string, method?: PaymentMethod, amount?: number, provider?: PaymentProvider) =>
    apiFetch<Payment>(`/renter/payments/${id}/pay${providerQuery(provider)}`, {
      method: 'POST',
      body: amount ? { method, amount } : { method },
    }),

  dispute: (id: string, reason: string) =>
    apiFetch<Payment>(`/renter/payments/${id}/dispute`, { method: 'POST', body: { reason } }),

  /** Step-up is handled by the API client. */
  confirmMoveIn: (id: string) =>
    apiFetch<Payment>(`/renter/payments/${id}/confirm-move-in`, { method: 'POST' }),

  listMethods: () => apiFetch<SavedPaymentMethod[]>('/renter/payments/methods'),

  addMethod: (input: CreatePaymentMethodInput) =>
    apiFetch<SavedPaymentMethod>('/renter/payments/methods', { method: 'POST', body: input }),

  setDefaultMethod: (id: string) =>
    apiFetch<SavedPaymentMethod>(`/renter/payments/methods/${id}/default`, { method: 'PATCH' }),

  removeMethod: (id: string) =>
    apiFetch<void>(`/renter/payments/methods/${id}`, { method: 'DELETE' }),
};
