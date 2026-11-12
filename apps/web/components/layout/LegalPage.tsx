import type { ReactNode } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/marketing/Container';
import { PageHero } from '@/components/marketing/PageHero';

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
    <main id="main" className="bg-background">
      <PageHero eyebrow={`Last updated ${updated}`} title={title} lead={intro} narrow />
      <Container className="max-w-[860px] pb-20 md:pb-28">
        <article className="space-y-4 border-t border-border pt-10 leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-[1.75rem] [&_h2]:leading-tight [&_h2]:font-normal [&_h2]:text-foreground [&_li]:pl-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </article>
      </Container>
    </main>
    <Footer />
  </>
);
