import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type {
  MaintenanceTriage,
  MaintenanceTriageDecision,
  MaintenanceTriageDecisionResult,
} from '@/types/maintenance';

/**
 * The maintenance-triage copilot, for anyone who controls the property: the
 * landlord or owner, or a property manager acting under a mandate. The server
 * checks authority on every call.
 */
export const maintenanceTriageService = {
  triage: (requestId: string): Promise<ApiResponse<MaintenanceTriage>> =>
    safeCall(() => authFetch(`/ai/maintenance/${requestId}/triage`, { method: 'POST' })),

  decide: (
    requestId: string,
    reviewId: string,
    decision: MaintenanceTriageDecision
  ): Promise<ApiResponse<MaintenanceTriageDecisionResult>> =>
    safeCall(() =>
      authFetch(`/ai/maintenance/${requestId}/triage/decision`, {
        method: 'POST',
        body: JSON.stringify({ reviewId, ...decision }),
      })
    ),
};
