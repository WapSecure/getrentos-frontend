import { ArrowLink } from '@/components/marketing/ArrowLink';
import { Container } from '@/components/marketing/Container';
import { ListingTile } from '@/components/marketing/ListingTile';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { latestListings } from '@/lib/latestListings';
import type { PublicListingCard, PublicMarket } from '@/lib/publicListingMap';

const ROWS: { market: PublicMarket; title: string; href: string; cta: string }[] = [
  { market: 'rent', title: 'To rent', href: '/rent', cta: 'All homes to rent' },
  { market: 'sale', title: 'For sale', href: '/buy', cta: 'All homes for sale' },
];

const Row = ({
  title,
  href,
  cta,
  market,
  items,
}: (typeof ROWS)[number] & { items: PublicListingCard[] }) => (
  <div className="border-t border-border pt-8">
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
      <h3 className="label-caps">{title}</h3>
      <ArrowLink href={href}>{cta}</ArrowLink>
    </div>
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((listing) => (
        // Below the hero on every screen size, so lazy: eager photos here compete with the hero's LCP image.
        <ListingTile key={listing.id} listing={listing} market={market} />
      ))}
    </div>
  </div>
);

/** Live listings rendered on the server so they are in the first HTML. Hidden when there are none. */
export async function LatestListings() {
  const [rent, sale] = await Promise.all([latestListings('rent', 3), latestListings('sale', 3)]);
  const rows = ROWS.map((row) => ({ ...row, items: row.market === 'rent' ? rent : sale })).filter(
    (row) => row.items.length > 0
  );
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="latest-title" className="py-20 md:py-28">
      <Container>
        <SectionIntro
          id="latest-title"
          eyebrow="New on Sureground"
          title="Recently listed"
          lead="The newest homes from landlords, owners and agents. A verified mark means our team has checked the property's documents."
        />
        <div className="flex flex-col gap-16">
          {rows.map((row) => (
            <Row key={row.market} {...row} />
          ))}
        </div>
      </Container>
    </section>
  );
}
