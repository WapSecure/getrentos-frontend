'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  useToast,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminEstateService } from '@/services/adminEstateService';
import type { AdminEstateHouseholdQueue, AdminEstateDueQueue } from '@/types/estate';

const householdStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/** Corrects household membership/contact data, or unlinks a resident account. */
export function HouseholdEditorDialog({
  household,
  onClose,
}: {
  household: AdminEstateHouseholdQueue | null;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [unitLabel, setUnitLabel] = useState(household?.unitLabel ?? '');
  const [contactPhone, setContactPhone] = useState(household?.contactPhone ?? '');
  const [contactEmail, setContactEmail] = useState(household?.contactEmail ?? '');
  const [status, setStatus] = useState(household?.status ?? 'ACTIVE');
  const [unlinkResident, setUnlinkResident] = useState(false);
  const [reason, setReason] = useState('');
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!household) return;
      if (reason.trim().length < 10)
        throw new Error('Provide an administrative reason of at least 10 characters.');
      return unwrap(
        adminEstateService.updateHousehold(household.id, {
          unitLabel: unitLabel.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          status,
          unlinkResident: unlinkResident || undefined,
          reason: reason.trim(),
        })
      );
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'estates'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <Dialog
        open={Boolean(household)}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="p-6">
          <DialogTitle className="font-semibold">Correct household</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Changes apply platform-wide and are written to the audit trail.
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <Field label="Unit label">
              <Input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact phone">
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </Field>
              <Field label="Contact email">
                <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </Field>
            </div>
            <Field label="Status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as typeof status)}
                options={householdStatusOptions}
              />
            </Field>
            {household?.residentLinked && (
              <Checkbox
                checked={unlinkResident}
                onCheckedChange={setUnlinkResident}
                label="Unlink the current resident account from this household"
              />
            )}
            <Field label="Administrative reason" required>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="At least 10 characters"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={!household}
                isLoading={mutation.isPending}
                loadingText="Saving…"
              >
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Corrects a due's amount: only ever offered while it's still pending/overdue. */
export function DueAmountDialog({
  due,
  onClose,
}: {
  due: AdminEstateDueQueue | null;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [amount, setAmount] = useState(due ? due.amount : 0);
  const [reason, setReason] = useState('');
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!due) return;
      const parsed = Number(amount);
      if (!Number.isInteger(parsed) || parsed < 0)
        throw new Error('Enter a whole, non-negative amount.');
      if (reason.trim().length < 10)
        throw new Error('Provide an administrative reason of at least 10 characters.');
      return unwrap(adminEstateService.adjustDueAmount(due.id, parsed, reason.trim()));
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'estates'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <Dialog
        open={Boolean(due)}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="p-6">
          <DialogTitle className="font-semibold">Adjust due amount</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {due?.residentName ? `${due.residentName} · ` : ''}
            Only available while the due is still pending or overdue.
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <Field label="Amount">
              <CurrencyInput value={amount} onValueChange={setAmount} prefix="₦" allowZero />
            </Field>
            <Field label="Administrative reason" required>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="At least 10 characters"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={!due}
                isLoading={mutation.isPending}
                loadingText="Saving…"
              >
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
