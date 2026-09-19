import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { EstateMicrositePageClient } from '@/components/estate/microsite/EstateMicrositePageClient';
import type { EstateMicrositeProfile } from '@/types/estate-microsite';

interface EstateMicrositePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * The API answers 404 for a slug that is switched off, suspended, or whose
 * owner no longer holds a plan that grants a microsite. Each of those is a real
 * "gone", so it has to reach the client as Next's notFound() — resolving it to
 * a null profile instead made the page answer 200 with a not-found body, which
 * invites search engines to index a dead page.
 *
 * A failure that is NOT a 404 is a different thing and must not be reported as
 * "this does not exist": it resolves to `error` so the segment error boundary
 * can offer a retry. Previously every failure collapsed into null, which meant
 * error.tsx could never fire — a timeout was indistinguishable from a dead
 * estate.
 */
type ProfileResult =
  | { kind: 'ok'; profile: EstateMicrositeProfile }
  | { kind: 'missing' }
  | { kind: 'error' };

async function fetchProfile(slug: string): Promise<ProfileResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/estate-microsites/${slug}`, { cache: 'no-store' });
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error' };
    return { kind: 'ok', profile: (await res.json()) as EstateMicrositeProfile };
  } catch {
    return { kind: 'error' };
  }
}

export async function generateMetadata({ params }: EstateMicrositePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchProfile(slug);

  if (result.kind !== 'ok') {
    // No brand here: the root layout's `%s | GetRentos` template already appends
    // it, so including it produced "Estate not found | GetRentos | GetRentos".
    //
    // `noindex` is load-bearing, not belt-and-braces. `app/loading.tsx` puts a
    // Suspense boundary at the root, so the shell — and its 200 status — is
    // flushed before this page can reach notFound(). The body is the 404 page
    // but the code stays 200, so this directive is what actually keeps a dead
    // estate out of search results.
    return { title: 'Estate not found', robots: { index: false, follow: false } };
  }

  const { profile } = result;
  const description = profile.bio || `${profile.name} is on GetRentos.`;

  return {
    title: profile.name,
    description,
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

  // Pre-fetch the profile server-side (also used for metadata) so the client
  // component hydrates instantly instead of re-fetching the same endpoint.
  const result = await fetchProfile(slug);

  // A dead slug renders the 404 page and, importantly, answers with a 404.
  if (result.kind === 'missing') notFound();
  // Anything else throws into error.tsx, which is the only thing that can
  // honestly offer "Try again".
  if (result.kind === 'error') throw new Error(`Could not load estate microsite "${slug}"`);

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <EstateMicrositePageClient slug={slug} initialProfile={result.profile} />
      <Footer />
    </main>
  );
}
