import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { EstatesDirectoryBrowser } from '@/components/estate/EstatesDirectoryBrowser';
import type { EstateDirectoryEntry } from '@/types/estate-marketplace';
import type { Paginated } from '@/lib/apiHelpers';

export const metadata: Metadata = {
  title: 'Estates — Browse Properties by Estate',
  description:
    'Browse homes marketed by estates across Nigeria. See every property inside an estate — those its own team lists and those its residents own — and who is marketing each one.',
  alternates: { canonical: '/estates' },
  openGraph: {
    title: 'Estates on GetRentos',
    description: 'Browse homes marketed by estates across Nigeria, and see who is marketing each one.',
    url: '/estates',
    type: 'website',
  },
};

const FIRST_PAGE_SIZE = 12;

/**
 * Fetch the first page on the server.
 *
 * This is a public directory, so the point of it is to be found: rendering the
 * estate names and cities into the HTML is what lets a crawler index them. It
 * also means the first paint already has content instead of a skeleton.
 * Failures return null — the client refetches, so a directory page should
 * degrade to "loading" rather than error.
 */
async function fetchFirstPage(): Promise<Paginated<EstateDirectoryEntry> | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/estate-storefronts?page=1&pageSize=${FIRST_PAGE_SIZE}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Paginated<EstateDirectoryEntry>;
  } catch {
    return null;
  }
}

export default async function EstatesDirectoryPage() {
  const initialData = await fetchFirstPage();

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <EstatesDirectoryBrowser initialData={initialData ?? undefined} />
      <Footer />
    </main>
  );
}
