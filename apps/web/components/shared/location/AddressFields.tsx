'use client';

import type { ReactNode } from 'react';
import { Field } from '@getrentos/ui';
import type { AddressValue, VerifiedAddress } from '@getrentos/shared';
import { AddressInput } from './AddressInput';
import { LocationFields } from './LocationFields';

/** The address part of a form: what was picked or typed, and the city and state it sits in. */
export interface AddressFieldsValue {
  address: string;
  city: string;
  state: string;
  country: string;
  /** Set when the address was picked from Google; the API checks it again on save. */
  placeId?: string;
  checked?: VerifiedAddress;
}

interface AddressFieldsProps {
  value: AddressFieldsValue;
  onChange: (patch: Partial<AddressFieldsValue>) => void;
  /** Called with Google's point after a pick, to start a map pin there. */
  onPin?: (point: { latitude: number; longitude: number }) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /**
   * Let the person type an address Google does not know (common for new
   * streets). It is saved as unchecked and asks for the state and city.
   */
  allowManual?: boolean;
  /** Show the city picker for a typed address (default true). */
  showCity?: boolean;
  placeholder?: string;
}

/**
 * Address search plus everything an address form needs around it: a picked
 * address fills in the city, state and country (and the map pin through
 * `onPin`); a typed one, where allowed, asks for the state and city instead.
 */
export function AddressFields({
  value,
  onChange,
  onPin,
  label = 'Address',
  hint,
  error,
  required,
  allowManual = true,
  showCity = true,
  placeholder,
}: AddressFieldsProps) {
  const current: AddressValue | null = value.address
    ? { text: value.address, placeId: value.placeId, verified: value.checked }
    : null;

  const onAddress = (next: AddressValue | null) => {
    if (next?.verified) {
      const v = next.verified;
      onChange({
        address: next.text,
        placeId: v.placeId,
        checked: v,
        city: v.city,
        state: v.state,
        country: v.country,
      });
      onPin?.({ latitude: v.latitude, longitude: v.longitude });
    } else {
      onChange({ address: next?.text ?? '', placeId: undefined, checked: undefined });
    }
  };

  const typed = !!value.address && !value.placeId;

  return (
    <>
      <Field
        label={label}
        required={required}
        error={error}
        hint={
          value.placeId
            ? undefined
            : (hint ??
              (allowManual
                ? 'Pick your address from the suggestions so we can check it. If it is not listed, keep what you typed.'
                : 'Pick your address from the suggestions so we can check it.'))
        }
      >
        <AddressInput
          value={current}
          onChange={onAddress}
          allowManual={allowManual}
          placeholder={placeholder}
        />
      </Field>
      {typed && allowManual && (
        <LocationFields
          country={value.country}
          state={value.state}
          city={value.city}
          onCountryChange={(country) => onChange({ country })}
          onStateChange={(state) => onChange({ state })}
          onCityChange={(city) => onChange({ city })}
          showCity={showCity}
          required={required}
        />
      )}
    </>
  );
}
