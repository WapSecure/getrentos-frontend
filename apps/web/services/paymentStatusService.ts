import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { PaymentStatus } from '@/types/payments';

/** The state of one of the signed-in user's payments, for the page Paystack returns them to. */
export function getPaymentStatus(reference: string): Promise<ApiResponse<PaymentStatus>> {
  return safeCall(() =>
    authFetch<PaymentStatus>(`/payments/${encodeURIComponent(reference)}/status`)
  );
}

/** The card or bank fee added to a payment of `amount` whole naira. All figures in kobo. */
export interface CheckoutFee {
  amountKobo: number;
  feeKobo: number;
  totalKobo: number;
}

export function getCheckoutFee(amount: number): Promise<ApiResponse<CheckoutFee>> {
  return safeCall(() =>
    authFetch<CheckoutFee>(`/payments/checkout-fee?amount=${Math.round(amount)}`)
  );
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
