import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { PaymentProvider, PaymentProviderOption, PaymentStatus } from '@/types/payments';

export function getPaymentStatus(reference: string): Promise<ApiResponse<PaymentStatus>> {
  return safeCall(() =>
    authFetch<PaymentStatus>(`/payments/${encodeURIComponent(reference)}/status`)
  );
}

/**
 * Whole naira go as `amount`, which every API version takes; an amount with kobo goes as
 * `amountKobo`.
 */
function feeAmountQuery(amount: number): string {
  const kobo = Math.round(amount * 100);
  return kobo % 100 === 0 ? `amount=${kobo / 100}` : `amountKobo=${kobo}`;
}

/** `amount` is naira (kobo allowed); all returned figures are in kobo. */
export interface CheckoutFee {
  amountKobo: number;
  feeKobo: number;
  totalKobo: number;
}

export function getCheckoutFee(amount: number): Promise<ApiResponse<CheckoutFee>> {
  return safeCall(() => authFetch<CheckoutFee>(`/payments/checkout-fee?${feeAmountQuery(amount)}`));
}

/** `amount` is naira (kobo allowed); all returned figures are in kobo. */
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

export function getPaymentProviders(): Promise<ApiResponse<PaymentProviderOption[]>> {
  return safeCall(() => authFetch<PaymentProviderOption[]>('/payments/providers'));
}

/** Nothing when the payer has not chosen (the default company). */
export function providerQuery(provider?: PaymentProvider | null): string {
  return provider ? `?provider=${provider}` : '';
}

export interface Bank {
  code: string;
  name: string;
}

export function getBanks(): Promise<
  ApiResponse<{ banks: Bank[]; source: 'paystack' | 'fallback' }>
> {
  return safeCall(() =>
    authFetch<{ banks: Bank[]; source: 'paystack' | 'fallback' }>('/payments/banks')
  );
}

/** Shown before a payout account is saved. */
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
