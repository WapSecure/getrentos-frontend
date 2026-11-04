'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from '@getrentos/ui';
import type { Unit } from '@/types/landlord';

/** What a landlord knows about an occupier who will not use GetRentos themselves. */
export interface OccupierRecord {
  tenantName: string;
  rentAmount: number;
  rentPeriod: 'month' | 'year';
  leaseStart: string;
  leaseEnd: string;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const oneYearAfter = (iso: string) => {
  const date = new Date(iso);
  date.setFullYear(date.getFullYear() + 1);
  return isoDate(date);
};

interface RecordOccupierModalProps {
  unit: Unit | null;
  onClose: () => void;
  onRecord: (unitId: string, record: OccupierRecord) => void;
  isPending?: boolean;
  errorMessage?: string | null;
}

/**
 * Records a tenancy that already exists, for someone who has no GetRentos
 * account. It creates a signed lease, because the agreement is already in
 * force — there is nobody to send it to and nothing to draft.
 */
export const RecordOccupierModal = ({
  unit,
  onClose,
  onRecord,
  isPending,
  errorMessage,
}: RecordOccupierModalProps) => (
  <Dialog open={!!unit} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-md p-0">
      {unit && (
        <RecordOccupierForm
          key={unit.id}
          unit={unit}
          onClose={onClose}
          onRecord={onRecord}
          isPending={isPending}
          errorMessage={errorMessage}
        />
      )}
    </DialogContent>
  </Dialog>
);

const RecordOccupierForm = ({
  unit,
  onClose,
  onRecord,
  isPending,
  errorMessage,
}: {
  unit: Unit;
  onClose: () => void;
  onRecord: (unitId: string, record: OccupierRecord) => void;
  isPending?: boolean;
  errorMessage?: string | null;
}) => {
  const start = isoDate(new Date());
  const period = unit.leaseRentPeriod ?? unit.askingRentPeriod ?? 'year';
  const suggestedRent = unit.leaseRent ?? unit.askingRent;

  const [name, setName] = useState('');
  const [rent, setRent] = useState(suggestedRent !== undefined ? String(suggestedRent) : '');
  const [leaseStart, setLeaseStart] = useState(start);
  const [leaseEnd, setLeaseEnd] = useState(oneYearAfter(start));
  const [validationError, setValidationError] = useState<string | null>(null);

  const submit = () => {
    const tenantName = name.trim();
    const rentAmount = Number(rent);
    if (!tenantName) return setValidationError('Enter the occupier’s name.');
    if (!Number.isFinite(rentAmount) || rentAmount <= 0)
      return setValidationError('Enter the rent you collect for this tenancy.');
    if (!leaseStart || !leaseEnd || leaseEnd <= leaseStart)
      return setValidationError('The tenancy has to end after it starts.');

    setValidationError(null);
    onRecord(unit.id, { tenantName, rentAmount, rentPeriod: period, leaseStart, leaseEnd });
  };

  const message = validationError ?? errorMessage ?? null;

  return (
    <>
      <div className="border-b border-border p-4">
        <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          Record occupier
        </DialogTitle>
        <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
          {unit.propertyName} • {unit.unitName}
        </DialogDescription>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-xs text-muted-foreground">
          For someone already living here who will not use GetRentos. This creates a tenancy you can
          invoice and track rent against. They will not be able to sign in, pay in-app, or carry a
          trust score.
        </p>

        <div>
          <label
            htmlFor="occupier-name"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Occupier name
          </label>
          <Input
            id="occupier-name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Adaeze Okafor"
          />
        </div>

        <div>
          <label
            htmlFor="occupier-rent"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Rent per {period}
          </label>
          <Input
            id="occupier-rent"
            type="number"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label
              htmlFor="occupier-start"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Starts
            </label>
            <Input
              id="occupier-start"
              type="date"
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="occupier-end"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Ends
            </label>
            <Input
              id="occupier-end"
              type="date"
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
            />
          </div>
        </div>

        {message && (
          <p className="text-xs text-destructive" role="alert">
            {message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isPending} disabled={!name.trim()}>
          Save tenancy
        </Button>
      </div>
    </>
  );
};
