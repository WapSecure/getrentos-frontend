'use client';

import { useState } from 'react';
import { Lock } from '@sureground/icons';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Field,
  Select,
  Textarea,
} from '@sureground/ui';

import type { Lease } from '@/types/landlord';
import type { LegalCaseKind } from '@/types/legal-case';

// A possession claim needs a tenancy (the server refuses one without); court and suit number are asked for at filing, when they exist.

export const CASE_KIND_OPTIONS: { value: LegalCaseKind; label: string }[] = [
  { value: 'EVICTION', label: 'Eviction — recovering possession' },
  { value: 'RENT_RECOVERY', label: 'Rent recovery — the money, not the property' },
  { value: 'INJUNCTION', label: 'Injunction' },
  { value: 'TITLE_DISPUTE', label: 'Title dispute' },
  { value: 'DEBT_RECOVERY', label: 'Debt recovery' },
  { value: 'OTHER', label: 'Other matter' },
];

const MIN_DESCRIPTION = 10;

export function OpenLegalCaseModal({
  open,
  onOpenChange,
  leases,
  isLoadingLeases,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leases: Lease[];
  isLoadingLeases: boolean;
  isSubmitting: boolean;
  onSubmit: (input: {
    kind: LegalCaseKind;
    propertyId: string;
    leaseId?: string;
    description: string;
  }) => void;
}) {
  const [kind, setKind] = useState<LegalCaseKind>('EVICTION');
  const [leaseId, setLeaseId] = useState('');
  const [description, setDescription] = useState('');

  const lease = leases.find((candidate) => candidate.id === leaseId) ?? null;
  const needsLease = kind === 'EVICTION';
  const canSubmit =
    description.trim().length >= MIN_DESCRIPTION && (!needsLease || leaseId.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          Open a case
        </DialogTitle>

        <div className="mt-4 space-y-4">
          <Field label="What kind of matter" required>
            <Select
              ariaLabel="What kind of matter"
              value={kind}
              onValueChange={(value) => setKind(value as LegalCaseKind)}
              options={CASE_KIND_OPTIONS}
            />
          </Field>

          <Field
            label="Which tenancy"
            required={needsLease}
            hint={
              needsLease
                ? 'A possession claim is built on the notices served on the tenancy, so this is required. The ladder is checked before anything can be filed.'
                : 'Optional. Naming a tenancy links the case to that tenancy’s notice record.'
            }
          >
            <Select
              ariaLabel="Which tenancy"
              value={leaseId}
              onValueChange={setLeaseId}
              options={leases.map((candidate) => ({
                value: candidate.id,
                // Unit and status too: one tenant can hold several leases at a property.
                label: [
                  [candidate.propertyName || 'Tenancy', candidate.unitName]
                    .filter(Boolean)
                    .join(', '),
                  candidate.tenantName,
                  candidate.status,
                ]
                  .filter(Boolean)
                  .join(' — '),
              }))}
              placeholder={isLoadingLeases ? 'Loading tenancies…' : 'Choose a tenancy'}
            />
          </Field>

          {needsLease && !leaseId && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-warning/30 bg-warning-subtle p-3.5 text-sm text-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
              <p className="text-muted-foreground">
                An eviction without a tenancy cannot be filed. There would be no notice record to
                check, and the notices are what a possession claim stands on.
              </p>
            </div>
          )}

          <Field
            label="What the matter is"
            required
            hint="A sentence or two. This is the record somebody reads a year from now."
          >
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Rent unpaid for two quarters and the tenant has not responded to the demand letter."
            />
          </Field>

          {description.length > 0 && description.trim().length < MIN_DESCRIPTION && (
            <p className="text-xs text-destructive">At least {MIN_DESCRIPTION} characters.</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              isLoading={isSubmitting}
              disabled={!canSubmit}
              onClick={() =>
                onSubmit({
                  kind,
                  propertyId: lease?.propertyId ?? '',
                  ...(leaseId ? { leaseId } : {}),
                  description: description.trim(),
                })
              }
            >
              Open case
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
