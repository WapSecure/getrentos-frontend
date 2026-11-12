import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from '@sureground/icons';
import { DEVELOPMENT_STAGE_LABEL, completionLabel } from '@sureground/shared/showroom';
import { EmptyState, ListingCard, PageHeader } from '@sureground/ui';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { DevelopmentPaymentNotice } from '@/components/showroom/DevelopmentAssurance';
import { developmentPath, fetchPublicDevelopments } from '@/lib/publicDevelopments';

export const metadata: Metadata = {
  title: 'Off-plan developments',
  description:
    'Off-plan developments whose developer, directors, site title and building approval were checked by Sureground staff. You pay the developer directly.',
  alternates: { canonical: '/developments' },
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function DevelopmentsPage({ searchParams }: Props) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Math.min(500, Number.parseInt(rawPage ?? '1', 10) || 1));
  const { items, totalPages } = await fetchPublicDevelopments({ page });

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Off-plan developments"
          description="Each one went live only after a Sureground staff member checked the developer's CAC registration, the directors' identities, the title to the site and the building plan approval."
        />
        <DevelopmentPaymentNotice compact />
        {items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No developments yet"
            description="Developments appear here once all four checks have passed."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d, index) => {
              const completion = completionLabel(d.expectedCompletion);
              return (
                <li key={d.id}>
                  <ListingCard
                    title={d.name}
                    href={developmentPath(d.id)}
                    location={`${d.city}, ${d.state}`}
                    price={d.priceFromNaira ?? null}
                    priceNote={d.priceFromNaira ? 'From, as the developer states it' : undefined}
                    image={d.cover?.url ?? null}
                    imageAlt={d.cover?.alt ?? d.name}
                    {...(d.cover?.width && d.cover.height
                      ? {
                          imagePreview: {
                            width: d.cover.width,
                            height: d.cover.height,
                            ...(d.cover.placeholder ? { placeholder: d.cover.placeholder } : {}),
                          },
                        }
                      : {})}
                    eager={index < 3}
                    status={DEVELOPMENT_STAGE_LABEL[d.stage]}
                    statusVariant="neutral"
                    meta={[
                      `By ${d.developerName}`,
                      completion ? `Expected ${completion}` : null,
                      d.cover?.source === 'render' ? "Artist's impression" : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                </li>
              );
            })}
          </ul>
        )}
        {totalPages > 1 && (
          <nav aria-label="Pages" className="flex justify-between text-sm">
            {page > 1 ? (
              <Link
                href={`/developments?page=${page - 1}`}
                className="text-primary hover:underline"
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            {page < totalPages && (
              <Link
                href={`/developments?page=${page + 1}`}
                className="text-primary hover:underline"
              >
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
