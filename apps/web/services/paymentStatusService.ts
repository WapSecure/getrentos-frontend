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
