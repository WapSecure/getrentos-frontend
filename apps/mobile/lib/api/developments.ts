import { developmentOf, type ShowroomDevelopment } from '@sureground/shared/showroom';
import { ApiError, apiFetch } from './client';
import { toQuery } from './query';
import { developmentsPageOf, isDevelopmentId, type DevelopmentsPage } from '../developments';

// Public routes: a token would only make a stale session 401 on a page that needs none.
const anon = { anonymous: true } as const;

export const developmentsApi = {
  /** Live developments only, each read through the shared mapper. */
  async list(page = 1, pageSize = 12): Promise<DevelopmentsPage> {
    const raw = await apiFetch<unknown>(`/developments${toQuery({ page, pageSize })}`, anon);
    return developmentsPageOf(raw);
  },

  /** Null when it is not live, not shown honestly (see `developmentOf`), or the id is not one. */
  async detail(id: string): Promise<ShowroomDevelopment | null> {
    if (!isDevelopmentId(id)) return null;
    try {
      const raw = await apiFetch<unknown>(`/developments/${encodeURIComponent(id)}`, anon);
      return developmentOf(raw) ?? null;
    } catch (e) {
      // Taken down or never live: gone, not a connection problem.
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
};
