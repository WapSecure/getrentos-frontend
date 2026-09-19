import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { MicrositePageClient } from '@/components/microsite/MicrositePageClient';
import type { MicrositeProfile } from '@/types/microsite';

interface MicrositePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Same contract as the estate page: a 404 from the API is a real "gone" (slug
 * switched off, or the owner's plan no longer grants a microsite) and becomes
 * Next's notFound(), so the response carries a 404 instead of a 200 with a
 * not-found body. Any other failure resolves to `error` so error.tsx can offer
 * a retry rather than claiming the microsite never existed.
 */
type ProfileResult =
  | { kind: 'ok'; profile: MicrositeProfile }
  | { kind: 'missing' }
  | { kind: 'error' };

async function fetchProfile(slug: string): Promise<ProfileResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/microsites/${slug}`, { cache: 'no-store' });
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error' };
    return { kind: 'ok', profile: (await res.json()) as MicrositeProfile };
  } catch {
    return { kind: 'error' };
  }
}

export async function generateMetadata({ params }: MicrositePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchProfile(slug);

  if (result.kind !== 'ok') {
    // Brand omitted on purpose — the root layout's title template appends it.
    //
    // `noindex` is load-bearing: `app/loading.tsx`'s root Suspense boundary
    // flushes the shell (with a 200 status) before notFound() can run, so the
    // status code cannot be relied on to keep a dead microsite out of search.
    return { title: 'Microsite not found', robots: { index: false, follow: false } };
  }

  const { profile } = result;
  const description =
    profile.bio || `Browse rental listings from ${profile.displayName} on GetRentos.`;

  return {
    title: profile.displayName,
    description,
    openGraph: {
      title: profile.displayName,
      description,
      images: profile.bannerUrl ? [profile.bannerUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.displayName,
      description,
      images: profile.bannerUrl ? [profile.bannerUrl] : undefined,
    },
  };
}

export default async function MicrositePage({ params }: MicrositePageProps) {
  const { slug } = await params;

  // Pre-fetch the profile server-side (also used for metadata) so the client
  // component hydrates instantly instead of re-fetching the same endpoint.
  const result = await fetchProfile(slug);

  // A dead slug renders the 404 page and, importantly, answers with a 404.
  if (result.kind === 'missing') notFound();
  if (result.kind === 'error') throw new Error(`Could not load microsite "${slug}"`);

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <MicrositePageClient slug={slug} initialProfile={result.profile} />
      <Footer />
    </main>
  );
}
