import { ArrowLink } from './ArrowLink';
import { Container } from './Container';
import { ListingTile } from './ListingTile';
import { SectionIntro } from './SectionIntro';
import { latestListings } from '@/lib/latestListings';
import type { PublicMarket } from '@/lib/publicListingMap';

interface ListingStripProps {
  market: PublicMarket;
  id: string;
  title: string;
  href: string;
  cta: string;
}

/** Three of the newest live listings, rendered on the server. Hidden when there are none. */
export async function ListingStrip({ market, id, title, href, cta }: ListingStripProps) {
  const items = await latestListings(market, 3);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={id} className="py-20 md:py-28">
      <Container>
        <SectionIntro
          id={id}
          eyebrow="New on Sureground"
          title={title}
          lead="A verified mark means our team has checked the property's documents."
          action={<ArrowLink href={href}>{cta}</ArrowLink>}
        />
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((listing) => (
            <ListingTile key={listing.id} listing={listing} market={market} />
          ))}
        </div>
      </Container>
    </section>
  );
}
