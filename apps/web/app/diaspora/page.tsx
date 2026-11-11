import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { DiasporaInvestLanding } from '@/components/diaspora/public/DiasporaInvestLanding';
import { PUBLIC_REVALIDATE } from '@/lib/publicFetch';

export const metadata: Metadata = {
  title: 'Diaspora Invest: Buy and Manage Property in Nigeria from Abroad',
  description:
    'Sureground Diaspora Invest: find, buy, own and manage property in Nigeria from abroad, with checks by named professionals, Sureground Payment Protection and one workspace for everything.',
  alternates: { canonical: '/diaspora' },
  openGraph: {
    title: 'Sureground Diaspora Invest',
    description: 'Invest back home, with evidence.',
    url: '/diaspora',
    type: 'website',
  },
};

// Off unless the API says it is on: a failed check hides the page rather than advertising a closed service.
async function diasporaInvestEnabled(): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/investor/availability`, {
      next: { revalidate: PUBLIC_REVALIDATE },
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { enabled?: unknown } | null;
    return body?.enabled === true;
  } catch {
    return false;
  }
}

export default async function DiasporaInvestPage() {
  if (!(await diasporaInvestEnabled())) notFound();
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <DiasporaInvestLanding />
      <Footer />
    </main>
  );
}
