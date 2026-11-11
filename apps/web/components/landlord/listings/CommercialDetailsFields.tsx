'use client';

import { useState, type KeyboardEvent } from 'react';
import {
  Button,
  Field,
  Input,
  NumberInput,
  SegmentedControl,
  Select,
  Textarea,
  ToggleChip,
} from '@sureground/ui';
import {
  COMMERCIAL_FIT_OUT_LABEL,
  COMMERCIAL_PERMITTED_USE_LABEL,
  type CommercialFitOutCondition,
  type CommercialPermittedUse,
} from '@sureground/shared/showroom';
import {
  COMMERCIAL_LIMITS,
  LEASE_TERM_CHOICES,
  LEASE_TERM_LIMITS,
  addLeaseTerm,
  commercialDealCopy,
  type CommercialDeal,
  type CommercialValues,
} from '@/lib/commercialDetails';

export {
  EMPTY_COMMERCIAL,
  commercialError,
  commercialFromDetails,
  commercialToCreatePayload,
  commercialToUpdatePayload,
  type CommercialValues,
} from '@/lib/commercialDetails';

const STATED_SEGMENTS = [
  { value: '' as const, label: 'Not stated' },
  { value: 'yes' as const, label: 'Yes' },
  { value: 'no' as const, label: 'No' },
];

const permittedUseOptions = (
  Object.entries(COMMERCIAL_PERMITTED_USE_LABEL) as [CommercialPermittedUse, string][]
).map(([value, label]) => ({ value, label }));
const fitOutOptions = (
  Object.entries(COMMERCIAL_FIT_OUT_LABEL) as [CommercialFitOutCondition, string][]
).map(([value, label]) => ({ value, label }));

interface CommercialDetailsFieldsProps {
  value: CommercialValues;
  onChange: (next: CommercialValues) => void;
  /** A sale talks about the price and buyers; a let about the rent and renters. */
  deal?: CommercialDeal;
}

/** Everything here is the lister's own statement and is shown to renters or buyers as stated. */
export function CommercialDetailsFields({
  value,
  onChange,
  deal = 'rent',
}: CommercialDetailsFieldsProps) {
  const { audience, amount } = commercialDealCopy(deal);
  const set = <K extends keyof CommercialValues>(key: K, next: CommercialValues[K]) =>
    onChange({ ...value, [key]: next });
  const [otherTerm, setOtherTerm] = useState('');
  const [otherTermError, setOtherTermError] = useState<string | null>(null);
  const terms = value.leaseTermOptionsYears;
  const atTermLimit = terms.length >= LEASE_TERM_LIMITS.count;
  // The usual lengths, plus any other length already on the listing, so it can be removed too.
  const termChips = [...new Set([...LEASE_TERM_CHOICES, ...terms])].sort((a, b) => a - b);
  const toggleTerm = (years: number) => {
    setOtherTermError(null);
    set(
      'leaseTermOptionsYears',
      terms.includes(years)
        ? terms.filter((y) => y !== years)
        : [...terms, years].sort((a, b) => a - b)
    );
  };
  const addOtherTerm = () => {
    const result = addLeaseTerm(terms, otherTerm);
    if (result.error !== undefined) {
      setOtherTermError(result.error);
      return;
    }
    setOtherTermError(null);
    setOtherTerm('');
    set('leaseTermOptionsYears', result.years);
  };
  const onOtherTermKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter adds the term instead of submitting the listing form.
    if (e.key === 'Enter') {
      e.preventDefault();
      addOtherTerm();
    }
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">Commercial details</legend>
      <p className="text-xs text-muted-foreground">
        All optional. {audience} see these exactly as you state them; leave anything you haven’t
        decided blank.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Permitted use">
          <Select
            value={value.permittedUse}
            onValueChange={(v) => set('permittedUse', v as CommercialPermittedUse | '')}
            options={permittedUseOptions}
            placeholder="Not stated"
            clearable
          />
        </Field>
        <Field label="Fit-out">
          <Select
            value={value.fitOutCondition}
            onValueChange={(v) => set('fitOutCondition', v as CommercialFitOutCondition | '')}
            options={fitOutOptions}
            placeholder="Not stated"
            clearable
          />
        </Field>
      </div>

      <Field
        label="Use notes"
        hint="For example, “No food preparation” or “Ground floor retail only”."
      >
        <Input
          type="text"
          value={value.permittedUseNote}
          maxLength={COMMERCIAL_LIMITS.shortNote}
          onChange={(e) => set('permittedUseNote', e.target.value)}
          placeholder="Optional"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Lettable area (m²)">
          <NumberInput
            integer={false}
            value={value.lettableAreaSqm}
            onValueChange={(v) => set('lettableAreaSqm', v)}
            placeholder="Not stated"
            inputMode="decimal"
          />
        </Field>
        <Field label="Parking spaces">
          <NumberInput
            value={value.parkingSpaces}
            onValueChange={(v) => set('parkingSpaces', v)}
            placeholder="Not stated"
            inputMode="numeric"
            maxLength={5}
          />
        </Field>
      </div>

      <Field
        label="Public power supply (hours a day, as stated by you)"
        hint={`Your own estimate. ${audience} see it labelled as stated by you.`}
      >
        <NumberInput
          value={value.publicSupplyHoursStated}
          onValueChange={(v) => set('publicSupplyHoursStated', v)}
          placeholder="Not stated"
          inputMode="numeric"
          maxLength={2}
        />
      </Field>

      <Field label="Generator">
        <SegmentedControl
          aria-label="Generator"
          size="sm"
          value={value.generator}
          onValueChange={(v) => set('generator', v)}
          segments={STATED_SEGMENTS}
        />
      </Field>
      {value.generator === 'yes' && (
        <Field label="Generator capacity" hint="For example, “100 kVA, shared with the building”.">
          <Input
            type="text"
            value={value.generatorNote}
            maxLength={COMMERCIAL_LIMITS.shortNote}
            onChange={(e) => set('generatorNote', e.target.value)}
            placeholder="Optional"
          />
        </Field>
      )}

      <Field label="Solar">
        <SegmentedControl
          aria-label="Solar"
          size="sm"
          value={value.solar}
          onValueChange={(v) => set('solar', v)}
          segments={STATED_SEGMENTS}
        />
      </Field>

      <Field label="Loading access">
        <SegmentedControl
          aria-label="Loading access"
          size="sm"
          value={value.loadingAccess}
          onValueChange={(v) => set('loadingAccess', v)}
          segments={STATED_SEGMENTS}
        />
      </Field>
      {value.loadingAccess === 'yes' && (
        <Field label="Loading access details" hint="For example, “Rear bay, 3 m clearance”.">
          <Input
            type="text"
            value={value.loadingAccessNote}
            maxLength={COMMERCIAL_LIMITS.shortNote}
            onChange={(e) => set('loadingAccessNote', e.target.value)}
            placeholder="Optional"
          />
        </Field>
      )}

      <div className="space-y-2">
        <p className="block text-sm font-medium text-foreground">Lease terms on offer</p>
        <div role="group" aria-label="Lease terms on offer" className="flex flex-wrap gap-2">
          {termChips.map((years) => {
            const pressed = terms.includes(years);
            return (
              <ToggleChip
                key={years}
                size="sm"
                pressed={pressed}
                disabled={!pressed && atTermLimit}
                onPressedChange={() => toggleTerm(years)}
              >
                {years === 1 ? '1 year' : `${years} years`}
              </ToggleChip>
            );
          })}
        </div>
        <Field
          label="Other (years)"
          hint={
            atTermLimit
              ? 'That is the most you can offer: 10 lease terms.'
              : 'A whole number of years from 1 to 99. Up to 10 lease terms in total.'
          }
          error={otherTermError}
        >
          <div className="flex max-w-xs gap-2">
            <NumberInput
              value={otherTerm}
              onValueChange={(v) => {
                setOtherTerm(v);
                setOtherTermError(null);
              }}
              onKeyDown={onOtherTermKeyDown}
              placeholder="For example, 4"
              inputMode="numeric"
              maxLength={2}
              disabled={atTermLimit}
              invalid={!!otherTermError}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOtherTerm}
              disabled={atTermLimit || otherTerm.trim() === ''}
            >
              Add
            </Button>
          </div>
        </Field>
      </div>

      <Field label="Rent review" hint="As written in your lease.">
        <Textarea
          rows={2}
          value={value.rentReviewNote}
          maxLength={COMMERCIAL_LIMITS.leaseNote}
          onChange={(e) => set('rentReviewNote', e.target.value)}
          placeholder="Optional"
        />
      </Field>
      <Field label="Escalation" hint="As written in your lease.">
        <Textarea
          rows={2}
          value={value.escalationNote}
          maxLength={COMMERCIAL_LIMITS.leaseNote}
          onChange={(e) => set('escalationNote', e.target.value)}
          placeholder="Optional"
        />
      </Field>

      <Field
        label="VAT, as stated by you (optional)"
        hint={`${audience} see the rate exactly as you state it. Sureground never calculates or adds VAT.`}
      >
        <NumberInput
          integer={false}
          value={value.vatStatedPct}
          onValueChange={(v) => set('vatStatedPct', v)}
          placeholder="Not stated"
          inputMode="decimal"
          trailingIcon={<span className="text-xs text-muted-foreground">%</span>}
        />
      </Field>
      <Field label={`${amount} includes VAT`}>
        <SegmentedControl
          aria-label={`${amount} includes VAT`}
          size="sm"
          value={value.vatIncluded}
          onValueChange={(v) => set('vatIncluded', v)}
          segments={STATED_SEGMENTS}
        />
      </Field>
    </fieldset>
  );
}
