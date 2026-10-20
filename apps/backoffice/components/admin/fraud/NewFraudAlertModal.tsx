'use client';

import { useState } from 'react';
import { ShieldPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from '@getrentos/ui';
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
  }) => Promise<boolean>;
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

  const handleCreate = async () => {
    if (!canSubmit) return;
    const created = await onCreate({
      subjectUserId: subjectUserId.trim(),
      reason: reason.trim(),
      severity,
      ...(relatedEntityType.trim() ? { relatedEntityType: relatedEntityType.trim() } : {}),
      ...(relatedEntityId.trim() ? { relatedEntityId: relatedEntityId.trim() } : {}),
    });
    if (created) handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="font-semibold text-foreground flex items-center gap-2">
          <ShieldPlus className="w-4 h-4 text-destructive" />
          Flag a fraud alert
        </DialogTitle>

        <div className="space-y-3 mt-4">
          <Field label="Subject user id" required>
            <Input
              type="text"
              value={subjectUserId}
              onChange={(e) => setSubjectUserId(e.target.value)}
              placeholder="User id of the account to flag"
            />
          </Field>
          <Field label="Reason" required>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Describe the suspected fraud..."
              className="resize-none"
            />
          </Field>
          <Field label="Severity">
            <Select
              value={severity}
              onValueChange={(value) => setSeverity(value as FraudAlertSeverity)}
              options={SEVERITY_OPTIONS}
              searchable={false}
              className="w-full"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Related entity type">
              <Input
                type="text"
                value={relatedEntityType}
                onChange={(e) => setRelatedEntityType(e.target.value)}
                placeholder="e.g. Listing"
              />
            </Field>
            <Field label="Related entity id">
              <Input
                type="text"
                value={relatedEntityId}
                onChange={(e) => setRelatedEntityId(e.target.value)}
                placeholder="e.g. listing-9"
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={!canSubmit || isCreating}
            isLoading={isCreating}
            icon={<ShieldPlus className="w-4 h-4" />}
          >
            Flag alert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
