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
  PreventivePlanStatus,
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

export interface MaintenanceConfigurationOptions {
  landlords: { id: string; legalName: string; email: string }[];
  properties: {
    id: string;
    title: string;
    city: string;
    state: string;
    units: { id: string; unitName: string }[];
    homeAssets: { id: string; name: string }[];
  }[];
  vendors: { id: string; name: string; serviceType: string; phone: string }[];
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
const patch = <T>(path: string, body: unknown): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(`/admin/maintenance/${path}`, { method: 'PATCH', body: JSON.stringify(body) })
  );

/** Backoffice maintenance/vendor/SLA oversight (work orders → invoices). */
export const adminMaintenanceService = {
  overview(): Promise<ApiResponse<AdminMaintenanceOverview>> {
    return safeCall(() => authFetch<AdminMaintenanceOverview>('/admin/maintenance/overview'));
  },
  configurationOptions(): Promise<ApiResponse<MaintenanceConfigurationOptions>> {
    return safeCall(() =>
      authFetch<MaintenanceConfigurationOptions>('/admin/maintenance/configuration-options')
    );
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
  assignWorkOrder(
    id: string,
    vendorId: string,
    reason?: string
  ): Promise<ApiResponse<AdminWorkOrder>> {
    return patch(`work-orders/${id}/assignment`, { vendorId, reason });
  },
  updateWorkOrderStatus(
    id: string,
    status: string,
    reason: string
  ): Promise<ApiResponse<AdminWorkOrder>> {
    return patch(`work-orders/${id}/status`, { status, reason });
  },
  decideQuote(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ): Promise<ApiResponse<AdminVendorQuote>> {
    return post(`quotes/${id}/decision`, { status, reason });
  },
  decideInvoice(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'VOID',
    reason: string
  ): Promise<ApiResponse<AdminVendorInvoice>> {
    return post(`invoices/${id}/decision`, { status, reason });
  },
  createVendor(input: { landlordId: string; name: string; serviceType: string; phone: string }) {
    return post<AdminVendor>('vendors', input);
  },
  updateVendor(
    id: string,
    input: {
      name?: string;
      serviceType?: string;
      phone?: string;
      isActive?: boolean;
      reason: string;
    }
  ) {
    return patch<AdminVendor>(`vendors/${id}`, input);
  },
  createSlaPolicy(input: {
    propertyId: string;
    priority: string;
    responseTargetMinutes: number;
    resolutionTargetMinutes: number;
    escalationTargetMinutes: number;
    emergencyRoutingEnabled: boolean;
  }) {
    return post<AdminSlaPolicy>('sla-policies', input);
  },
  updateSlaPolicy(
    id: string,
    input: {
      responseTargetMinutes?: number;
      resolutionTargetMinutes?: number;
      escalationTargetMinutes?: number;
      emergencyRoutingEnabled?: boolean;
      isActive?: boolean;
      reason: string;
    }
  ) {
    return patch<AdminSlaPolicy>(`sla-policies/${id}`, input);
  },
  updatePreventivePlan(
    id: string,
    input: {
      assignedVendorId?: string;
      title?: string;
      category?: string;
      frequencyDays?: number;
      nextDueAt?: string;
      status?: PreventivePlanStatus;
      reason: string;
    }
  ) {
    return patch<AdminPreventivePlan>(`preventive-plans/${id}`, input);
  },
  createPreventivePlan(input: {
    propertyId: string;
    unitId?: string;
    assetId?: string;
    assignedVendorId?: string;
    title: string;
    category: string;
    frequencyDays: number;
    nextDueAt: string;
  }) {
    return post<AdminPreventivePlan>('preventive-plans', input);
  },
  completePreventivePlan(id: string, reason: string, nextDueAt?: string) {
    return post<AdminPreventivePlan>(`preventive-plans/${id}/complete`, { reason, nextDueAt });
  },
};
