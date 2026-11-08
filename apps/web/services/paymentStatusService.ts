import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { PaymentProvider, PaymentProviderOption, PaymentStatus } from '@/types/payments';

/** The state of one of the signed-in user's payments, for the page Paystack returns them to. */
export function getPaymentStatus(reference: string): Promise<ApiResponse<PaymentStatus>> {
  return safeCall(() =>
    authFetch<PaymentStatus>(`/payments/${encodeURIComponent(reference)}/status`)
  );
}

/**
 * The amount a fee lookup is for. Whole naira go as `amount`, which every
 * version of the API takes; an amount with kobo goes as `amountKobo`.
 */
function feeAmountQuery(amount: number): string {
  const kobo = Math.round(amount * 100);
  return kobo % 100 === 0 ? `amount=${kobo / 100}` : `amountKobo=${kobo}`;
}

/** The card or bank fee added to a payment of `amount` naira (kobo allowed). All figures in kobo. */
export interface CheckoutFee {
  amountKobo: number;
  feeKobo: number;
  totalKobo: number;
}

export function getCheckoutFee(amount: number): Promise<ApiResponse<CheckoutFee>> {
  return safeCall(() => authFetch<CheckoutFee>(`/payments/checkout-fee?${feeAmountQuery(amount)}`));
}

/** The fee on a payment of `amount` naira (kobo allowed) when `provider` takes it. All figures in kobo. */
export function getProviderFee(
  amount: number,
  provider: PaymentProvider
): Promise<ApiResponse<CheckoutFee & { provider: PaymentProvider }>> {
  return safeCall(() =>
    authFetch<CheckoutFee & { provider: PaymentProvider }>(
      `/payments/provider-fee?${feeAmountQuery(amount)}&provider=${provider}`
    )
  );
}

/** The companies that can take a payment, and whether each can right now. */
export function getPaymentProviders(): Promise<ApiResponse<PaymentProviderOption[]>> {
  return safeCall(() => authFetch<PaymentProviderOption[]>('/payments/providers'));
}

/** `?provider=` for a pay route, or nothing when the payer has not chosen (the default company). */
export function providerQuery(provider?: PaymentProvider | null): string {
  return provider ? `?provider=${provider}` : '';
}

export interface Bank {
  code: string;
  name: string;
}

/** Banks a payout can be sent to, by name and Paystack code. */
export function getBanks(): Promise<
  ApiResponse<{ banks: Bank[]; source: 'paystack' | 'fallback' }>
> {
  return safeCall(() =>
    authFetch<{ banks: Bank[]; source: 'paystack' | 'fallback' }>('/payments/banks')
  );
}

/** The name on a bank account, shown before a payout account is saved. */
export function resolveBankAccount(data: {
  bankCode: string;
  accountNumber: string;
}): Promise<ApiResponse<{ accountName: string }>> {
  return safeCall(() =>
    authFetch<{ accountName: string }>('/payments/bank-accounts/resolve', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  );
}
