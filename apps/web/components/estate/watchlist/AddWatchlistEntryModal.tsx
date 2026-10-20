'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  Alert,
  Button,
  DatePicker,
  DocumentUpload,
  Field,
  IconButton,
  Input,
  Select,
} from '@getrentos/ui';
import type { WatchlistSeverity, WatchlistSubjectType } from '@/types/estate';

/** The API's floor. Kept in step so the form never allows what the server will reject. */
const REASON_MIN_LENGTH = 10;

const SUBJECT_OPTIONS = [
  { value: 'PERSON', label: 'A person' },
  { value: 'VEHICLE', label: 'A vehicle' },
];

/**
 * What the two severities actually do, in the estate's terms.
 *
 * Written out rather than left to the enum names. "WATCH" on its own reads like
 * a weaker BLOCK, and a manager who expects it to stop somebody would find out
 * at the barrier instead: where the person has already been let in.
 */
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

/**
 * Adds somebody to an estate's watch list.
 *
 * The form refuses two combinations before the request is made, because the API
 * refuses them too and a round trip teaches the manager nothing:
 *
 *  - A person with a single name word and no phone. "Chioma" is not an identity,
 *    so the rule could only ever flag everybody who shares the name.
 *  - A vehicle with no registration. There is nothing else a guard can compare.
 *
 * Both are refused with the reason on screen, because the point is not to block
 * the manager: it is to stop the estate believing it is protected by a rule
 * that can never fire.
 */
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

  // The same rule the API applies: at least two name words, or a number to fall
  // back on. Mirrored here only to explain it: the server remains the authority.
  const nameWordCount = label.trim().split(/\s+/).filter(Boolean).length;
  const hasPhone = phone.replace(/\D/g, '').length >= 7;
  const cannotMatch = isVehicle ? plateNumber.trim().length < 3 : nameWordCount < 2 && !hasPhone;

  const canSubmit =
    label.trim().length > 0 && reason.trim().length >= REASON_MIN_LENGTH && !cannotMatch;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">Add to watch list</h3>
              <IconButton label="Close" icon={<X />} size="sm" onClick={handleClose} />
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Subject">
                  <Select
                    value={subjectType}
                    onValueChange={(value) => {
                      const next = value as WatchlistSubjectType;
                      if (next === subjectType) return;
                      // Everything identity-bearing is cleared on a change of
                      // subject. Carrying it over is not neutral: a description
                      // typed for a vehicle ("Black Hilux") is two words, so it
                      // would be accepted as a person's name and the estate would
                      // have filed a rule about somebody who does not exist.
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
                  placeholder={
                    isVehicle ? 'e.g. Black Hilux, no plate visible' : 'e.g. Tunde Fagbenle'
                  }
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

              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
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
                    // A date input is a calendar day; the API wants an instant. End
                    // of that day, so an entry does not lapse the morning it is set.
                    expiresAt: expiresAt
                      ? new Date(`${expiresAt}T23:59:59`).toISOString()
                      : undefined,
                    photo: photo ?? undefined,
                  })
                }
              >
                Add to list
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
