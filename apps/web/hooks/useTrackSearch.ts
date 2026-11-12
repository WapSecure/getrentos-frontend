'use client';

import { useEffect, useRef } from 'react';
import {
  searchFilterProps,
  type SearchFilterKey,
  type ShowroomEventMarket,
} from '@sureground/shared/showroom';
import { track } from '@/lib/analytics';
import { serialise, type UrlValue } from '@/hooks/useUrlState';

// Browse-state URL keys to the filter names the API accepts. Page, view and the selected pin are not filters.
const FILTER_OF: Record<string, SearchFilterKey> = {
  q: 'query',
  area: 'area',
  city: 'city',
  state: 'state',
  estate: 'estate',
  minPrice: 'min_price',
  maxPrice: 'max_price',
  beds: 'bedrooms',
  baths: 'bathrooms',
  type: 'property_type',
  verified: 'verified',
  furnished: 'furnished',
  pets: 'pets',
  monthly: 'monthly',
  sort: 'sort',
  title: 'title_type',
  minArea: 'min_size',
  assurance: 'assurance',
  road: 'road',
  guests: 'guests',
  checkIn: 'check_in',
  checkOut: 'check_out',
  instant: 'instant_book',
  power: 'power',
  amenities: 'amenities',
};

/**
 * Sends `search_submit` with the names of the filters in use, never their values, whenever the set of
 * filters changes. The view a page opens with is not counted, and neither is clearing every filter.
 * Takes the same state and defaults as `useSyncUrlState`.
 */
export function useTrackSearch(
  market: ShowroomEventMarket,
  surface: string,
  state: Record<string, UrlValue>,
  defaults: Record<string, UrlValue> = {}
) {
  const used = Object.entries(state)
    .filter(([key, value]) => {
      const text = serialise(value);
      return key in FILTER_OF && text !== undefined && text !== serialise(defaults[key]);
    })
    .map(([key]) => FILTER_OF[key]);
  const signature = searchFilterProps(used).filters ?? '';
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (last.current === null || last.current === signature) {
      last.current = signature;
      return;
    }
    last.current = signature;
    if (!signature) return;
    track({
      name: 'search_submit',
      market,
      surface,
      props: searchFilterProps(signature.split(',')),
    });
  }, [signature, market, surface]);
}

/** For a search box that navigates: one event per submit. */
export function trackSearchSubmit(
  market: ShowroomEventMarket,
  surface: string,
  filters: SearchFilterKey[]
) {
  track({ name: 'search_submit', market, surface, props: searchFilterProps(filters) });
}
