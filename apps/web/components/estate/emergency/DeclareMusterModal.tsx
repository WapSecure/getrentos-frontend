'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Siren, X } from 'lucide-react';
import { Button, LegacyInput, Select } from '@getrentos/ui';
import type { EmergencyKind } from '@/types/estate';

/** The API's floor on a description, kept in step so the form cannot under-run it. */
const DESCRIPTION_MIN_LENGTH = 3;

/**
 * The six kinds, as a manager picks them.
 *
 * Plain nouns on purpose. The sentence people receive is composed server-side
 * from the kind — "a gas leak, leave by the nearest exit" — so this list only
 * has to be unambiguous to the person choosing, not grammatical.
 */
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
  /**
   * Omitted when the manager does not have one to hand.
   *
   * The API accepts a declaration with no assembly point and the resident copy
   * falls back to "leave by the nearest exit". A form field that blocked a 3am
   * alarm would be worse than an incomplete record, so this is never required.
   */
  assemblyPoint?: string;
}

interface DeclareMusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeclareMusterInput) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Raises the alarm.
 *
 * Two things are required and one is not, which is the design of the whole
 * form: the kind and the manager's own account of what they saw are what make
 * the record useful to a fire officer or an insurer afterwards, and the assembly
 * point is the one thing somebody raising an alarm at 3am may not have decided
 * yet.
 *
 * What is NOT on this form is the roll. It is built by the server in the same
 * transaction that records the declaration, from who the estate believes is
 * inside at that moment — a client that assembled it would be assembling it from
 * whatever its cache last saw, and the value of a roll call is that it is a
 * snapshot taken at a stated time.
 */
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-card rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Raise the alarm"
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Siren className="w-5 h-5 text-destructive" />
                  Raise the alarm
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Every household in the estate is told immediately, and the roll is taken as it
                  stands right now.
                </p>
              </div>
              <button onClick={handleClose} aria-label="Close" className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {(localError || error) && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{localError ?? error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  What is happening?
                </label>
                <Select
                  value={kind}
                  onValueChange={(value) => setKind(value as EmergencyKind)}
                  options={KIND_OPTIONS}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This decides the words every resident is sent, so it is worth a second before the
                  tap.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  What did you see?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="e.g. Smoke on the third floor of Block C, coming from the stairwell."
                  className="w-full rounded-lg border border-border bg-transparent p-3 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  In your own words. This is the line a fire officer, an insurer or a family reads
                  afterwards, and it is the only place your account of it survives.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Where should everybody gather?{' '}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <LegacyInput
                  type="text"
                  value={assemblyPoint}
                  onChange={(e) => setAssemblyPoint(e.target.value)}
                  maxLength={160}
                  placeholder="e.g. the car park by the second gate"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave it blank if you have not decided. Residents are told to leave by the nearest
                  exit instead — nobody is kept waiting on a form field.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
              <p className="text-xs text-muted-foreground">
                You can stand the roll down once the estate is out.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={submit} disabled={isSubmitting}>
                  {isSubmitting ? 'Raising…' : 'Raise the alarm'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
