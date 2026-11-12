import type { PublicListingDetail } from '@/lib/publicListingDetail';
import { SITE_URL } from '@/lib/site';

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/**
 * The listings a market page shows, each pointing at its own listing page (Google's summary-page
 * list format). Only for the unfiltered first page: filtered views are noindex.
 */
export function itemListJsonLd(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `${SITE_URL}${item.path}`,
    })),
  };
}

const PRICE_UNIT: Record<string, string> = { month: 'MON', year: 'ANN' };

/**
 * A RealEstateListing describing only what the page shows: no ratings, no invented dates.
 * Rentals carry a per-month or per-year price; land is a Place rather than a home.
 */
export function listingJsonLd(listing: PublicListingDetail, path: string) {
  const url = `${SITE_URL}${path}`;
  const address = {
    '@type': 'PostalAddress',
    ...(listing.address ? { streetAddress: listing.address } : {}),
    addressLocality: listing.location,
    addressCountry: 'NG',
  };
  const subject =
    listing.market === 'land'
      ? { '@type': 'Place', name: listing.title, address }
      : {
          '@type': 'Accommodation',
          name: listing.title,
          address,
          ...(listing.bedrooms ? { numberOfBedrooms: listing.bedrooms } : {}),
          ...(listing.bathrooms ? { numberOfBathroomsTotal: listing.bathrooms } : {}),
          ...(listing.size
            ? { floorSize: { '@type': 'QuantitativeValue', value: listing.size, unitCode: 'MTK' } }
            : {}),
          ...(listing.amenities.length
            ? {
                amenityFeature: listing.amenities.map((name) => ({
                  '@type': 'LocationFeatureSpecification',
                  name,
                  value: true,
                })),
              }
            : {}),
        };
  const unit =
    listing.market === 'rent' && listing.priceUnit ? PRICE_UNIT[listing.priceUnit] : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    ...(listing.description ? { description: listing.description } : {}),
    url,
    ...(listing.images.length ? { image: listing.images.slice(0, 6) } : {}),
    about: subject,
    offers: {
      '@type': 'Offer',
      url,
      price: listing.price,
      priceCurrency: 'NGN',
      businessFunction:
        listing.market === 'rent'
          ? 'http://purl.org/goodrelations/v1#LeaseOut'
          : 'http://purl.org/goodrelations/v1#Sell',
      availability: listing.underOffer
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock',
      ...(unit
        ? {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: listing.price,
              priceCurrency: 'NGN',
              unitCode: unit,
            },
          }
        : {}),
      ...(listing.availableFrom ? { availabilityStarts: listing.availableFrom } : {}),
    },
  };
}
