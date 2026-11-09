import { authFetch, safeCall, toQuery, type ApiResponse, type Paginated } from '@/lib/apiHelpers';
import type { MicrositeProfile, MicrositeListing } from '@/types/microsite';

/** Works whether or not the visitor is signed in. */
export const micrositeService = {
  async getProfile(slug: string): Promise<ApiResponse<MicrositeProfile>> {
    return safeCall(() => authFetch(`/microsites/${slug}`));
  },

  async listListings(
    slug: string,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<MicrositeListing>>> {
    return safeCall(() => authFetch(`/microsites/${slug}/listings${toQuery(params)}`));
  },
};
