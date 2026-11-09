import { apiFetch } from './client';

/** PENDING means not confirmed yet, never failed. */
export type PaymentState = 'PENDING' | 'PAID' | 'FAILED';

/** Answered from Sureground records; while pending, Paystack is asked too. */
export interface PaymentStatus {
  reference: string;
  kind: 'RENT' | 'ESCROW' | 'SHORTLET' | 'LAND' | 'FLEX' | 'DUE' | 'VENDOR_TOP_UP';
  status: PaymentState;
  /** Whole naira. */
  amount: number;
  returnPath: string | null;
  title?: string | null;
  /** When it was recorded as paid (ISO). */
  paidAt?: string | null;
  /** Card or bank fee the payer covered, whole naira. */
  fee?: number | null;
  /** Amount plus fee, whole naira. */
  totalCharged?: number | null;
}

/** All kobo. */
export interface CheckoutFee {
  amountKobo: number;
  feeKobo: number;
  totalKobo: number;
}

export type PaymentProvider = 'PAYSTACK' | 'MONNIFY';

/** One row per provider, in the order to offer them. */
export interface PaymentProviderOption {
  provider: PaymentProvider;
  label: string;
  available: boolean;
  /** A fragment that follows the label: "is switched off for now". */
  reason?: string;
}

/** Nothing when the payer has not chosen (the default company). */
export function providerQuery(provider?: PaymentProvider | null): string {
  return provider ? `?provider=${provider}` : '';
}

/** Its Paystack code keeps leading zeros. */
export interface Bank {
  code: string;
  name: string;
}

/** Sorted by name; `fallback` when Paystack could not be asked. */
export interface BankList {
  banks: Bank[];
  source: 'paystack' | 'fallback';
}

/**
 * The amount a fee lookup is for. Whole naira go as `amount`, which every
 * version of the API takes; an amount with kobo goes as `amountKobo`.
 */
function feeAmountQuery(amount: number): string {
  const kobo = Math.round(amount * 100);
  return kobo % 100 === 0 ? `amount=${kobo / 100}` : `amountKobo=${kobo}`;
}

export const paymentStatusApi = {
  get: (reference: string) =>
    apiFetch<PaymentStatus>(`/payments/${encodeURIComponent(reference)}/status`),
  checkoutFee: (amount: number) =>
    apiFetch<CheckoutFee>(`/payments/checkout-fee?${feeAmountQuery(amount)}`),
  providerFee: (amount: number, provider: PaymentProvider) =>
    apiFetch<CheckoutFee & { provider: PaymentProvider }>(
      `/payments/provider-fee?${feeAmountQuery(amount)}&provider=${provider}`
    ),
  providers: () => apiFetch<PaymentProviderOption[]>('/payments/providers'),
  banks: () => apiFetch<BankList>('/payments/banks'),
  resolveBankAccount: (input: { bankCode: string; accountNumber: string }) =>
    apiFetch<{ accountName: string }>('/payments/bank-accounts/resolve', {
      method: 'POST',
      body: input,
    }),
};
