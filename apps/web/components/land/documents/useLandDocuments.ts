'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landKeys } from '@/lib/queryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { LandDocument, LandDocumentUploadInput } from '@/types/landDocument';

// Preview links are signed for 15 minutes; refetch well inside that.
const DOCUMENTS_STALE_MS = 5 * 60_000;

export const useLandDocuments = (propertyId: string | null | undefined) =>
  useQuery({
    queryKey: landDeveloperKeys.documents(propertyId ?? ''),
    queryFn: () => unwrap(landDeveloperService.listDocuments(propertyId as string)),
    enabled: Boolean(propertyId),
    staleTime: DOCUMENTS_STALE_MS,
    refetchInterval: 10 * 60_000,
  });

const useRefreshAfterDocumentChange = (propertyId: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: landDeveloperKeys.documents(propertyId) });
    queryClient.invalidateQueries({ queryKey: landKeys.owner });
    queryClient.invalidateQueries({ queryKey: landDeveloperKeys.risk(propertyId) });
  };
};

export const useUploadLandDocument = (propertyId: string) => {
  const queryClient = useQueryClient();
  const refresh = useRefreshAfterDocumentChange(propertyId);
  return useMutation({
    mutationFn: (input: LandDocumentUploadInput) =>
      unwrap(landDeveloperService.uploadDocument(propertyId, input)),
    onSuccess: (document) => {
      queryClient.setQueryData<LandDocument[]>(
        landDeveloperKeys.documents(propertyId),
        (current) => [document, ...(current ?? []).filter((d) => d.id !== document.id)]
      );
      refresh();
    },
  });
};

export const useDeleteLandDocument = (propertyId: string) => {
  const refresh = useRefreshAfterDocumentChange(propertyId);
  return useMutation({
    mutationFn: (documentId: string) =>
      unwrap(landDeveloperService.deleteDocument(propertyId, documentId)),
    onSuccess: refresh,
  });
};

export const usageLabels = (
  document: LandDocument,
  checkLabel: (key: string) => string = (key) => key.toLowerCase().replace(/_/g, ' ')
): string[] => {
  const { usage } = document;
  const plural = (count: number, one: string, many: string) =>
    count === 1 ? `1 ${one}` : `${count} ${many}`;
  return [
    ...(usage.layoutPlan ? ['Layout plan'] : []),
    ...(usage.milestones > 0
      ? [plural(usage.milestones, 'conveyance step', 'conveyance steps')]
      : []),
    ...(usage.titleEvents > 0
      ? [plural(usage.titleEvents, 'title history entry', 'title history entries')]
      : []),
    ...(usage.mandates > 0
      ? [plural(usage.mandates, 'management mandate', 'management mandates')]
      : []),
    ...(usage.encumbrances > 0 ? [plural(usage.encumbrances, 'encumbrance', 'encumbrances')] : []),
    ...usage.checklistKeys.map((key) => `Diligence: ${checkLabel(key)}`),
  ];
};
