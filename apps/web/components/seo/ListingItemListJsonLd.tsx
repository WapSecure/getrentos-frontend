import { JsonLd } from '@/components/seo/JsonLd';
import { listingPath, type PublicListingKind } from '@/lib/listingSlug';
import { itemListJsonLd } from '@/lib/structuredData';

/** The server-rendered first page of a market as an ItemList; each item is a real listing page. */
export function ListingItemListJsonLd({
  kind,
  listings,
}: {
  kind: PublicListingKind;
  listings: { id: string; title: string }[];
}) {
  if (!listings.length) return null;
  return (
    <JsonLd
      data={itemListJsonLd(
        listings.map((listing) => ({
          name: listing.title,
          path: listingPath(kind, listing.id, listing.title),
        }))
      )}
    />
  );
}
