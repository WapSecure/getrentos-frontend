'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Select,
  Textarea,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landDisputeKeys, landDisputeService } from '@/services/landDisputeService';
import { LAND_DISPUTE_KINDS, type LandDisputeKind } from '@/types/landDispute';

/**
 * Report a problem with a parcel: fraud, a competing claim, a boundary or
 * title problem, non-delivery. Opens a case for our team; the owner is told
 * a case exists but not who raised it.
 */
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
  const [kind, setKind] = useState<LandDisputeKind | ''>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        landDisputeService.open({
          propertyId,
          purchaseId,
          kind: kind as LandDisputeKind,
          description: description.trim(),
        })
      ),
    onSuccess: (dispute) => {
      void queryClient.invalidateQueries({ queryKey: landDisputeKeys.all });
      router.push(`/land/disputes/${dispute.id}`);
    },
    onError: (reason: Error) => setError(reason.message),
  });

  const close = () => {
    setKind('');
    setDescription('');
    setError(null);
    onClose();
  };
  const hint = LAND_DISPUTE_KINDS.find((item) => item.value === kind)?.hint;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submit.isPending && close()}>
      <DialogContent className="p-0">
        <div className="space-y-4 p-5">
          <div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Report a problem with this land
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {landTitle}. Our team investigates every report. The owner is told a case exists, not
              who raised it. You can add documents and photos once the case is open.
            </DialogDescription>
          </div>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as LandDisputeKind)}
            ariaLabel="What is the problem"
            placeholder="What is the problem?"
            options={LAND_DISPUTE_KINDS.map((item) => ({ value: item.value, label: item.label }))}
          />
          {hint && <p className="-mt-2 text-xs text-muted-foreground">{hint}</p>}
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="What happened, when, and who is involved. Mention any document numbers you have."
          />
          <p className="text-xs text-muted-foreground">
            At least 20 characters. False reports can be investigated too.
          </p>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={submit.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setError(null);
                submit.mutate();
              }}
              disabled={!kind || description.trim().length < 20 || submit.isPending}
              isLoading={submit.isPending}
            >
              Open a case
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
