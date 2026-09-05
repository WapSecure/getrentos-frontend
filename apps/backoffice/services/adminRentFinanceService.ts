import { authDownload, authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type {
  AdminExpense,
  AdminOwnerStatement,
  AdminPayoutAccount,
  AdminRentFinanceOverview,
  AdminRentPayment,
} from '@/types/rentFinance';

export interface RentFinanceQuery {
  search?: string;
  status?: string;
  escrowStatus?: string;
  category?: string;
  verified?: boolean;
  page?: number;
  pageSize?: number;
}

const listResource = <T>(
  resource: string,
  params: RentFinanceQuery = {}
): Promise<ApiResponse<Paginated<T>>> => {
  const query = toQuery({
    search: params.search,
    status: params.status,
    escrowStatus: params.escrowStatus,
    category: params.category,
    verified: params.verified,
    page: params.page,
    pageSize: params.pageSize,
  });
  return safeCall(() => authFetch<Paginated<T>>(`/admin/rent-finance/${resource}${query}`));
};

const post = <T>(path: string, body?: unknown): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(`/admin/rent-finance/${path}`, {
      method: 'POST',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  );

const download = (resource: string, params: RentFinanceQuery = {}): Promise<Blob> =>
  authDownload(
    `/admin/rent-finance/export/${resource}${toQuery({
      search: params.search,
      status: params.status,
      escrowStatus: params.escrowStatus,
      category: params.category,
      verified: params.verified,
      page: params.page,
      pageSize: params.pageSize,
    })}`
  );

/** Backoffice finance oversight for the long-term rental money flow. */
export const adminRentFinanceService = {
  overview(): Promise<ApiResponse<AdminRentFinanceOverview>> {
    return safeCall(() => authFetch<AdminRentFinanceOverview>('/admin/rent-finance/overview'));
  },

  listPayments(params: RentFinanceQuery = {}): Promise<ApiResponse<Paginated<AdminRentPayment>>> {
    return listResource<AdminRentPayment>('payments', params);
  },
  flagPayment(paymentId: string, reason?: string): Promise<ApiResponse<AdminRentPayment>> {
    return post<AdminRentPayment>(`payments/${paymentId}/flag`, reason ? { reason } : undefined);
  },
  unflagPayment(paymentId: string): Promise<ApiResponse<AdminRentPayment>> {
    return post<AdminRentPayment>(`payments/${paymentId}/unflag`);
  },
  releasePayment(paymentId: string): Promise<ApiResponse<AdminRentPayment>> {
    return post<AdminRentPayment>(`payments/${paymentId}/release`);
  },

  listArrears(params: RentFinanceQuery = {}): Promise<ApiResponse<Paginated<AdminRentPayment>>> {
    return listResource<AdminRentPayment>('arrears', params);
  },

  listStatements(
    params: RentFinanceQuery = {}
  ): Promise<ApiResponse<Paginated<AdminOwnerStatement>>> {
    return listResource<AdminOwnerStatement>('statements', params);
  },

  listPayoutAccounts(
    params: RentFinanceQuery = {}
  ): Promise<ApiResponse<Paginated<AdminPayoutAccount>>> {
    return listResource<AdminPayoutAccount>('payout-accounts', params);
  },

  listExpenses(params: RentFinanceQuery = {}): Promise<ApiResponse<Paginated<AdminExpense>>> {
    return listResource<AdminExpense>('expenses', params);
  },

  exportPayments(params: RentFinanceQuery = {}): Promise<Blob> {
    return download('payments', params);
  },
  exportArrears(params: RentFinanceQuery = {}): Promise<Blob> {
    return download('arrears', params);
  },
  exportStatements(params: RentFinanceQuery = {}): Promise<Blob> {
    return download('statements', params);
  },
  exportPayoutAccounts(params: RentFinanceQuery = {}): Promise<Blob> {
    return download('payout-accounts', params);
  },
  exportExpenses(params: RentFinanceQuery = {}): Promise<Blob> {
    return download('expenses', params);
  },
};
