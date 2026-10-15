import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export interface AdminManagementTransfer {
  id: string;
  propertyId: string;
  propertyName: string;
  status: 'OPEN' | 'SWITCHED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  effectiveAt: string;
  reason: string | null;
  outgoing: { mandateId: string; manager: string; status: string } | null;
  incoming: { manager: string; mandateId: string | null; status: string | null; ready: boolean };
  acknowledgedItems: { kind: string; id: string; label: string }[];
  switchLog: { step: string; ok: boolean; note: string }[];
  createdAt: string;
  switchedAt: string | null;
}

export const adminManagementTransfersService = {
  list: (): Promise<ApiResponse<AdminManagementTransfer[]>> =>
    safeCall(() => authFetch<AdminManagementTransfer[]>('/admin/management-transfers')),
  switchNow: (id: string): Promise<ApiResponse<AdminManagementTransfer>> =>
    safeCall(() =>
      authFetch<AdminManagementTransfer>(`/admin/management-transfers/${id}/switch`, {
        method: 'POST',
      })
    ),
};
