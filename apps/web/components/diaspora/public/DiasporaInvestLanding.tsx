import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Info,
  Lock,
  XCircle,
} from '@sureground/icons';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DescriptionList,
  DisclosureList,
  Timeline,
} from '@sureground/ui';
import { CTA } from '@/components/sections/CTA';
import {
  LinkButton,
  MarketingCard,
  MarketingIconTile,
  SectionHeading,
  TrustStrip,
} from '@/components/sections/primitives';
import { ROUTES } from '@/lib/constants/auth';
import { signInThen } from '@/lib/constants/landBuyerRoutes';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import {
  CHECKED,
  FAQS,
  JOURNEY,
  LIMITS,
  OFFERINGS,
  PROTECTION_DOES,
  PROTECTION_DOES_NOT,
  QUESTIONS,
  RISKS,
  TRANSPARENCY,
  type IconCopy,
} from './content';

// Server-rendered, like the landing page: plain markup that reads without JavaScript.

const WORKSPACE_SIGN_IN = signInThen(DIASPORA_ROUTES.BUYER_WORKSPACE);

const IconCard = ({ item }: { item: IconCopy }) => (
  <MarketingCard className="p-6">
    <MarketingIconTile icon={item.icon} className="mb-4" />
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

const PROOF = [
  { icon: BadgeCheck, text: 'Ownership proof reviewed before listing' },
  { icon: Lock, text: 'Sureground Payment Protection' },
  { icon: Clock, text: 'Your time next to Lagos time' },
];

// Built from the same Card and Timeline the workspace uses, and labelled as an example.
const PREVIEW_STEPS = [
  {
    id: 'proof',
    title: 'Ownership proof reviewed',
    description: 'By a Sureground reviewer',
    state: 'done',
  },
  {
    id: 'tour',
    title: 'Video tour with the seller',
    description: '10:00 Lagos · 09:00 London',
    state: 'done',
  },
  {
    id: 'inspection',
    title: 'Independent inspection',
    description: 'Photos taken on site, checked by Sureground',
    state: 'done',
  },
  {
    id: 'deposit',
    title: 'Deposit held by Payment Protection',
    description: 'Released when you confirm',
    state: 'current',
  },
  {
    id: 'managed',
    title: 'Sureground Managed',
    description: 'Optional, after completion',
    state: 'pending',
  },
] as const;

const ProductPreview = () => (
  <Card className="shadow-sm">
    <CardHeader action={<Badge variant="neutral">Example</Badge>}>
      <p className="text-xs font-medium text-primary">Investor workspace</p>
      <CardTitle as="p">A home purchase, step by step</CardTitle>
      <CardDescription>Every step dated, with who checked it.</CardDescription>
    </CardHeader>
    <CardContent>
      <Timeline items={PREVIEW_STEPS} aria-label="Example purchase steps" />
    </CardContent>
    <CardFooter className="justify-start text-xs text-muted-foreground">
      An illustration of the workspace, not a real property.
    </CardFooter>
  </Card>
);

const Hero = () => (
  <section className="px-4 pb-12 pt-32 md:pt-40">
    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="text-center lg:text-left">
        <p className="mb-5 text-sm font-semibold text-primary">Sureground Diaspora Invest</p>
        <h1 className="text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
          Invest back home, with evidence
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
          Find, buy, own and manage property in Nigeria from wherever you live. Named professionals
          carry out the checks, your payments are protected, and every step is recorded where you
          can see it.
        </p>
        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
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
        <TrustStrip items={PROOF} className="mt-8 lg:justify-start" />
        <p className="mt-6 text-sm text-muted-foreground">
          Sureground provides property services. It does not give investment advice or promise
          returns.
        </p>
      </div>
      <ProductPreview />
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
        description="Four stages, from your first sign-in to looking after the property."
      />
      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {JOURNEY.map((step, index) => (
          <li key={step.title}>
            <MarketingCard className="flex h-full flex-col p-6">
              <div className="mb-5 flex items-center justify-between">
                <MarketingIconTile icon={step.icon} />
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              <div className="mt-5 border-t border-border pt-4">
                <PointList points={step.points} tone="yes" />
              </div>
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
          <DescriptionList
            columns={1}
            className="gap-y-5"
            items={TRANSPARENCY.map((item) => ({ label: item.title, value: item.body }))}
          />
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
        <DisclosureList
          items={FAQS.map((faq) => ({
            id: faq.question,
            summary: faq.question,
            content: faq.answer,
          }))}
        />
      </Card>
    </Section>

    <CTA
      title="Start with your investor profile"
      description="It takes a few minutes. Tell us where you live and what you are looking for, and your workspace will show your time next to Lagos time."
      primaryAction={{ label: 'Create your account', href: ROUTES.SIGNUP }}
      secondaryAction={{ label: 'Sign in to your workspace', href: WORKSPACE_SIGN_IN }}
    />
  </>
);
