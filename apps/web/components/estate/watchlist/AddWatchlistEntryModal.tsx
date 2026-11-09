'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogTitle,
  DocumentUpload,
  Field,
  Input,
  Select,
} from '@sureground/ui';
import type { WatchlistSeverity, WatchlistSubjectType } from '@/types/estate';

// The API's minimum; keep in step.
const REASON_MIN_LENGTH = 10;

const SUBJECT_OPTIONS = [
  { value: 'PERSON', label: 'A person' },
  { value: 'VEHICLE', label: 'A vehicle' },
];

// Spelled out because WATCH reads like a weaker BLOCK, and it stops nobody.
const SEVERITY_OPTIONS = [
  { value: 'BLOCK', label: 'Do not admit them' },
  { value: 'WATCH', label: 'Admit, but tell the office' },
];

export interface AddWatchlistEntryInput {
  label: string;
  reason: string;
  subjectType: WatchlistSubjectType;
  severity: WatchlistSeverity;
  phone?: string;
  plateNumber?: string;
  expiresAt?: string;
  photo?: File;
}

interface AddWatchlistEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddWatchlistEntryInput) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const AddWatchlistEntryModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: AddWatchlistEntryModalProps) => {
  const [subjectType, setSubjectType] = useState<WatchlistSubjectType>('PERSON');
  const [severity, setSeverity] = useState<WatchlistSeverity>('BLOCK');
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const isVehicle = subjectType === 'VEHICLE';

  const reset = () => {
    setSubjectType('PERSON');
    setSeverity('BLOCK');
    setLabel('');
    setPhone('');
    setPlateNumber('');
    setReason('');
    setExpiresAt('');
    setPhoto(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Mirrors the API's rule (two name words or a phone); the server stays the authority.
  const nameWordCount = label.trim().split(/\s+/).filter(Boolean).length;
  const hasPhone = phone.replace(/\D/g, '').length >= 7;
  const cannotMatch = isVehicle ? plateNumber.trim().length < 3 : nameWordCount < 2 && !hasPhone;

  const canSubmit =
    label.trim().length > 0 && reason.trim().length >= REASON_MIN_LENGTH && !cannotMatch;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">
          Add to watch list
        </DialogTitle>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Subject">
              <Select
                value={subjectType}
                onValueChange={(value) => {
                  const next = value as WatchlistSubjectType;
                  if (next === subjectType) return;
                  // Identity fields are cleared on a change of subject: a vehicle description like "Black Hilux" would pass as a person's name.
                  setLabel('');
                  setPhone('');
                  setPlateNumber('');
                  setSubjectType(next);
                }}
                options={SUBJECT_OPTIONS}
              />
            </Field>
            <Field label="What happens">
              <Select
                value={severity}
                onValueChange={(value) => setSeverity(value as WatchlistSeverity)}
                options={SEVERITY_OPTIONS}
              />
            </Field>
          </div>

          <p className="text-xs text-muted-foreground">
            {severity === 'BLOCK'
              ? 'The gate is refused, and they can only be admitted if a guard gives a reason: which you are told about.'
              : 'The gate is not refused. The estate office is told when they arrive.'}
          </p>

          <Field
            label={isVehicle ? 'Vehicle' : 'Full name'}
            required
            hint={
              isVehicle
                ? undefined
                : 'A full name, not one name. A single name word would flag everybody who shares it.'
            }
          >
            <Input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={isVehicle ? 'e.g. Black Hilux, no plate visible' : 'e.g. Tunde Fagbenle'}
            />
          </Field>

          {isVehicle ? (
            <Field
              label="Plate number"
              hint={
                <>
                  Spacing and case are ignored, so <span className="font-mono">lag 123 xy</span>{' '}
                  matches this too.
                </>
              }
            >
              <Input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="LAG-123-XY"
                inputClassName="uppercase"
              />
            </Field>
          ) : (
            <Field
              label="Phone"
              optionalLabel="(optional)"
              hint="A number is a much stronger match than a name. Worth adding if the estate has one."
            >
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08031234567"
              />
            </Field>
          )}

          <Field
            label="Why are they on this list?"
            required
            hint={`A guard is shown this word for word, so they can explain the refusal to the person at the gate. At least ${REASON_MIN_LENGTH} characters.`}
          >
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Harassed residents in Block A"
            />
          </Field>

          <Field
            label="Permanent?"
            optionalLabel="Leave blank for an entry that stands until somebody lifts it"
          >
            <DatePicker value={expiresAt} onChange={setExpiresAt} clearable />
          </Field>

          <Field label="Photo" optionalLabel="(optional)">
            <DocumentUpload
              value={photo ? [{ id: 'photo', file: photo }] : []}
              onChange={(items) => setPhoto(items[0]?.file ?? null)}
              accept="image/*"
              multiple={false}
              label=""
            />
          </Field>

          {cannotMatch && label.trim().length > 0 && (
            <Alert variant="warning">
              {isVehicle
                ? 'A vehicle needs a plate number. Without one there is nothing a guard can compare, so the rule would never fire.'
                : 'This cannot be matched against anybody yet. Give a full name, or add a phone number: otherwise the list would look like it was covering somebody it never would.'}
            </Alert>
          )}

          {error && <Alert variant="danger">{error}</Alert>}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Adding…"
            onClick={() =>
              onSubmit({
                label: label.trim(),
                reason: reason.trim(),
                subjectType,
                severity,
                phone: isVehicle ? undefined : phone.trim() || undefined,
                plateNumber: isVehicle ? plateNumber.trim() || undefined : undefined,
                // The API wants an instant: end of that day, so the entry doesn't lapse that morning.
                expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : undefined,
                photo: photo ?? undefined,
              })
            }
          >
            Add to list
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
