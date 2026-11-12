import Link from 'next/link';
import type { ReactNode } from 'react';
import { BadgeCheck, Clock, Lock } from '@sureground/icons';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Timeline,
} from '@sureground/ui';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { FaqList } from '@/components/marketing/FaqList';
import { LandingHero } from '@/components/marketing/LandingHero';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { StepList } from '@/components/marketing/StepList';
import { photos } from '@/components/marketing/photos';
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
} from './content';

// Server-rendered, like the landing page: plain markup that reads without JavaScript.

const WORKSPACE_SIGN_IN = signInThen(DIASPORA_ROUTES.BUYER_WORKSPACE);

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
  <Card>
    <CardHeader action={<Badge variant="neutral">Example</Badge>}>
      <p className="label-caps text-muted-foreground">Investor workspace</p>
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

const Dash = () => (
  <span aria-hidden="true" className="text-foreground/50">
    —
  </span>
);

/** A plain list with an em-dash marker, matching the other landing pages. */
const DashList = ({ points }: { points: string[] }) => (
  <ul className="flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
    {points.map((point) => (
      <li key={point} className="flex gap-3">
        <Dash />
        <span>{point}</span>
      </li>
    ))}
  </ul>
);

interface TitledList {
  title: string;
  points: string[];
}

/** Two lists side by side under rules, e.g. what is covered and what is not. */
const PairedLists = ({ left, right }: { left: TitledList; right: TitledList }) => (
  <div className="grid gap-x-12 gap-y-12 md:grid-cols-2">
    {[left, right].map((list, index) => (
      <div
        key={list.title}
        className={
          index === 0 ? 'border-t border-foreground/80 pt-6' : 'border-t border-border pt-6'
        }
      >
        <h3 className="font-display mb-5 text-[1.5rem] font-normal">{list.title}</h3>
        <DashList points={list.points} />
      </div>
    ))}
  </div>
);

const Band = ({
  id,
  labelledBy,
  tinted = false,
  children,
}: {
  id?: string;
  labelledBy: string;
  tinted?: boolean;
  children: ReactNode;
}) => (
  <section
    id={id}
    aria-labelledby={labelledBy}
    className={
      tinted
        ? 'scroll-mt-20 border-y border-border bg-card py-20 md:py-28'
        : 'scroll-mt-20 py-20 md:py-28'
    }
  >
    <Container>{children}</Container>
  </section>
);

export const DiasporaInvestLanding = () => (
  <>
    <LandingHero
      eyebrow="Sureground Diaspora Invest"
      title="Invest back home, with evidence"
      lead="Find, buy, own and manage property in Nigeria from wherever you live. Named professionals carry out the checks, your payments are protected, and every step is recorded where you can see it."
      photo={photos.lekkiIkoyiLinkBridge}
      actions={
        <>
          <CtaLink href={ROUTES.SIGNUP} arrow>
            Create your account
          </CtaLink>
          <CtaLink href={WORKSPACE_SIGN_IN} variant="outline">
            Sign in to your workspace
          </CtaLink>
        </>
      }
    />

    <section aria-label="What Sureground provides" className="pb-16 md:pb-20">
      <Container>
        <ul className="grid gap-6 border-t border-border pt-6 sm:grid-cols-3">
          {PROOF.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[0.9375rem] text-foreground">
              <Icon className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Sureground provides property services. It does not give investment advice or promise
          returns.
        </p>
      </Container>
    </section>

    <Band id="offer" labelledBy="diaspora-offer" tinted>
      <SectionIntro
        id="diaspora-offer"
        eyebrow="The service"
        title="Three services, one account"
        lead="Use any of them on its own, or all three together."
      />
      <ul className="grid gap-x-10 gap-y-12 md:grid-cols-3">
        {OFFERINGS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="border-t border-foreground/80 pt-6">
            <Icon className="mb-5 h-6 w-6 text-foreground" aria-hidden="true" />
            <h3 className="font-display mb-3 text-[1.5rem] font-normal">{title}</h3>
            <p className="leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </Band>

    <Band id="questions" labelledBy="diaspora-questions">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionIntro
            id="diaspora-questions"
            eyebrow="Evidence, not badges"
            title="The five questions we answer with records"
            lead="Who checked, what they checked, when, and what is still open."
            layout="stacked"
          />
          <ProductPreview />
        </div>
        <ul className="border-t border-border">
          {QUESTIONS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-5 border-b border-border py-8">
              <Icon className="mt-1.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
              <div>
                <h3 className="font-display mb-2 text-[1.5rem] font-normal">{title}</h3>
                <p className="leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Band>

    <Band id="how-it-works" labelledBy="diaspora-journey" tinted>
      <SectionIntro
        id="diaspora-journey"
        eyebrow="How it works"
        title="From your first sign-in to looking after the property"
        lead="Four stages, each recorded in your workspace as it happens."
      />
      <StepList
        steps={JOURNEY.map((step) => ({
          title: step.title,
          body: (
            <>
              {step.body}
              <span className="mt-5 block border-t border-border pt-4">
                {step.points.map((point) => (
                  <span key={point} className="mb-2 flex gap-3 last:mb-0">
                    <Dash />
                    <span>{point}</span>
                  </span>
                ))}
              </span>
            </>
          ),
        }))}
      />
    </Band>

    <Band id="checks" labelledBy="diaspora-checks">
      <SectionIntro
        id="diaspora-checks"
        eyebrow="Checks"
        title="What is checked, and its limits"
        lead="A check is evidence about a property on a date. Here is what it covers and what it cannot."
      />
      <PairedLists
        left={{ title: 'What we check', points: CHECKED }}
        right={{ title: 'What a check cannot do', points: LIMITS }}
      />
    </Band>

    <Band id="payment-protection" labelledBy="diaspora-protection" tinted>
      <SectionIntro
        id="diaspora-protection"
        eyebrow="Your money"
        title="Sureground Payment Protection"
        lead="What it does with your money, and what it does not cover."
      />
      <PairedLists
        left={{ title: 'What it does', points: PROTECTION_DOES }}
        right={{ title: 'What it does not do', points: PROTECTION_DOES_NOT }}
      />
    </Band>

    <Band id="risks" labelledBy="diaspora-risks">
      <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-16">
        <div id="fees" className="scroll-mt-20">
          <p className="label-caps mb-4 text-muted-foreground">Fees</p>
          <h2 className="font-display mb-5 text-[2rem] leading-[1.1] font-normal md:text-[2.5rem]">
            Shown in full before you commit
          </h2>
          <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
            Every Sureground fee for a purchase or for Sureground Managed, and who receives it, is
            shown before you agree to anything. Fees charged by professionals you instruct, and
            government charges such as stamp duty and consent fees, are listed separately.
          </p>
        </div>
        <div>
          <p className="label-caps mb-4 text-muted-foreground">Risks</p>
          <h2
            id="diaspora-risks"
            className="font-display mb-5 text-[2rem] leading-[1.1] font-normal md:text-[2.5rem]"
          >
            Risks to weigh before you buy
          </h2>
          <p className="mb-6 max-w-[60ch] leading-relaxed text-muted-foreground">
            Property in Nigeria can be a sound long-term holding, but it carries real risks.
          </p>
          <div className="border-t border-border pt-6">
            <DashList points={RISKS} />
          </div>
        </div>
      </div>
    </Band>

    <Band id="transparency" labelledBy="diaspora-transparency" tinted>
      <SectionIntro
        id="diaspora-transparency"
        eyebrow="Transparency"
        title="Who is responsible for what"
        lead="A summary of how Sureground works. It does not replace our Terms of service and Privacy policy."
      />
      <dl className="border-t border-border">
        {TRANSPARENCY.map((item) => (
          <div
            key={item.title}
            className="grid gap-2 border-b border-border py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] md:gap-12"
          >
            <dt className="font-display text-xl font-normal text-foreground">{item.title}</dt>
            <dd className="max-w-[68ch] leading-relaxed text-muted-foreground">{item.body}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-[0.9375rem] text-muted-foreground">
        Read the{' '}
        <Link href="/terms" className="text-foreground underline underline-offset-4">
          Terms of service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-foreground underline underline-offset-4">
          Privacy policy
        </Link>
        .
      </p>
    </Band>

    <div id="faq" className="scroll-mt-20">
      <FaqList
        name="diaspora-faq"
        title="Questions people ask"
        items={FAQS.map((faq) => ({ q: faq.question, a: faq.answer }))}
      />
    </div>

    <ClosingBand
      title="Start with your investor profile"
      lead="It takes a few minutes. Tell us where you live and what you are looking for, and your workspace will show your time next to Lagos time."
      actions={
        <>
          <CtaLink href={ROUTES.SIGNUP} variant="light" arrow>
            Create your account
          </CtaLink>
          <CtaLink href={WORKSPACE_SIGN_IN} variant="outline-light">
            Sign in to your workspace
          </CtaLink>
        </>
      }
    />
  </>
);
