'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  Field,
  NumberInput,
  Select,
  Textarea,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@getrentos/ui';

import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import type { ManagedTierCard, ServicingTier } from '@/services/mandateService';
import {
  PROPERTY_CLASS_LABEL,
  submitIntake,
  type ManagedIntake,
  type ManagedPropertyClass,
} from '@/services/managedIntakeService';

const SERVICE_NEEDS = [
  'Find tenants',
  'Collect rent',
  'Chase arrears',
  'Repairs and upkeep',
  'Service charge',
  'Legal notices',
  'Vacant property care',
];

interface ManagedIntakeDialogProps {
  property: { id: string; name: string } | null;
  cards: ManagedTierCard[];
  onClose: () => void;
  onSubmitted: (intake: ManagedIntake) => void;
}

/**
 * The owner's ask: what the property is and what they need. The fee shown is
 * indicative — GetRentos visits first and the proposal is what binds — so it is
 * labelled that way rather than presented as a quote.
 */
export const ManagedIntakeDialog = ({
  property,
  cards,
  onClose,
  onSubmitted,
}: ManagedIntakeDialogProps) => {
  const [tier, setTier] = useState<ServicingTier>('FULL_MANAGEMENT');
  const [propertyClass, setPropertyClass] = useState<ManagedPropertyClass>('BLOCK_OF_FLATS');
  const [unitCount, setUnitCount] = useState('1');
  const [occupied, setOccupied] = useState('0');
  const [rentRoll, setRentRoll] = useState(0);
  const [needs, setNeeds] = useState<string[]>(['Collect rent']);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const card = cards.find((c) => c.tier === tier);
  const units = Number(unitCount);
  const occupiedUnits = Number(occupied);
  const monthly = card && rentRoll > 0 ? Math.round((rentRoll / 12) * (card.feePct / 100)) : null;
  const invalid =
    !Number.isInteger(units) ||
    units < 1 ||
    !Number.isInteger(occupiedUnits) ||
    occupiedUnits < 0 ||
    occupiedUnits > units;

  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        submitIntake({
          propertyId: property!.id,
          requestedTier: tier,
          propertyClass,
          unitCount: units,
          occupiedUnits,
          ...(rentRoll > 0 ? { annualRentRoll: rentRoll } : {}),
          serviceNeeds: needs,
          ...(notes.trim() ? { ownerNotes: notes.trim() } : {}),
        })
      ),
    onSuccess: (intake) => {
      setError(null);
      onSubmitted(intake);
    },
    onError: (err: Error) => setError(err.message || 'Could not send your request.'),
  });

  const toggleNeed = (need: string) =>
    setNeeds((prev) => (prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]));

  return (
    <Dialog open={!!property} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
        <div className="border-b border-border p-4">
          <DialogTitle className="font-semibold text-foreground">
            Ask GetRentos to manage {property?.name}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            Tell us about the property. We visit, then send you a proposal to accept. Nothing is
            agreed until you accept it.
          </DialogDescription>
        </div>

        <div className="space-y-4 p-4">
          <Field label="Service level">
            <Select
              ariaLabel="Service level"
              value={tier}
              onValueChange={(v) => setTier(v as ServicingTier)}
              options={cards.map((c) => ({
                value: c.tier,
                label: `${c.name}: ${c.feePct}% of rent collected`,
              }))}
            />
          </Field>

          <Field label="What kind of property is it?">
            <Select
              ariaLabel="What kind of property is it?"
              value={propertyClass}
              onValueChange={(v) => setPropertyClass(v as ManagedPropertyClass)}
              options={Object.entries(PROPERTY_CLASS_LABEL).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Units">
              <NumberInput value={unitCount} onValueChange={setUnitCount} />
            </Field>
            <Field
              label="Occupied now"
              error={occupiedUnits > units ? 'Can’t be more than units.' : undefined}
            >
              <NumberInput value={occupied} onValueChange={setOccupied} />
            </Field>
          </div>

          <Field
            label="Rent a year across the property"
            hint="Optional. Used for the fee estimate."
          >
            <CurrencyInput prefix="₦" value={rentRoll || ''} onValueChange={setRentRoll} />
          </Field>

          <Field label="What do you need help with?">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SERVICE_NEEDS.map((need) => (
                <Checkbox
                  key={need}
                  checked={needs.includes(need)}
                  onCheckedChange={() => toggleNeed(need)}
                  label={need}
                />
              ))}
            </div>
          </Field>

          <Field label="Anything we should know?" hint="Optional.">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Current manager, tenants in arrears, repairs outstanding…"
            />
          </Field>

          {card && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">
                Indicative fee: {card.feePct}% of rent collected
                {monthly !== null && <> (about {formatCurrency(monthly)} a month)</>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Not binding. Your proposal follows our site visit. Letting{' '}
                {card.lettingCommissionPct}%, renewal {card.renewalCommissionPct}%.
              </p>
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="ghost" onClick={onClose} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button onClick={() => submit.mutate()} disabled={invalid} isLoading={submit.isPending}>
            Send request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
