'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { visitToIso, VisitTimeField } from '@/components/landlord/maintenance/VisitTimeField';
import type { LandlordMaintenanceRequest } from '@/types/landlord';

interface ScheduleVisitModalProps {
  request: LandlordMaintenanceRequest | null;
  onClose: () => void;
  onSchedule: (requestId: string, scheduledFor: string) => void;
  isSaving?: boolean;
  error?: string | null;
}

export const ScheduleVisitModal = ({
  request,
  onClose,
  onSchedule,
  isSaving = false,
  error = null,
}: ScheduleVisitModalProps) => (
  <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
    <DialogContent>
      {request && (
        <ScheduleForm
          key={request.id}
          request={request}
          onSchedule={onSchedule}
          isSaving={isSaving}
          error={error}
        />
      )}
    </DialogContent>
  </Dialog>
);

const ScheduleForm = ({
  request,
  onSchedule,
  isSaving,
  error,
}: {
  request: LandlordMaintenanceRequest;
  onSchedule: (requestId: string, scheduledFor: string) => void;
  isSaving: boolean;
  error: string | null;
}) => {
  const [when, setWhen] = useState('');
  const iso = visitToIso(when);

  return (
    <>
      <div className="p-4 border-b border-border">
        <DialogTitle className="font-semibold text-foreground">
          {request.scheduledFor ? 'Move the visit' : 'Book a visit'}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          {request.assignedVendorName} · {request.issueTitle}. Your tenant is told the new time.
        </DialogDescription>
      </div>
      <div className="p-4 space-y-4">
        <VisitTimeField value={when} onChange={setWhen} />
        {error && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <Button
          variant="primary"
          fullWidth
          onClick={() => iso && onSchedule(request.id, iso)}
          isLoading={isSaving}
          disabled={!iso || isSaving}
        >
          {request.scheduledFor ? 'Move visit' : 'Book visit'}
        </Button>
      </div>
    </>
  );
};
