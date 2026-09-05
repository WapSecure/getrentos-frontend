import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { EstateMicrositeProfile } from '@/types/estate-microsite';

/** Public storefront reads — works whether or not the visitor is signed in. */
export const estateMicrositeService = {
  async getProfile(slug: string): Promise<ApiResponse<EstateMicrositeProfile>> {
    return safeCall(() => authFetch(`/estate-microsites/${slug}`));
  },
};
