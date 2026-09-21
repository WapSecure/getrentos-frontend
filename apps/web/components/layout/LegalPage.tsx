import type { ReactNode } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

/** Shared frame for the policy pages: site navigation, a readable column, the footer. */
export const LegalPage = ({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) => (
  <>
    <Navigation />
    <main className="bg-white pb-20 pt-28 dark:bg-background">
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-4xl font-bold tracking-[-0.02em] text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
        <p className="mt-6 text-lg text-muted-foreground">{intro}</p>
        <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </main>
    <Footer />
  </>
);
