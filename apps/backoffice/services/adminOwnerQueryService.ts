import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type QueryStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED';

export interface AdminQuerySummary {
  id: string;
  subject: string;
  category: string;
  status: QueryStatus;
  propertyTitle: string;
  ownerName: string | null;
  lastActivityAt: string;
  lastMessage: { side: 'OWNER' | 'MANAGER'; preview: string } | null;
  firstResponseDueAt: string;
  firstResponseAt: string | null;
  answeredInHours: number | null;
  late: boolean;
}

export interface AdminQueryThread extends AdminQuerySummary {
  messages: {
    id: string;
    side: 'OWNER' | 'MANAGER';
    author: string;
    onBehalfOf: string | null;
    body: string;
    at: string;
  }[];
}

export interface AdminOwnerQueryDraft {
  queryId: string;
  reply: string;
  toCheck: string[];
  facts: { title: string; lines: string[] }[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

const post = <T>(path: string, body?: unknown): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(path, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) })
  );

export const adminOwnerQueryService = {
  list(status?: QueryStatus) {
    return safeCall(() =>
      authFetch<AdminQuerySummary[]>(`/admin/owner-queries${status ? `?status=${status}` : ''}`)
    );
  },
  get(id: string) {
    return safeCall(() => authFetch<AdminQueryThread>(`/admin/owner-queries/${id}`));
  },
  draftReply(id: string) {
    return post<AdminOwnerQueryDraft>(`/admin/owner-queries/${id}/draft-reply`);
  },
  reply(id: string, body: string) {
    return post<AdminQueryThread>(`/admin/owner-queries/${id}/messages`, { body });
  },
  resolve(id: string) {
    return post<AdminQueryThread>(`/admin/owner-queries/${id}/resolve`);
  },
};
