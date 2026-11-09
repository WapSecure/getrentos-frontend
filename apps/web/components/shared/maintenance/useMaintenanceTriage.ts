'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { maintenanceTriageService } from '@/services/maintenanceTriageService';
import type { MaintenanceTriage, MaintenanceTriageDecision } from '@/types/maintenance';

export function useMaintenanceTriage({
  onApplied,
  assignVendor,
}: {
  onApplied?: () => unknown;
  /** The screen's own vendor-assignment path, so "also assign" uses its authority and SLA rules. */
  assignVendor?: (requestId: string, vendorId: string) => Promise<unknown>;
} = {}) {
  const toast = useToast();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [triage, setTriage] = useState<MaintenanceTriage | null>(null);

  const triageMutation = useMutation({
    mutationFn: (id: string) => unwrap(maintenanceTriageService.triage(id)),
    onSuccess: (result) => setTriage(result),
    onError: (error: Error) => {
      setRequestId(null);
      toast.error(error.message || 'Could not triage this request.');
    },
  });

  const close = () => {
    setRequestId(null);
    setTriage(null);
  };

  const decideMutation = useMutation({
    mutationFn: async ({
      decision,
      alsoAssignVendorId,
    }: {
      decision: MaintenanceTriageDecision;
      alsoAssignVendorId?: string;
    }) => {
      const result = await unwrap(
        maintenanceTriageService.decide(requestId!, triage!.reviewId!, decision)
      );
      let assigned = false;
      if (result.outcome !== 'REJECTED' && alsoAssignVendorId && assignVendor) {
        try {
          await assignVendor(requestId!, alsoAssignVendorId);
          assigned = true;
        } catch (error) {
          toast.error(
            (error as Error).message ||
              'The triage was applied, but the vendor could not be assigned.'
          );
        }
      }
      return { result, assigned };
    },
    onSuccess: async ({ result, assigned }) => {
      if (result.outcome === 'REJECTED') {
        toast.success('Thanks. The suggestion was rejected and nothing was changed.');
      } else {
        toast.success(
          assigned
            ? 'Work order updated and the vendor assigned.'
            : 'Category, urgency and scope updated on the work order.'
        );
        await onApplied?.();
      }
      close();
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save your decision.'),
  });

  const start = (id: string) => {
    triageMutation.reset();
    decideMutation.reset();
    setTriage(null);
    setRequestId(id);
    triageMutation.mutate(id);
  };

  return {
    start,
    close,
    requestId,
    isTriaging: (id: string) => triageMutation.isPending && triageMutation.variables === id,
    modal: {
      open: requestId !== null,
      triage,
      onClose: close,
      onDecide: (decision: MaintenanceTriageDecision, alsoAssignVendorId?: string) =>
        decideMutation.mutate({ decision, alsoAssignVendorId }),
      canAssignVendor: Boolean(assignVendor),
      isDeciding: decideMutation.isPending,
    },
  };
}
