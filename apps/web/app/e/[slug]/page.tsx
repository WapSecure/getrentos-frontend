import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { EstateMicrositePageClient } from '@/components/estate/microsite/EstateMicrositePageClient';
import type { EstateStorefront } from '@/types/estate-marketplace';

interface EstateMicrositePageProps {
  params: Promise<{ slug: string }>;
}

// A 404 must reach notFound() so the response is a 404; other failures resolve to `error` so error.tsx can offer a retry.
type ProfileResult =
  | { kind: 'ok'; profile: EstateStorefront }
  | { kind: 'missing' }
  | { kind: 'error' };

async function fetchProfile(slug: string): Promise<ProfileResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/estate-storefronts/${slug}`, { cache: 'no-store' });
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error' };
    return { kind: 'ok', profile: (await res.json()) as EstateStorefront };
  } catch {
    return { kind: 'error' };
  }
}

export async function generateMetadata({ params }: EstateMicrositePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchProfile(slug);

  if (result.kind !== 'ok') {
    // No brand: the root layout's title template appends it.
    // `noindex` is load-bearing: the root Suspense boundary flushes a 200 before notFound() runs, so this keeps a dead estate out of search.
    return { title: 'Estate not found', robots: { index: false, follow: false } };
  }

  const { profile } = result;
  const description = profile.bio || `${profile.name} is on Sureground.`;

  return {
    title: profile.name,
    description,
    alternates: { canonical: `/e/${slug}` },
    openGraph: {
      title: profile.name,
      description,
      images: profile.bannerUrl ? [profile.bannerUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.name,
      description,
      images: profile.bannerUrl ? [profile.bannerUrl] : undefined,
    },
  };
}

export default async function EstateMicrositePage({ params }: EstateMicrositePageProps) {
  const { slug } = await params;

  const result = await fetchProfile(slug);

  if (result.kind === 'missing') notFound();
  if (result.kind === 'error') throw new Error(`Could not load estate microsite "${slug}"`);

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <EstateMicrositePageClient slug={slug} initialProfile={result.profile} />
      <Footer />
    </main>
  );
}
