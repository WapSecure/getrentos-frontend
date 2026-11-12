import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from '@sureground/icons';
import { Button, EmptyState, PageHeader } from '@sureground/ui';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { BuyMarketTabs } from '@/components/showroom/BuyMarketTabs';
import { DevelopmentPaymentNotice } from '@/components/showroom/DevelopmentAssurance';
import { DevelopmentCard } from '@/components/showroom/DevelopmentCard';
import { DevelopmentStateFilter } from '@/components/showroom/DevelopmentStateFilter';
import { NIGERIA_STATES } from '@/lib/constants/locations';
import { DEVELOPMENTS_PATH, fetchPublicDevelopments } from '@/lib/publicDevelopments';

const baseMetadata: Metadata = {
  title: 'Off-plan developments',
  description:
    'Off-plan developments whose developer, directors, site title and building approval were checked by Sureground staff. You pay the developer directly.',
  alternates: { canonical: DEVELOPMENTS_PATH },
};

interface Props {
  searchParams: Promise<{ page?: string; state?: string }>;
}

const stateOf = (raw: string | undefined) =>
  NIGERIA_STATES.find((s) => s.toLowerCase() === raw?.trim().toLowerCase());

// Filtered and later pages keep the unfiltered canonical and stay out of the index.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, state } = await searchParams;
  return page || state ? { ...baseMetadata, robots: { index: false, follow: true } } : baseMetadata;
}

export default async function DevelopmentsPage({ searchParams }: Props) {
  const { page: rawPage, state: rawState } = await searchParams;
  const page = Math.max(1, Math.min(500, Number.parseInt(rawPage ?? '1', 10) || 1));
  const state = stateOf(rawState);
  const { items, totalPages } = await fetchPublicDevelopments({ page, state });
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (n > 1) params.set('page', String(n));
    const query = params.toString();
    return query ? `${DEVELOPMENTS_PATH}?${query}` : DEVELOPMENTS_PATH;
  };

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <BuyMarketTabs current="developments" />
        <PageHeader
          title="Off-plan developments"
          description="Each one went live only after a Sureground staff member checked the developer's CAC registration, the directors' identities, the title to the site and the building plan approval."
          actions={<DevelopmentStateFilter state={state} />}
        />
        <DevelopmentPaymentNotice compact />
        {items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={state ? `No developments in ${state} yet` : 'No developments yet'}
            description={
              state
                ? 'Try another state, or see every live development.'
                : 'Developments appear here once all four checks have passed.'
            }
            action={
              state ? (
                <Button href={DEVELOPMENTS_PATH} variant="outline">
                  See all developments
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d, index) => (
              <li key={d.id}>
                <DevelopmentCard development={d} eager={index < 3} />
              </li>
            ))}
          </ul>
        )}
        {totalPages > 1 && (
          <nav aria-label="Pages" className="flex justify-between text-sm">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-primary hover:underline">
                Previous
              </Link>
            ) : (
              <span />
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="text-primary hover:underline">
                Next
              </Link>
            )}
          </nav>
        )}
      </div>
      <Footer />
    </main>
  );
}
