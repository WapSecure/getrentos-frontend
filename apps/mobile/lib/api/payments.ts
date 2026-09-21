import { apiFetch } from './client';
import type { Paginated } from './properties';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'processing';
export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Due',
  overdue: 'Overdue',
  processing: 'Processing',
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'info'> =
  {
    paid: 'success',
    pending: 'warning',
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
  escrowStatus: 'held' | 'released' | 'pending';
  /** Present when a real payment gateway is configured — open in a browser to complete checkout. */
  authorizationUrl?: string;
  reference?: string;
  /** Present once this payment has been disputed and is under review. */
  disputeReason?: string;
}

export interface Receipt {
  id: string;
  paymentId: string;
  propertyName: string;
  amount: number;
  date: string;
  fileName: string;
  url: string;
}

/** A card, bank account or wallet the renter has saved for rent payments. */
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
    apiFetch<Paginated<Payment>>(`/renter/payments?page=${page}&pageSize=${pageSize}`),

  listReceipts: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<Receipt>>(`/renter/payments/receipts?page=${page}&pageSize=${pageSize}`),

  payNow: (id: string, method?: PaymentMethod) =>
    apiFetch<Payment>(`/renter/payments/${id}/pay`, { method: 'POST', body: { method } }),

  dispute: (id: string, reason: string) =>
    apiFetch<Payment>(`/renter/payments/${id}/dispute`, { method: 'POST', body: { reason } }),

  listMethods: () => apiFetch<SavedPaymentMethod[]>('/renter/payments/methods'),

  addMethod: (input: CreatePaymentMethodInput) =>
    apiFetch<SavedPaymentMethod>('/renter/payments/methods', { method: 'POST', body: input }),

  setDefaultMethod: (id: string) =>
    apiFetch<SavedPaymentMethod>(`/renter/payments/methods/${id}/default`, { method: 'PATCH' }),

  removeMethod: (id: string) =>
    apiFetch<void>(`/renter/payments/methods/${id}`, { method: 'DELETE' }),
};
