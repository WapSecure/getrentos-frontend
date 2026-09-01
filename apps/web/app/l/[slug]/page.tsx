import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { MicrositePageClient } from '@/components/microsite/MicrositePageClient';
import type { MicrositeProfile } from '@/types/microsite';

interface MicrositePageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProfile(slug: string): Promise<MicrositeProfile | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/microsites/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as MicrositeProfile;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: MicrositePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await fetchProfile(slug);

  if (!profile) {
    return { title: 'Microsite not found | GetRentos' };
  }

  const description =
    profile.bio || `Browse rental listings from ${profile.displayName} on GetRentos.`;

  return {
    title: `${profile.displayName} | GetRentos`,
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
  const profile = await fetchProfile(slug);

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <MicrositePageClient slug={slug} initialProfile={profile ?? undefined} />
      <Footer />
    </main>
  );
}
