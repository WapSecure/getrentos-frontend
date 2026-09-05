import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { EstateMicrositePageClient } from '@/components/estate/microsite/EstateMicrositePageClient';
import type { EstateMicrositeProfile } from '@/types/estate-microsite';

interface EstateMicrositePageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProfile(slug: string): Promise<EstateMicrositeProfile | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/estate-microsites/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as EstateMicrositeProfile;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: EstateMicrositePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await fetchProfile(slug);

  if (!profile) {
    return { title: 'Estate not found | GetRentos' };
  }

  const description = profile.bio || `${profile.name} is on GetRentos.`;

  return {
    title: `${profile.name} | GetRentos`,
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
  const profile = await fetchProfile(slug);

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <EstateMicrositePageClient slug={slug} initialProfile={profile ?? undefined} />
      <Footer />
    </main>
  );
}
