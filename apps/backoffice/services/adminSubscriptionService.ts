import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from './adminService';
import type { AdminSubscription, AdminSubscriptionOverview } from '@/types/subscription';

export interface SubscriptionQuery {
  /** Customer email or name — the handle support actually has. */
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
};
