import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type PaymentProvider = 'PAYSTACK' | 'MONNIFY';

/** One company Sureground collects through, and whether payers can use it now. */
export interface PaymentProviderStatus {
  provider: PaymentProvider;
  label: string;
  /** Payers can choose it right now: set up, switched on, and not failing. */
  available: boolean;
  /** Why not, as payers are told ("is switched off for now"). */
  reason?: string;
  /** Finance's switch. */
  enabled: boolean;
  note: string | null;
  updatedAt: string | null;
}

export const adminPaymentProvidersService = {
  list(): Promise<ApiResponse<PaymentProviderStatus[]>> {
    return safeCall(() => authFetch<PaymentProviderStatus[]>('/admin/payment-providers'));
  },
  /** Needs step-up; the shared dialog asks for it. */
  set(
    provider: PaymentProvider,
    enabled: boolean,
    note?: string
  ): Promise<ApiResponse<PaymentProviderStatus[]>> {
    return safeCall(() =>
      authFetch<PaymentProviderStatus[]>(`/admin/payment-providers/${provider}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled, ...(note ? { note } : {}) }),
      })
    );
  },
};
