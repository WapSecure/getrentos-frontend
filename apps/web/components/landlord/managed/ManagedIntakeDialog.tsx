'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Button,
  CurrencyInput,
  Dialog,
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

const fieldClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

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
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">Service level</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as ServicingTier)}
              className={fieldClass}
            >
              {cards.map((c) => (
                <option key={c.tier} value={c.tier}>
                  {c.name}: {c.feePct}% of rent collected
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              What kind of property is it?
            </span>
            <select
              value={propertyClass}
              onChange={(e) => setPropertyClass(e.target.value as ManagedPropertyClass)}
              className={fieldClass}
            >
              {Object.entries(PROPERTY_CLASS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Units</span>
              <input
                inputMode="numeric"
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value.replace(/\D/g, ''))}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Occupied now</span>
              <input
                inputMode="numeric"
                value={occupied}
                onChange={(e) => setOccupied(e.target.value.replace(/\D/g, ''))}
                className={fieldClass}
              />
            </label>
          </div>
          {occupiedUnits > units && (
            <p className="text-xs text-destructive">Occupied units can’t be more than units.</p>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              Rent a year across the property (optional)
            </span>
            <CurrencyInput prefix="₦" value={rentRoll || ''} onValueChange={setRentRoll} />
          </label>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-foreground">
              What do you need help with?
            </legend>
            <div className="flex flex-wrap gap-2">
              {SERVICE_NEEDS.map((need) => {
                const on = needs.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleNeed(need)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      on
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {need}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              Anything we should know? (optional)
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Current manager, tenants in arrears, repairs outstanding…"
              className={fieldClass}
            />
          </label>

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

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="ghost" onClick={onClose} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button onClick={() => submit.mutate()} disabled={invalid || submit.isPending}>
            {submit.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
            Send request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
