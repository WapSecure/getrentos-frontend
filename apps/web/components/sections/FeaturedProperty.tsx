import { MapPin, Bed, Bath, Square, Building2 } from 'lucide-react';
import { LinkButton } from './primitives';
import { ROUTES } from '@/lib/constants/auth';

/**
 * An illustration of what a verified listing looks like, and labelled as one. It
 * used to present itself as a real property (with an id and a "Verified" badge)
 * and lead to sign-up, which read as a real listing that did not exist.
 */
const example = {
  title: '2 Bed Loft',
  price: '4.2M',
  period: '/year',
  location: 'Lekki Phase 1, Lagos',
  beds: 2,
  baths: 2,
  size: 1200,
  badges: ['Identity verified', 'Documents reviewed', 'Escrow payment'],
};

export const FeaturedProperty = () => (
  <section className="px-4 py-20">
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <span className="mb-4 inline-flex w-fit rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-accent-foreground">
              Example listing
            </span>

            <h2 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">{example.title}</h2>
            <p className="mb-2 text-4xl font-bold text-foreground md:text-5xl">
              ₦{example.price}
              <span className="ml-1 text-lg font-normal text-muted-foreground">
                {example.period}
              </span>
            </p>
            <p className="mb-6 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {example.location}
            </p>

            <div className="mb-6 flex items-center gap-6 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Bed className="h-4 w-4" aria-hidden="true" />
                {example.beds} beds
              </span>
              <span className="flex items-center gap-2">
                <Bath className="h-4 w-4" aria-hidden="true" />
                {example.baths} baths
              </span>
              <span className="flex items-center gap-2">
                <Square className="h-4 w-4" aria-hidden="true" />
                {example.size} sqft
              </span>
            </div>

            <ul className="mb-6 flex flex-wrap gap-2">
              {example.badges.map((badge) => (
                <li
                  key={badge}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-foreground dark:bg-white/10"
                >
                  {badge}
                </li>
              ))}
            </ul>

            <p className="mb-6 text-sm text-muted-foreground">
              This is a sample listing that shows what a verified listing looks like. Browse real
              homes to rent, or create an account to list your own.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/rent" size="lg">
                Browse homes to rent
              </LinkButton>
              <LinkButton href={ROUTES.SIGNUP} variant="secondary" size="lg">
                Create an account
              </LinkButton>
            </div>
          </div>

          <div
            className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-muted/50 dark:to-muted"
            aria-hidden="true"
          >
            <div className="relative z-10 text-center">
              <Building2 className="mx-auto mb-4 h-24 w-24 text-gray-400 dark:text-white/20" />
              <p className="text-gray-500">Sample illustration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
