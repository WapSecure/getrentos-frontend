import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type ActivityActorKind = 'MANAGER' | 'GETRENTOS' | 'TENANT' | 'SYSTEM' | 'OTHER';

export interface ActivityItem {
  id: string;
  at: string;
  action: string;
  label: string;
  important: boolean;
  actorKind: ActivityActorKind;
  actor: string;
  propertyId: string | null;
  propertyTitle: string;
}

export interface ActivityPage {
  items: ActivityItem[];
  nextBefore: string | null;
  properties: { id: string; title: string }[];
}

/** What others have done on the caller's properties, newest first. */
export function ownerActivity(input: {
  propertyId?: string;
  who: 'managers' | 'everyone';
  before?: string | null;
}): Promise<ApiResponse<ActivityPage>> {
  const q = new URLSearchParams({ who: input.who });
  if (input.propertyId) q.set('propertyId', input.propertyId);
  if (input.before) q.set('before', input.before);
  return safeCall(() => authFetch<ActivityPage>(`/owner-activity?${q.toString()}`));
}
