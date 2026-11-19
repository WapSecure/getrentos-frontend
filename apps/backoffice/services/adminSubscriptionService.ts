import { authFetch, safeCall, toQuery } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';
import type { Paginated } from './adminService';
import type {
  AdminSubscription,
  AdminSubscriptionInvoice,
  AdminSubscriptionOverview,
  AdminEstateSubscription,
  AdminEstateSubscriptionOverview,
  AdminOrganizationPlan,
  EnterpriseLead,
  EnterpriseLeadStatus,
  SetOrganizationPlanInput,
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

  getEstateOverview: (): Promise<ApiResponse<AdminEstateSubscriptionOverview>> =>
    safeCall(() =>
      authFetch<AdminEstateSubscriptionOverview>('/admin/estate-subscriptions/overview')
    ),

  listEstates: (
    params: SubscriptionQuery = {}
  ): Promise<ApiResponse<Paginated<AdminEstateSubscription>>> =>
    safeCall(() =>
      authFetch<Paginated<AdminEstateSubscription>>(
        `/admin/estate-subscriptions${toQuery({
          search: params.search,
          status: params.status,
          page: params.page,
          pageSize: params.pageSize,
        })}`
      )
    ),

  listEstateInvoices: (
    estateId: string,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<AdminSubscriptionInvoice>>> =>
    safeCall(() =>
      authFetch<Paginated<AdminSubscriptionInvoice>>(
        `/admin/estate-subscriptions/${estateId}/invoices${toQuery({
          page: params.page,
          pageSize: params.pageSize,
        })}`
      )
    ),

  getOrganizationPlan: (organizationId: string): Promise<ApiResponse<AdminOrganizationPlan>> =>
    safeCall(() => authFetch<AdminOrganizationPlan>(`/admin/organizations/${organizationId}/plan`)),

  setOrganizationPlan: (
    organizationId: string,
    input: SetOrganizationPlanInput
  ): Promise<ApiResponse<AdminOrganizationPlan>> =>
    safeCall(() =>
      authFetch<AdminOrganizationPlan>(`/admin/organizations/${organizationId}/plan`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    ),

  listEnterpriseLeads: (status?: EnterpriseLeadStatus): Promise<ApiResponse<EnterpriseLead[]>> =>
    safeCall(() => authFetch<EnterpriseLead[]>(`/admin/enterprise-leads${toQuery({ status })}`)),

  updateEnterpriseLead: (
    id: string,
    input: { status?: EnterpriseLeadStatus; notes?: string }
  ): Promise<ApiResponse<EnterpriseLead>> =>
    safeCall(() =>
      authFetch<EnterpriseLead>(`/admin/enterprise-leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    ),
};
