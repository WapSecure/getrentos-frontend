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
  /** What it paid for ("Rent for 2-Bed Apartment · Lekki Phase 1"), when known. */
  title?: string | null;
  /** When it was recorded as paid (ISO). */
  paidAt?: string | null;
  /** Card or bank fee the payer covered, whole naira. */
  fee?: number | null;
  /** Amount plus fee, whole naira. */
  totalCharged?: number | null;
}

/** The card or bank fee the payer covers on a payment. All kobo. */
export interface CheckoutFee {
  amountKobo: number;
  feeKobo: number;
  totalKobo: number;
}

/** A company that can take a payment. The payer chooses, so they can switch when one is down. */
export type PaymentProvider = 'PAYSTACK' | 'MONNIFY';

/** GET /payments/providers — one row per provider, in the order to offer them. */
export interface PaymentProviderOption {
  provider: PaymentProvider;
  /** "Paystack", "Monnify". */
  label: string;
  available: boolean;
  /** Why not, as a fragment that follows the label: "is switched off for now". */
  reason?: string;
}

/** `?provider=` for a pay route, or nothing when the payer has not chosen (the default company). */
export function providerQuery(provider?: PaymentProvider | null): string {
  return provider ? `?provider=${provider}` : '';
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
  /** The fee when `provider` takes it: fees differ per company. */
  providerFee: (amount: number, provider: PaymentProvider) =>
    apiFetch<CheckoutFee & { provider: PaymentProvider }>(
      `/payments/provider-fee?amount=${Math.round(amount)}&provider=${provider}`
    ),
  /** The companies that can take a payment, and whether each can right now. */
  providers: () => apiFetch<PaymentProviderOption[]>('/payments/providers'),
  /** Banks a payout can be sent to, by name and code. */
  banks: () => apiFetch<BankList>('/payments/banks'),
  /** The name on a bank account, shown before a payout account is saved. */
  resolveBankAccount: (input: { bankCode: string; accountNumber: string }) =>
    apiFetch<{ accountName: string }>('/payments/bank-accounts/resolve', {
      method: 'POST',
      body: input,
    }),
};
