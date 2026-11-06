import { AddressSearch, type AddressSearchProps } from '@getrentos/ui-native';
import { placesApi } from '@/lib/api/places';

export type AddressInputProps = Omit<AddressSearchProps, 'search' | 'resolve'>;

/**
 * The app's address field: Google suggestions as the person types, and a
 * checked address (street, area, LGA, state, map pin) once they pick one.
 * The screen's ScrollView needs keyboardShouldPersistTaps="handled".
 */
export function AddressInput(props: AddressInputProps) {
  return <AddressSearch search={placesApi.search} resolve={placesApi.resolve} {...props} />;
}
