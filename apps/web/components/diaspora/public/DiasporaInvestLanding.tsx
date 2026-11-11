import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, Info, XCircle } from '@sureground/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@sureground/ui';
import { LinkButton, MarketingCard, SectionHeading } from '@/components/sections/primitives';
import { ROUTES } from '@/lib/constants/auth';
import { signInThen } from '@/lib/constants/landBuyerRoutes';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import {
  CHECKED,
  FAQS,
  LIMITS,
  OFFERINGS,
  PROTECTION_DOES,
  PROTECTION_DOES_NOT,
  QUESTIONS,
  RISKS,
  STEPS,
  TRANSPARENCY,
  type IconCopy,
} from './content';

// Server-rendered, like the landing page: plain markup that reads without JavaScript.

const WORKSPACE_SIGN_IN = signInThen(DIASPORA_ROUTES.BUYER_WORKSPACE);

const IconCard = ({ item }: { item: IconCopy }) => (
  <MarketingCard className="p-6">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
      <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
    </div>
    <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
    <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
  </MarketingCard>
);

const PointList = ({ points, tone }: { points: string[]; tone: 'yes' | 'no' | 'info' }) => {
  const Icon = tone === 'yes' ? CheckCircle2 : tone === 'no' ? XCircle : Info;
  const colour =
    tone === 'yes' ? 'text-success' : tone === 'no' ? 'text-muted-foreground' : 'text-primary';
  return (
    <ul className="space-y-3">
      {points.map((point) => (
        <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${colour}`} aria-hidden="true" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
};

const Section = ({
  id,
  children,
  narrow = false,
}: {
  id?: string;
  children: ReactNode;
  narrow?: boolean;
}) => (
  <section id={id} className="scroll-mt-20 px-4 py-16 md:py-20">
    <div className={`mx-auto ${narrow ? 'max-w-4xl' : 'max-w-7xl'}`}>{children}</div>
  </section>
);

const Hero = () => (
  <section className="px-4 pb-12 pt-32 md:pt-40">
    <div className="mx-auto max-w-4xl text-center">
      <p className="mb-5 text-sm font-semibold text-primary">Sureground Diaspora Invest</p>
      <h1 className="text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
        Invest back home, with evidence
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Find, buy, own and manage property in Nigeria from wherever you live. Checks are carried out
        by named professionals, your payments are protected, and every step is recorded where you
        can see it.
      </p>
      <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <LinkButton href={ROUTES.SIGNUP} className="group">
          Create your account
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </LinkButton>
        <LinkButton href={WORKSPACE_SIGN_IN} variant="secondary">
          Sign in to your workspace
        </LinkButton>
      </div>
      <p className="mx-auto mt-8 max-w-xl text-sm text-muted-foreground">
        Sureground provides property services. It does not give investment advice or promise
        returns.
      </p>
    </div>
  </section>
);

export const DiasporaInvestLanding = () => (
  <>
    <Hero />

    <Section id="offer">
      <SectionHeading
        title="Three services, one account"
        description="Use any of them on its own, or all three together."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {OFFERINGS.map((item) => (
          <IconCard key={item.title} item={item} />
        ))}
      </div>
    </Section>

    <Section id="questions">
      <SectionHeading
        title="The five questions we answer with records"
        description="Not badges: who checked, what they checked, when, and what is still open."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {QUESTIONS.map((item) => (
          <IconCard key={item.title} item={item} />
        ))}
      </div>
    </Section>

    <Section id="how-it-works">
      <SectionHeading
        title="How it works"
        description="From your first sign-in to managing the property."
      />
      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <MarketingCard className="h-full p-6">
              <p className="mb-3 text-sm font-semibold text-muted-foreground">Step {index + 1}</p>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </MarketingCard>
          </li>
        ))}
      </ol>
    </Section>

    <Section id="checks">
      <SectionHeading
        title="What is checked, and its limits"
        description="A check is evidence about a property on a date. Here is what it covers and what it cannot."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h3">What we check</CardTitle>
          </CardHeader>
          <CardContent>
            <PointList points={CHECKED} tone="yes" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h3">What a check cannot do</CardTitle>
          </CardHeader>
          <CardContent>
            <PointList points={LIMITS} tone="info" />
          </CardContent>
        </Card>
      </div>
    </Section>

    <Section id="payment-protection">
      <SectionHeading
        title="Sureground Payment Protection"
        description="What it does with your money, and what it does not cover."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h3">What it does</CardTitle>
          </CardHeader>
          <CardContent>
            <PointList points={PROTECTION_DOES} tone="yes" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h3">What it does not do</CardTitle>
          </CardHeader>
          <CardContent>
            <PointList points={PROTECTION_DOES_NOT} tone="no" />
          </CardContent>
        </Card>
      </div>
    </Section>

    <Section id="fees" narrow>
      <SectionHeading
        title="Fees, shown in full before you commit"
        description="Every Sureground fee for a purchase or for Sureground Managed, and who receives it, is shown before you agree to anything. Fees charged by professionals you instruct, and government charges such as stamp duty and consent fees, are listed separately."
      />
    </Section>

    <Section id="risks" narrow>
      <SectionHeading
        title="Risks to weigh before you buy"
        description="Property in Nigeria can be a sound long-term holding, but it carries real risks."
      />
      <Card>
        <CardContent>
          <PointList points={RISKS} tone="info" />
        </CardContent>
      </Card>
    </Section>

    <Section id="transparency" narrow>
      <SectionHeading
        title="Transparency"
        description="A summary of how Sureground works and who is responsible for what. It does not replace our Terms of service and Privacy policy."
      />
      <Card>
        <CardHeader>
          <CardTitle as="h3">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-5">
            {TRANSPARENCY.map((item) => (
              <div key={item.title}>
                <dt className="text-sm font-semibold text-foreground">{item.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">
            Read the{' '}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              Terms of service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </Section>

    <Section id="faq" narrow>
      <SectionHeading title="Questions people ask" />
      <Card>
        <div className="divide-y divide-border">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Card>
    </Section>

    <Section narrow>
      <Card>
        <CardContent className="p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-foreground md:text-3xl">
            Start with your investor profile
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            It takes a few minutes. Tell us where you live and what you are looking for, and your
            workspace will show your time next to Lagos time.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LinkButton href={ROUTES.SIGNUP}>Create your account</LinkButton>
            <LinkButton href={WORKSPACE_SIGN_IN} variant="secondary">
              Sign in to your workspace
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    </Section>
  </>
);
