'use client';

import { useState } from 'react';
import { ShieldPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, Button, Select, LegacyInput } from '@getrentos/ui';
import type { FraudAlertSeverity } from '@/types/admin';

const SEVERITY_OPTIONS: { value: FraudAlertSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

interface NewFraudAlertModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (params: {
    subjectUserId: string;
    reason: string;
    severity: FraudAlertSeverity;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) => void;
  isCreating?: boolean;
}

export const NewFraudAlertModal = ({
  open,
  onClose,
  onCreate,
  isCreating = false,
}: NewFraudAlertModalProps) => {
  const [subjectUserId, setSubjectUserId] = useState('');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<FraudAlertSeverity>('medium');
  const [relatedEntityType, setRelatedEntityType] = useState('');
  const [relatedEntityId, setRelatedEntityId] = useState('');

  const canSubmit = subjectUserId.trim().length > 0 && reason.trim().length > 0;

  const handleClose = () => {
    if (isCreating) return;
    setSubjectUserId('');
    setReason('');
    setSeverity('medium');
    setRelatedEntityType('');
    setRelatedEntityId('');
    onClose();
  };

  const handleCreate = () => {
    if (!canSubmit) return;
    onCreate({
      subjectUserId: subjectUserId.trim(),
      reason: reason.trim(),
      severity,
      ...(relatedEntityType.trim() ? { relatedEntityType: relatedEntityType.trim() } : {}),
      ...(relatedEntityId.trim() ? { relatedEntityId: relatedEntityId.trim() } : {}),
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="font-semibold text-foreground flex items-center gap-2">
          <ShieldPlus className="w-4 h-4 text-red-500" />
          Flag a fraud alert
        </DialogTitle>

        <div className="space-y-3 mt-4">
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Subject user id *</p>
            <LegacyInput
              type="text"
              value={subjectUserId}
              onChange={(e) => setSubjectUserId(e.target.value)}
              placeholder="User id of the account to flag"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Reason *</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Describe the suspected fraud..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Severity</p>
            <Select
              value={severity}
              onValueChange={(value) => setSeverity(value as FraudAlertSeverity)}
              options={SEVERITY_OPTIONS}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Related entity type</p>
              <LegacyInput
                type="text"
                value={relatedEntityType}
                onChange={(e) => setRelatedEntityType(e.target.value)}
                placeholder="e.g. Listing"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Related entity id</p>
              <LegacyInput
                type="text"
                value={relatedEntityId}
                onChange={(e) => setRelatedEntityId(e.target.value)}
                placeholder="e.g. listing-9"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit || isCreating} isLoading={isCreating}>
            <ShieldPlus className="w-4 h-4" />
            Flag alert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
