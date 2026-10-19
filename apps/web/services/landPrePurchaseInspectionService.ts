import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { InspectionFocus, PrePurchaseInspection } from '@/types/landPrePurchaseInspection';

const post = <T>(path: string, body?: unknown) =>
  authFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const path = (id: string) => `/buyer/land/inspections/${encodeURIComponent(id)}`;

export const prePurchaseInspectionKeys = {
  mine: ['land', 'pre-purchase-inspections'] as const,
};

/** The buyer's independent pre-purchase inspections. */
export const prePurchaseInspectionService = {
  mine: () => safeCall(() => authFetch<PrePurchaseInspection[]>('/buyer/land/inspections')),

  request: (input: {
    listingId?: string;
    plotId?: string;
    focus: InspectionFocus[];
    notes?: string;
  }) =>
    safeCall(() =>
      post<PrePurchaseInspection>('/buyer/land/inspections', {
        ...(input.listingId ? { listingId: input.listingId } : {}),
        ...(input.plotId ? { plotId: input.plotId } : {}),
        focus: input.focus,
        ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
        acknowledgedNotASearch: true,
      })
    ),

  ask: (id: string, text: string) =>
    safeCall(() => post<PrePurchaseInspection>(`${path(id)}/questions`, { text: text.trim() })),

  reinspect: (id: string, reason: string) =>
    safeCall(() =>
      post<PrePurchaseInspection>(`${path(id)}/reinspection`, { reason: reason.trim() })
    ),
};
