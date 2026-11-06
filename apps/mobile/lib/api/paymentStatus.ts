import { apiFetch } from './client';

/** PENDING means not confirmed yet, never failed. */
export type PaymentState = 'PENDING' | 'PAID' | 'FAILED';

/** GET /payments/:reference/status — answered from GetRentos records; while pending, Paystack is asked too. */
export interface PaymentStatus {
  reference: string;
  kind: 'RENT' | 'ESCROW' | 'SHORTLET' | 'LAND' | 'FLEX' | 'DUE' | 'VENDOR_TOP_UP';
  status: PaymentState;
  /** Whole naira. */
  amount: number;
  returnPath: string | null;
}

/** The card or bank fee the payer covers on a payment. All kobo. */
export interface CheckoutFee {
  amountKobo: number;
  feeKobo: number;
  totalKobo: number;
}

export const paymentStatusApi = {
  get: (reference: string) =>
    apiFetch<PaymentStatus>(`/payments/${encodeURIComponent(reference)}/status`),
  checkoutFee: (amount: number) =>
    apiFetch<CheckoutFee>(`/payments/checkout-fee?amount=${Math.round(amount)}`),
};
