'use client';

import { AddressSearch, type AddressSearchProps } from '@sureground/ui';
import { placesService } from '@/services/placesService';

export type AddressInputProps = Omit<AddressSearchProps, 'search' | 'resolve'>;

export function AddressInput(props: AddressInputProps) {
  return <AddressSearch search={placesService.search} resolve={placesService.resolve} {...props} />;
}
