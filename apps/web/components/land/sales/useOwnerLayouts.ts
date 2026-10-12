'use client';

import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';

/**
 * Every estate layout the caller can sell from, owned outright or reached
 * through a listing mandate, with plot counts by status.
 */
export const useOwnerLayouts = () =>
  useQuery({
    queryKey: landDeveloperKeys.layouts,
    queryFn: () => unwrap(landDeveloperService.listMyLayouts()),
    staleTime: 60_000,
  });
