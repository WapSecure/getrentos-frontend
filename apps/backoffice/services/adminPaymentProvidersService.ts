import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type PaymentProvider = 'PAYSTACK' | 'MONNIFY';

export interface PaymentProviderStatus {
  provider: PaymentProvider;
  label: string;
  available: boolean;
  reason?: string;
  enabled: boolean;
  note: string | null;
  updatedAt: string | null;
}

export const adminPaymentProvidersService = {
  list(): Promise<ApiResponse<PaymentProviderStatus[]>> {
    return safeCall(() => authFetch<PaymentProviderStatus[]>('/admin/payment-providers'));
  },
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
