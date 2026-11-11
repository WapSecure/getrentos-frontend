import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { InspectionFocus, PrePurchaseInspection } from '@/types/prePurchaseInspection';
import type { TourScope } from '@/types/siteTour';

const post = <T>(path: string, body?: unknown) =>
  authFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

/** `land`: the land routes, behind the land rollout. `all`: the general routes, built homes too. */
const base = (scope: TourScope) =>
  scope === 'land' ? '/buyer/land/inspections' : '/buyer/inspections';

const path = (scope: TourScope, id: string) => `${base(scope)}/${encodeURIComponent(id)}`;

export const prePurchaseInspectionKeys = {
  mine: (scope: TourScope) => ['pre-purchase-inspections', scope] as const,
};

export const prePurchaseInspectionService = {
  mine: (scope: TourScope) => safeCall(() => authFetch<PrePurchaseInspection[]>(base(scope))),

  request: (
    scope: TourScope,
    input: {
      listingId?: string;
      plotId?: string;
      focus: InspectionFocus[];
      notes?: string;
    }
  ) =>
    safeCall(() =>
      post<PrePurchaseInspection>(base(scope), {
        ...(input.listingId ? { listingId: input.listingId } : {}),
        ...(input.plotId ? { plotId: input.plotId } : {}),
        focus: input.focus,
        ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
        acknowledgedNotASearch: true,
      })
    ),

  ask: (scope: TourScope, id: string, text: string) =>
    safeCall(() =>
      post<PrePurchaseInspection>(`${path(scope, id)}/questions`, { text: text.trim() })
    ),

  reinspect: (scope: TourScope, id: string, reason: string) =>
    safeCall(() =>
      post<PrePurchaseInspection>(`${path(scope, id)}/reinspection`, { reason: reason.trim() })
    ),
};
