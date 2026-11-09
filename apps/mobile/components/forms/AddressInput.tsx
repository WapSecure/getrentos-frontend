import { AddressSearch, type AddressSearchProps } from '@sureground/ui-native';
import { placesApi } from '@/lib/api/places';

export type AddressInputProps = Omit<AddressSearchProps, 'search' | 'resolve'>;

// The screen's ScrollView needs keyboardShouldPersistTaps="handled".
export function AddressInput(props: AddressInputProps) {
  return <AddressSearch search={placesApi.search} resolve={placesApi.resolve} {...props} />;
}
