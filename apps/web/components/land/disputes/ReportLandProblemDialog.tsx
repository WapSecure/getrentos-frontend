'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReasonDialog } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landDisputeKeys, landDisputeService } from '@/services/landDisputeService';
import { LAND_DISPUTE_KINDS, type LandDisputeKind } from '@/types/landDispute';

// The owner is told a case exists but not who raised it.
export const ReportLandProblemDialog = ({
  open,
  onClose,
  propertyId,
  purchaseId,
  landTitle,
}: {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  purchaseId?: string;
  landTitle: string;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: (input: { kind: LandDisputeKind; description: string }) =>
      unwrap(landDisputeService.open({ propertyId, purchaseId, ...input })),
    onSuccess: (dispute) => {
      void queryClient.invalidateQueries({ queryKey: landDisputeKeys.all });
      router.push(`/land/disputes/${dispute.id}`);
    },
    onError: (reason: Error) => setError(reason.message),
  });

  return (
    <ReasonDialog<LandDisputeKind>
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        setError(null);
        onClose();
      }}
      title="Report a problem with this land"
      description={`${landTitle}. Our team investigates every report. The owner is told a case exists, not who raised it. You can add documents and photos once the case is open.`}
      categories={{
        options: LAND_DISPUTE_KINDS,
        ariaLabel: 'What is the problem',
        placeholder: 'What is the problem?',
      }}
      reasonLabel="Describe the problem"
      reasonPlaceholder="What happened, when, and who is involved. Mention any document numbers you have."
      reasonHint="At least 20 characters. False reports can be investigated too."
      rows={5}
      minLength={20}
      maxLength={5000}
      confirmLabel="Open a case"
      error={error}
      onSubmit={({ category, reason }) => {
        setError(null);
        return submit.mutateAsync({ kind: category as LandDisputeKind, description: reason });
      }}
    />
  );
};
