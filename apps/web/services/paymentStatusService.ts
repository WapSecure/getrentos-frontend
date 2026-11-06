import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { PaymentStatus } from '@/types/payments';

/** The state of one of the signed-in user's payments, for the page Paystack returns them to. */
export function getPaymentStatus(reference: string): Promise<ApiResponse<PaymentStatus>> {
  return safeCall(() =>
    authFetch<PaymentStatus>(`/payments/${encodeURIComponent(reference)}/status`)
  );
}
