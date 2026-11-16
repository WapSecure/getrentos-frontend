import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@sureground/ui/Breadcrumbs';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { ArrowLink } from '@/components/marketing/ArrowLink';
import { Container } from '@/components/marketing/Container';
import { FaqList } from '@/components/marketing/FaqList';
import { availableGuides } from '@/components/resources/availableGuides';
import { LegalNote } from '@/components/resources/LegalNote';
import { JsonLd } from '@/components/seo/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structuredData';
import { Eyebrow } from '@/components/marketing/Eyebrow';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

async function load(slug: string) {
  return (await availableGuides()).find((guide) => guide.slug === slug);
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = await load((await params).slug);
  if (!guide) return { title: 'Guide not found', robots: { index: false, follow: false } };
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: `/resources/${guide.slug}` },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = await load(slug);
  if (!guide) notFound();

  const others = (await availableGuides()).filter((other) => other.slug !== guide.slug);
  const path = `/resources/${guide.slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/resources' },
          { name: guide.title, path },
        ])}
      />
      <JsonLd data={articleJsonLd({ title: guide.title, summary: guide.summary, path })} />
      <Navigation />
      <main id="main" className="bg-background">
        <article aria-labelledby="page-title">
          <header className="pt-24 pb-12 md:pt-32 md:pb-16">
            <Container>
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Guides', href: '/resources' },
                  { label: guide.title },
                ]}
                className="mb-8"
              />
              <Eyebrow className="mb-5">{guide.eyebrow}</Eyebrow>
              <h1
                id="page-title"
                className="max-w-[22ch] text-[2.5rem] leading-[1.06] font-light tracking-[-0.02em] text-balance sm:text-[3.25rem]"
              >
                {guide.title}
              </h1>
              <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground md:text-[1.0625rem]">
                {guide.summary}
              </p>
            </Container>
          </header>

          <section className="border-y border-border bg-card py-16 md:py-20">
            <Container>
              <div className="flex max-w-3xl flex-col gap-14">
                {guide.sections.map((section) => (
                  <section key={section.title} className="border-t border-foreground/80 pt-6">
                    <h2 className="font-display mb-4 text-[1.75rem] leading-tight font-normal">
                      {section.title}
                    </h2>
                    {section.intro ? (
                      <p className="mb-5 leading-relaxed text-foreground">{section.intro}</p>
                    ) : null}
                    <ul className="flex flex-col gap-3 leading-relaxed text-muted-foreground">
                      {section.points.map((point) => (
                        <li key={point} className="flex gap-3">
                          <span aria-hidden="true" className="text-foreground/50">
                            —
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                <LegalNote />
              </div>
            </Container>
          </section>
        </article>

        {guide.faqs.length > 0 ? (
          <FaqList
            name={`guide-${guide.slug}`}
            title="Related questions"
            items={guide.faqs.map((item) => ({ q: item.question, a: item.answer }))}
          />
        ) : null}

        {others.length > 0 ? (
          <section aria-labelledby="more-guides" className="border-t border-border py-16 md:py-20">
            <Container>
              <h2 id="more-guides" className="label-caps mb-6 text-muted-foreground">
                More guides
              </h2>
              <ul className="flex flex-col gap-4">
                {others.map((other) => (
                  <li key={other.slug}>
                    <ArrowLink href={`/resources/${other.slug}`}>{other.title}</ArrowLink>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
