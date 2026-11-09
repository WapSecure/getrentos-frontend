import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type PaymentEventStatus = 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'IGNORED';

export interface PaymentEvent {
  id: string;
  provider: string;
  event: string;
  reference: string | null;
  status: PaymentEventStatus;
  deliveries: number;
  attempts: number;
  lastError: string | null;
  receivedAt: string;
  processedAt: string | null;
}

export interface PaymentEventPage {
  items: PaymentEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminPaymentEventsService = {
  list(filter: {
    status: PaymentEventStatus | 'ALL';
    reference?: string;
    page: number;
    pageSize: number;
  }): Promise<ApiResponse<PaymentEventPage>> {
    const params = new URLSearchParams({
      status: filter.status,
      page: String(filter.page),
      pageSize: String(filter.pageSize),
      ...(filter.reference ? { reference: filter.reference } : {}),
    });
    return safeCall(() =>
      authFetch<PaymentEventPage>(`/admin/payment-events?${params.toString()}`)
    );
  },
  replay(id: string): Promise<ApiResponse<PaymentEvent>> {
    return safeCall(() =>
      authFetch<PaymentEvent>(`/admin/payment-events/${id}/replay`, { method: 'POST' })
    );
  },
};
