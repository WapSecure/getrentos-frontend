import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Chip,
  FormAlert,
  NumberField,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
} from '@sureground/ui-native';
import {
  COMMERCIAL_FIT_OUT_LABEL,
  COMMERCIAL_LIMITS,
  COMMERCIAL_PERMITTED_USE_LABEL,
  LEASE_TERM_CHOICES,
  LEASE_TERM_LIMITS,
  addLeaseTerm,
  commercialDealCopy,
  type CommercialDeal,
  type CommercialFitOutCondition,
  type CommercialPermittedUse,
  type CommercialStated,
  type CommercialValues,
} from '@sureground/shared/showroom';
import { ChipSelect } from '@/components/landlord/ChipSelect';

const STATED_OPTIONS: { value: CommercialStated; label: string }[] = [
  { value: '', label: 'Not stated' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const permittedUseOptions: { value: CommercialPermittedUse | ''; label: string }[] = [
  { value: '', label: 'Not stated' },
  ...(Object.entries(COMMERCIAL_PERMITTED_USE_LABEL) as [CommercialPermittedUse, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];
const fitOutOptions: { value: CommercialFitOutCondition | ''; label: string }[] = [
  { value: '', label: 'Not stated' },
  ...(Object.entries(COMMERCIAL_FIT_OUT_LABEL) as [CommercialFitOutCondition, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];

function StatedChoice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CommercialStated;
  onChange: (next: CommercialStated) => void;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
        {label}
      </Text>
      <SegmentedControl
        accessibilityLabel={label}
        options={STATED_OPTIONS}
        value={value}
        onChange={onChange}
      />
    </View>
  );
}

/**
 * The commercial block on the landlord, owner and realtor listing forms, as on the web. Everything
 * is optional and is the lister's own statement; renters or buyers see it exactly as stated.
 */
export function CommercialDetailsFields({
  value,
  onChange,
  deal = 'rent',
  error,
}: {
  value: CommercialValues;
  onChange: (next: CommercialValues) => void;
  /** A sale talks about the price and buyers; a let about the rent and renters. */
  deal?: CommercialDeal;
  /** The first problem from `commercialError`, shown under the fields. */
  error?: string | null;
}) {
  const { spacing } = useTheme();
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

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xxs }}>
        <Text variant="bodyStrong" headingLevel={3}>
          Commercial details
        </Text>
        <Text variant="caption" color="mutedForeground">
          All optional. {audience} see these exactly as you state them; leave anything you haven’t
          decided blank.
        </Text>
      </View>

      <ChipSelect
        label="Permitted use"
        options={permittedUseOptions}
        value={value.permittedUse}
        onChange={(v) => set('permittedUse', v)}
      />
      <TextField
        label="Use notes"
        hint="For example, “No food preparation” or “Ground floor retail only”."
        value={value.permittedUseNote}
        onChangeText={(v) => set('permittedUseNote', v)}
        maxLength={COMMERCIAL_LIMITS.shortNote}
        optional
      />
      <ChipSelect
        label="Fit-out"
        options={fitOutOptions}
        value={value.fitOutCondition}
        onChange={(v) => set('fitOutCondition', v)}
      />

      <NumberField
        label="Lettable area"
        unit="m²"
        decimals={2}
        value={value.lettableAreaSqm}
        onValueChange={(v) => set('lettableAreaSqm', v)}
        placeholder="Not stated"
      />
      <NumberField
        label="Parking spaces"
        value={value.parkingSpaces}
        onValueChange={(v) => set('parkingSpaces', v)}
        placeholder="Not stated"
        maxLength={5}
      />
      <NumberField
        label="Public power supply (hours a day, as stated by you)"
        hint={`Your own estimate. ${audience} see it labelled as stated by you.`}
        value={value.publicSupplyHoursStated}
        onValueChange={(v) => set('publicSupplyHoursStated', v)}
        placeholder="Not stated"
        maxLength={2}
      />

      <StatedChoice
        label="Generator"
        value={value.generator}
        onChange={(v) => set('generator', v)}
      />
      {value.generator === 'yes' ? (
        <TextField
          label="Generator capacity"
          hint="For example, “100 kVA, shared with the building”."
          value={value.generatorNote}
          onChangeText={(v) => set('generatorNote', v)}
          maxLength={COMMERCIAL_LIMITS.shortNote}
          optional
        />
      ) : null}
      <StatedChoice label="Solar" value={value.solar} onChange={(v) => set('solar', v)} />
      <StatedChoice
        label="Loading access"
        value={value.loadingAccess}
        onChange={(v) => set('loadingAccess', v)}
      />
      {value.loadingAccess === 'yes' ? (
        <TextField
          label="Loading access details"
          hint="For example, “Rear bay, 3 m clearance”."
          value={value.loadingAccessNote}
          onChangeText={(v) => set('loadingAccessNote', v)}
          maxLength={COMMERCIAL_LIMITS.shortNote}
          optional
        />
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          Lease terms on offer
        </Text>
        <View
          accessibilityLabel="Lease terms on offer"
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
        >
          {termChips.map((years) => {
            const selected = terms.includes(years);
            return (
              <Chip
                key={years}
                size="sm"
                label={years === 1 ? '1 year' : `${years} years`}
                selected={selected}
                disabled={!selected && atTermLimit}
                onPress={() => toggleTerm(years)}
              />
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <NumberField
              label="Other (years)"
              hint={
                atTermLimit
                  ? 'That is the most you can offer: 10 lease terms.'
                  : 'A whole number of years from 1 to 99. Up to 10 lease terms in total.'
              }
              error={otherTermError}
              value={otherTerm}
              onValueChange={(v) => {
                setOtherTerm(v);
                setOtherTermError(null);
              }}
              onSubmitEditing={addOtherTerm}
              placeholder="For example, 4"
              maxLength={2}
              editable={!atTermLimit}
            />
          </View>
          <Button
            label="Add"
            variant="outline"
            size="sm"
            fullWidth={false}
            style={{ marginTop: 28 }}
            disabled={atTermLimit || otherTerm.trim() === ''}
            onPress={addOtherTerm}
          />
        </View>
      </View>

      <TextField
        label="Rent review"
        hint="As written in your lease."
        value={value.rentReviewNote}
        onChangeText={(v) => set('rentReviewNote', v)}
        maxLength={COMMERCIAL_LIMITS.leaseNote}
        multiline
        optional
      />
      <TextField
        label="Escalation"
        hint="As written in your lease."
        value={value.escalationNote}
        onChangeText={(v) => set('escalationNote', v)}
        maxLength={COMMERCIAL_LIMITS.leaseNote}
        multiline
        optional
      />

      <NumberField
        label="VAT, as stated by you"
        hint={`${audience} see the rate exactly as you state it. Sureground never calculates or adds VAT.`}
        unit="%"
        decimals={2}
        value={value.vatStatedPct}
        onValueChange={(v) => set('vatStatedPct', v)}
        placeholder="Not stated"
        optional
      />
      <StatedChoice
        label={`${amount} includes VAT`}
        value={value.vatIncluded}
        onChange={(v) => set('vatIncluded', v)}
      />

      {error ? <FormAlert tone="warning" message={error} /> : null}
    </View>
  );
}
