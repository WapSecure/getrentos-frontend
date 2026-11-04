'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { maintenanceTriageService } from '@/services/maintenanceTriageService';
import type { MaintenanceTriage, MaintenanceTriageDecision } from '@/types/maintenance';

/**
 * Runs the triage copilot on one request and records the person's decision.
 * Shared by the landlord maintenance list and the home-management work-order
 * queue (where property managers work), so both behave the same way.
 * `onApplied` runs after an accept changed the request, to refresh the list.
 */
export function useMaintenanceTriage({ onApplied }: { onApplied?: () => unknown } = {}) {
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
    mutationFn: (decision: MaintenanceTriageDecision) =>
      unwrap(maintenanceTriageService.decide(requestId!, triage!.reviewId!, decision)),
    onSuccess: async (result) => {
      if (result.outcome === 'REJECTED') {
        toast.success('Thanks. The suggestion was rejected and nothing was changed.');
      } else {
        toast.success('Category and urgency updated on the request.');
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
      onDecide: (decision: MaintenanceTriageDecision) => decideMutation.mutate(decision),
      isDeciding: decideMutation.isPending,
    },
  };
}
