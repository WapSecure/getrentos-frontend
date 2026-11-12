import { authFetch, safeCall, toQuery } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';
import type { Paginated } from '@/services/adminService';
import type { DiasporaQueueItem, DiasporaQueueKind } from '@/types/diaspora';

export interface ListDiasporaQueueParams {
  kind?: DiasporaQueueKind;
  overdue?: boolean;
  /** 'me', 'unassigned' or a staff user id. */
  assignee?: string;
  investorId?: string;
  page?: number;
  pageSize?: number;
}

export type DiasporaQueuePage = Paginated<DiasporaQueueItem> & { overdueTotal: number };

export const adminDiasporaService = {
  queue(params: ListDiasporaQueueParams = {}): Promise<ApiResponse<DiasporaQueuePage>> {
    return safeCall(() =>
      authFetch(
        `/admin/diaspora/queue${toQuery({
          kind: params.kind,
          overdue: params.overdue === undefined ? undefined : String(params.overdue),
          assignee: params.assignee,
          investorId: params.investorId,
          page: params.page,
          pageSize: params.pageSize,
        })}`
      )
    );
  },
  /** Leave staffId out to take the item yourself. */
  assign(
    kind: DiasporaQueueKind,
    subjectId: string,
    staffId?: string
  ): Promise<ApiResponse<DiasporaQueueItem>> {
    return safeCall(() =>
      authFetch<DiasporaQueueItem>(
        `/admin/diaspora/queue/${encodeURIComponent(kind)}/${encodeURIComponent(subjectId)}/assign`,
        { method: 'POST', body: JSON.stringify(staffId ? { staffId } : {}) }
      )
    );
  },
};
