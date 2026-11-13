import { authFetch, safeCall, toQuery } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';
import type { Paginated } from '@/services/adminService';
import type {
  DiasporaQueueDue,
  DiasporaQueueItem,
  DiasporaQueueKind,
  DiasporaQueueSummary,
} from '@/types/diaspora';

export interface ListDiasporaQueueParams {
  kind?: DiasporaQueueKind;
  overdue?: boolean;
  due?: DiasporaQueueDue;
  /** The item title or the investor's name. */
  search?: string;
  /** 'me', 'unassigned' or a staff user id. */
  assignee?: string;
  investorId?: string;
  page?: number;
  pageSize?: number;
}

export type DiasporaQueuePage = Paginated<DiasporaQueueItem> & {
  overdueTotal: number;
  /** Missing from servers older than the workload summary: show no figure rather than a guess. */
  summary?: DiasporaQueueSummary;
};

export const adminDiasporaService = {
  queue(params: ListDiasporaQueueParams = {}): Promise<ApiResponse<DiasporaQueuePage>> {
    return safeCall(() =>
      authFetch(
        `/admin/diaspora/queue${toQuery({
          kind: params.kind,
          overdue: params.overdue === undefined ? undefined : String(params.overdue),
          due: params.due,
          search: params.search || undefined,
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
