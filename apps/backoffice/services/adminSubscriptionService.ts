import { authFetch, safeCall, toQuery } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';
import type { Paginated } from './adminService';
import type {
  AdminSubscription,
  AdminSubscriptionInvoice,
  AdminSubscriptionOverview,
} from '@/types/subscription';

export interface SubscriptionQuery {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const adminSubscriptionService = {
  getOverview: (): Promise<ApiResponse<AdminSubscriptionOverview>> =>
    safeCall(() => authFetch<AdminSubscriptionOverview>('/admin/subscriptions/overview')),

  list: (params: SubscriptionQuery = {}): Promise<ApiResponse<Paginated<AdminSubscription>>> =>
    safeCall(() =>
      authFetch<Paginated<AdminSubscription>>(
        `/admin/subscriptions${toQuery({
          search: params.search,
          status: params.status,
          page: params.page,
          pageSize: params.pageSize,
        })}`
      )
    ),

  listInvoices: (
    userId: string,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<AdminSubscriptionInvoice>>> =>
    safeCall(() =>
      authFetch<Paginated<AdminSubscriptionInvoice>>(
        `/admin/subscriptions/${userId}/invoices${toQuery({
          page: params.page,
          pageSize: params.pageSize,
        })}`
      )
    ),
};
