import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type {
  AdminMaintenanceOverview,
  AdminPreventivePlan,
  AdminSlaPolicy,
  AdminVendor,
  AdminVendorInvoice,
  AdminVendorQuote,
  AdminWorkOrder,
} from '@/types/maintenance';

export interface MaintenanceQuery {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  isEmergency?: boolean;
  isActive?: boolean;
  due?: boolean;
  page?: number;
  pageSize?: number;
}

const listResource = <T>(
  resource: string,
  params: MaintenanceQuery = {}
): Promise<ApiResponse<Paginated<T>>> => {
  const query = toQuery({
    search: params.search,
    status: params.status,
    priority: params.priority,
    category: params.category,
    isEmergency: params.isEmergency,
    isActive: params.isActive,
    due: params.due,
    page: params.page,
    pageSize: params.pageSize,
  });
  return safeCall(() => authFetch<Paginated<T>>(`/admin/maintenance/${resource}${query}`));
};

const post = <T>(path: string, body?: unknown): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(`/admin/maintenance/${path}`, {
      method: 'POST',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  );

/** Backoffice maintenance/vendor/SLA oversight (work orders → invoices). */
export const adminMaintenanceService = {
  overview(): Promise<ApiResponse<AdminMaintenanceOverview>> {
    return safeCall(() => authFetch<AdminMaintenanceOverview>('/admin/maintenance/overview'));
  },

  listWorkOrders(params: MaintenanceQuery = {}): Promise<ApiResponse<Paginated<AdminWorkOrder>>> {
    return listResource<AdminWorkOrder>('work-orders', params);
  },

  listSlaPolicies(params: MaintenanceQuery = {}): Promise<ApiResponse<Paginated<AdminSlaPolicy>>> {
    return listResource<AdminSlaPolicy>('sla-policies', params);
  },

  listPreventivePlans(
    params: MaintenanceQuery = {}
  ): Promise<ApiResponse<Paginated<AdminPreventivePlan>>> {
    return listResource<AdminPreventivePlan>('preventive-plans', params);
  },

  listVendors(params: MaintenanceQuery = {}): Promise<ApiResponse<Paginated<AdminVendor>>> {
    return listResource<AdminVendor>('vendors', params);
  },

  listVendorQuotes(
    params: MaintenanceQuery = {}
  ): Promise<ApiResponse<Paginated<AdminVendorQuote>>> {
    return listResource<AdminVendorQuote>('quotes', params);
  },

  listVendorInvoices(
    params: MaintenanceQuery = {}
  ): Promise<ApiResponse<Paginated<AdminVendorInvoice>>> {
    return listResource<AdminVendorInvoice>('invoices', params);
  },

  runSlaScan(): Promise<ApiResponse<{ notified: number }>> {
    return post<{ notified: number }>('sla/scan');
  },
};
