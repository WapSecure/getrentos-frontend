import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@sureground/ui';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { CollectionListings } from '@/components/collections/CollectionListings';
import { SponsoredBadge } from '@/components/collections/SponsoredBadge';
import { publicFetchInit } from '@/lib/publicFetch';
import { DETAIL_PATH, toMarketCard } from '@/lib/marketCards';
import {
  COLLECTION_MARKET_LABEL,
  collectionPath,
  curatorLine,
  type PublicCollection,
} from '@/lib/collections';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

type Result =
  | { kind: 'ok'; collection: PublicCollection }
  | { kind: 'missing' }
  | { kind: 'error' };

async function fetchCollection(slug: string): Promise<Result> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/collections/${encodeURIComponent(slug)}`, publicFetchInit());
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error' };
    return { kind: 'ok', collection: (await res.json()) as PublicCollection };
  } catch {
    return { kind: 'error' };
  }
}

const describe = (c: PublicCollection) =>
  c.description?.trim() ||
  `${c.items.length} ${c.items.length === 1 ? 'listing' : 'listings'} picked by ${
    c.curator.type === 'sureground' ? 'the Sureground team' : c.curator.name
  }.`;

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchCollection(slug);
  if (result.kind !== 'ok') {
    return { title: 'Collection not found', robots: { index: false, follow: false } };
  }
  const { collection } = result;
  const title = collection.sponsored ? `${collection.title} (sponsored)` : collection.title;
  const description = describe(collection);
  const cover = collection.cover
    ? toMarketCard(collection.market, collection.cover).image
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: collectionPath(collection.slug) },
    openGraph: {
      title,
      description,
      url: collectionPath(collection.slug),
      type: 'website',
      images: cover ? [cover] : undefined,
    },
    twitter: { card: cover ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const result = await fetchCollection(slug);
  if (result.kind === 'missing') notFound();
  if (result.kind === 'error') throw new Error('The collection could not be loaded.');
  const { collection } = result;
  const marketHref = DETAIL_PATH[collection.market];

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Collection"
          title={collection.title}
          description={collection.description ?? undefined}
          breadcrumbs={[
            { label: COLLECTION_MARKET_LABEL[collection.market], href: marketHref },
            { label: collection.title },
          ]}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {collection.sponsored && <SponsoredBadge />}
              <span>
                {collection.curator.type === 'estate' && collection.curator.estateSlug ? (
                  <>
                    Picked by{' '}
                    <Link
                      href={`/e/${encodeURIComponent(collection.curator.estateSlug)}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {collection.curator.name}
                    </Link>
                  </>
                ) : (
                  curatorLine(collection.curator)
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {collection.items.length} {collection.items.length === 1 ? 'listing' : 'listings'}
              </span>
            </div>
          }
        />
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
          {collection.sponsored ? 'This is a paid placement. ' : ''}
          Listings appear in the order the curator chose. Being in a collection is not a ranking or
          a check: each listing shows its own verification. Listings that are no longer available
          drop out automatically.
        </p>
        <div className="mt-8">
          <CollectionListings collection={collection} />
        </div>
        <p className="mt-10 text-sm">
          <Link href={marketHref} className="font-medium text-primary hover:underline">
            Browse all {COLLECTION_MARKET_LABEL[collection.market].toLowerCase()}
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
