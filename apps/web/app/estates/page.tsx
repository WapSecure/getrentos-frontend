import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { publicFetchInit } from '@/lib/publicFetch';
import { Navigation } from '@/components/layout/Navigation';
import { PageHero } from '@/components/marketing/PageHero';
import { EstatesDirectoryBrowser } from '@/components/estate/EstatesDirectoryBrowser';
import type { EstateDirectoryEntry } from '@/types/estate-marketplace';
import type { Paginated } from '@/lib/apiHelpers';
import { SITE_OG_IMAGES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Estates: browse homes by estate',
  description:
    'Browse homes marketed by estates across Nigeria. See the live listings inside each estate, and whether the estate or the owner listed each one.',
  alternates: { canonical: '/estates' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: 'Estates on Sureground',
    description: 'Browse homes inside estates across Nigeria, and see who listed each one.',
    url: '/estates',
    type: 'website',
  },
};

const FIRST_PAGE_SIZE = 12;

async function fetchFirstPage(): Promise<Paginated<EstateDirectoryEntry> | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(
      `${apiUrl}/estate-storefronts?page=1&pageSize=${FIRST_PAGE_SIZE}`,
      publicFetchInit()
    );
    if (!res.ok) return null;
    return (await res.json()) as Paginated<EstateDirectoryEntry>;
  } catch {
    return null;
  }
}

export default async function EstatesDirectoryPage() {
  const initialData = await fetchFirstPage();

  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <PageHero
          eyebrow="Estates"
          title="Estates on Sureground"
          lead="Browse the properties marketed inside an estate: the ones its own team lists, and the ones owners in the estate list. Every home shows whether the estate is marketing it or its owner listed it."
        />
        <EstatesDirectoryBrowser initialData={initialData ?? undefined} />
      </main>
      <Footer />
    </>
  );
}
