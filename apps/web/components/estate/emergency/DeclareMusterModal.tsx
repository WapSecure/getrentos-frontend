'use client';

import { useState } from 'react';
import { Siren } from '@sureground/icons';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
} from '@sureground/ui';
import type { EmergencyKind } from '@/types/estate';

// The API's minimum description length; keep in step.
const DESCRIPTION_MIN_LENGTH = 3;

const KIND_OPTIONS: { value: EmergencyKind; label: string }[] = [
  { value: 'FIRE', label: 'Fire' },
  { value: 'GAS_LEAK', label: 'Gas leak' },
  { value: 'STRUCTURAL', label: 'Structural damage' },
  { value: 'SECURITY', label: 'Security incident' },
  { value: 'MEDICAL', label: 'Medical emergency' },
  { value: 'OTHER', label: 'Something else' },
];

export interface DeclareMusterInput {
  kind: EmergencyKind;
  description: string;
  /** Optional: the API accepts no assembly point, and a required field must never block an alarm. */
  assemblyPoint?: string;
}

interface DeclareMusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeclareMusterInput) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

// The roll is built by the server in the declaring transaction, as a snapshot; never assemble it here.
export const DeclareMusterModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: DeclareMusterModalProps) => {
  const [kind, setKind] = useState<EmergencyKind>('FIRE');
  const [description, setDescription] = useState('');
  const [assemblyPoint, setAssemblyPoint] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = () => {
    setKind('FIRE');
    setDescription('');
    setAssemblyPoint('');
    setLocalError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
      return setLocalError(
        'Say what you can see. A record with no description cannot be handed to a fire officer, an insurer or a family.'
      );
    }
    setLocalError(null);
    onSubmit({
      kind,
      description: description.trim(),
      assemblyPoint: assemblyPoint.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="lg">
        <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold text-foreground">
          <Siren className="w-5 h-5 text-destructive" aria-hidden="true" />
          Raise the alarm
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          Every household in the estate is told immediately, and the roll is taken as it stands
          right now.
        </DialogDescription>

        <div className="mt-5 space-y-4">
          {(localError || error) && <Alert variant="danger">{localError ?? error}</Alert>}

          <Field
            label="What is happening?"
            hint="This decides the words every resident is sent, so it is worth a second before the tap."
          >
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as EmergencyKind)}
              options={KIND_OPTIONS}
            />
          </Field>

          <Field
            label="What did you see?"
            hint="In your own words. This is the line a fire officer, an insurer or a family reads afterwards, and it is the only place your account of it survives."
          >
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              showCount
              placeholder="e.g. Smoke on the third floor of Block C, coming from the stairwell."
            />
          </Field>

          <Field
            label="Where should everybody gather?"
            optionalLabel="(optional)"
            hint="Leave it blank if you have not decided. Residents are told to leave by the nearest exit instead: nobody is kept waiting on a form field."
          >
            <Input
              type="text"
              value={assemblyPoint}
              onChange={(e) => setAssemblyPoint(e.target.value)}
              maxLength={160}
              placeholder="e.g. the car park by the second gate"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            You can stand the roll down once the estate is out.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              isLoading={isSubmitting}
              loadingText="Raising…"
            >
              Raise the alarm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
