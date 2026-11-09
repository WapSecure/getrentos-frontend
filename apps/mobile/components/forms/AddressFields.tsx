import type { AddressValue, PlaceKind, VerifiedAddress } from '@sureground/shared';
import { AddressInput } from './AddressInput';
import { LocationFields } from './LocationFields';

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
  onPin?: (point: { latitude: number; longitude: number }) => void;
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  allowManual?: boolean;
  placeholder?: string;
  kind?: PlaceKind;
  errors?: { country?: string; state?: string; city?: string };
}

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
  kind,
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
        kind={kind}
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
