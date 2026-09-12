import { authFetch, safeCall, toQuery, type ApiResponse } from '@getrentos/shared';

export type AdminSearchType =
  | 'users'
  | 'properties'
  | 'listings'
  | 'payments'
  | 'disputes'
  | 'bookings'
  | 'work-orders'
  | 'estates';
export interface AdminSearchResult {
  id: string;
  type: AdminSearchType;
  title: string;
  subtitle: string;
  href: string;
}
export interface AdminSearchResponse {
  results: AdminSearchResult[];
  availableTypes: AdminSearchType[];
}

export const adminSearchService = {
  search(q: string, type?: AdminSearchType): Promise<ApiResponse<AdminSearchResponse>> {
    return safeCall(() => authFetch<AdminSearchResponse>(`/admin/search${toQuery({ q, type })}`));
  },
};
