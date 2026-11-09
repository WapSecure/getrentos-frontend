'use client';

import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';

export const useOwnerLayouts = () =>
  useQuery({
    queryKey: landDeveloperKeys.layouts,
    queryFn: () => unwrap(landDeveloperService.listMyLayouts()),
    staleTime: 60_000,
  });
