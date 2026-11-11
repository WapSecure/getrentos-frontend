'use client';

import {
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
}

/** Everything here is the lister's own statement and is shown to renters as stated. */
export function CommercialDetailsFields({ value, onChange }: CommercialDetailsFieldsProps) {
  const set = <K extends keyof CommercialValues>(key: K, next: CommercialValues[K]) =>
    onChange({ ...value, [key]: next });
  const toggleTerm = (years: number) =>
    set(
      'leaseTermOptionsYears',
      value.leaseTermOptionsYears.includes(years)
        ? value.leaseTermOptionsYears.filter((y) => y !== years)
        : [...value.leaseTermOptionsYears, years]
    );

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">Commercial details</legend>
      <p className="text-xs text-muted-foreground">
        All optional. Renters see these exactly as you state them; leave anything you haven’t
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
        hint="Your own estimate. Renters see it labelled as stated by you."
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

      <div>
        <p className="mb-1.5 block text-sm font-medium text-foreground">Lease terms on offer</p>
        <div role="group" aria-label="Lease terms on offer" className="flex flex-wrap gap-2">
          {LEASE_TERM_CHOICES.map((years) => (
            <ToggleChip
              key={years}
              size="sm"
              pressed={value.leaseTermOptionsYears.includes(years)}
              onPressedChange={() => toggleTerm(years)}
            >
              {years === 1 ? '1 year' : `${years} years`}
            </ToggleChip>
          ))}
        </div>
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
        hint="Renters see the rate exactly as you state it. Sureground never calculates or adds VAT."
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
      <Field label="Rent includes VAT">
        <SegmentedControl
          aria-label="Rent includes VAT"
          size="sm"
          value={value.vatIncluded}
          onValueChange={(v) => set('vatIncluded', v)}
          segments={STATED_SEGMENTS}
        />
      </Field>
    </fieldset>
  );
}
