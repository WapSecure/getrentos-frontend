'use client';

import { AddressSearch, type AddressSearchProps } from '@getrentos/ui';
import { placesService } from '@/services/placesService';

export type AddressInputProps = Omit<AddressSearchProps, 'search' | 'resolve'>;

/**
 * The backoffice address field: Google suggestions as the person types, and a
 * checked address (street, area, LGA, state, map pin) once they pick one. Use
 * it wherever someone enters a real-world address or area.
 */
export function AddressInput(props: AddressInputProps) {
  return <AddressSearch search={placesService.search} resolve={placesService.resolve} {...props} />;
}
