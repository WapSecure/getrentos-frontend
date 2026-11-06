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

/** A bank a payout can be sent to: its Paystack code (leading zeros kept) and name. */
export interface Bank {
  code: string;
  name: string;
}

/** GET /payments/banks — sorted by name; `fallback` when Paystack could not be asked. */
export interface BankList {
  banks: Bank[];
  source: 'paystack' | 'fallback';
}

export const paymentStatusApi = {
  get: (reference: string) =>
    apiFetch<PaymentStatus>(`/payments/${encodeURIComponent(reference)}/status`),
  checkoutFee: (amount: number) =>
    apiFetch<CheckoutFee>(`/payments/checkout-fee?amount=${Math.round(amount)}`),
  /** Banks a payout can be sent to, by name and code. */
  banks: () => apiFetch<BankList>('/payments/banks'),
  /** The name on a bank account, shown before a payout account is saved. */
  resolveBankAccount: (input: { bankCode: string; accountNumber: string }) =>
    apiFetch<{ accountName: string }>('/payments/bank-accounts/resolve', {
      method: 'POST',
      body: input,
    }),
};
