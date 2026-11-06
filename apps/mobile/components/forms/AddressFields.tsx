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
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  /** Let the person keep an address Google does not know; saved unchecked, with state and city asked. */
  allowManual?: boolean;
  placeholder?: string;
  errors?: { country?: string; state?: string; city?: string };
}

/**
 * Address search plus what an address form needs around it, the native twin
 * of AddressFields on web: a picked address fills in city, state and country
 * (and the map pin through `onPin`); a typed one asks for state and city.
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
  placeholder,
  errors,
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

  return (
    <>
      <AddressInput
        label={label}
        required={required}
        error={error}
        value={current}
        onChange={onAddress}
        allowManual={allowManual}
        placeholder={placeholder}
        hint={
          hint ??
          (allowManual
            ? 'Pick your address from the suggestions so we can check it. If it is not listed, keep what you typed.'
            : 'Pick your address from the suggestions so we can check it.')
        }
      />
      {value.address && !value.placeId && allowManual ? (
        <LocationFields
          country={value.country}
          state={value.state}
          city={value.city}
          onCountryChange={(country) => onChange({ country })}
          onStateChange={(state) => onChange({ state })}
          onCityChange={(city) => onChange({ city })}
          errors={errors}
        />
      ) : null}
    </>
  );
}
