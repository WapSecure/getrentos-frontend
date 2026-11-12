import Link from 'next/link';
import type { ReactNode } from 'react';
import { CheckCircle2, Info, XCircle } from '@sureground/icons';
import { VERIFICATION_LIMITS_FALLBACK } from '@sureground/shared';
import { Badge } from '@sureground/ui/Badge';
import { DisclosureList } from '@sureground/ui/Disclosure';
import { Container } from '@/components/marketing/Container';
import { PageHero } from '@/components/marketing/PageHero';
import { ROUTES } from '@/lib/constants/auth';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import { signInThen } from '@/lib/constants/landBuyerRoutes';
import { SUPPORT } from '@/lib/support';
import {
  CHECKED,
  CONFLICT_POINTS,
  FEE_POINTS,
  LIMITS,
  MONEY_POINTS,
  PROTECTION_DOES_NOT,
  REFUND_POINTS,
  ROLE_POINTS,
  THIRD_PARTIES,
  TRANSPARENCY,
  TRANSPARENCY_SECTIONS as S,
  UNDECIDED_POINTS,
  type TransparencySection,
} from './content';

/** A ticked, crossed or noted list of short statements. */
const PointList = ({ points, tone }: { points: string[]; tone: 'yes' | 'no' | 'info' }) => {
  const Icon = tone === 'yes' ? CheckCircle2 : tone === 'no' ? XCircle : Info;
  const colour =
    tone === 'yes' ? 'text-success' : tone === 'no' ? 'text-muted-foreground' : 'text-foreground';
  return (
    <ul className="space-y-3">
      {points.map((point) => (
        <li
          key={point}
          className="flex gap-3 text-[0.9375rem] leading-relaxed text-muted-foreground"
        >
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${colour}`} aria-hidden="true" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
};

// Server-rendered like the Diaspora Invest page: plain markup that reads without JavaScript.

const linkClass = 'font-medium text-foreground underline underline-offset-4';

/** One ruled section: the title on the left, its content on the right on wide screens. */
const SectionCard = ({
  section,
  children,
}: {
  section: TransparencySection;
  children: ReactNode;
}) => (
  <section
    id={section.id}
    aria-labelledby={`${section.id}-title`}
    className="grid scroll-mt-24 gap-6 border-t border-border py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-16"
  >
    <div className="min-w-0">
      <h2
        id={`${section.id}-title`}
        className="font-display text-[1.75rem] leading-tight font-normal text-balance"
      >
        {section.title}
      </h2>
      {section.description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.description}</p>
      )}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

const Subheading = ({ children }: { children: ReactNode }) => (
  <h3 className="label-caps mb-4 text-foreground">{children}</h3>
);

const ORDER: TransparencySection[] = [
  S.role,
  S.parties,
  S.fees,
  S.checks,
  S.money,
  S.refunds,
  S.complaints,
  S.privacy,
  S.conflicts,
  S.undecided,
];

/** DIA-02: how Sureground works, who is responsible for what, and what is still open. */
export const TransparencyCentre = () => (
  <>
    <PageHero
      eyebrow={
        <Link href={DIASPORA_ROUTES.PUBLIC} className="hover:text-foreground">
          Sureground Diaspora Invest
        </Link>
      }
      title="Transparency centre"
      lead={
        <>
          How Sureground works, who is responsible for what, what you pay, how refunds and
          complaints work, and what is not yet decided. It does not replace our{' '}
          <Link href="/terms" className={linkClass}>
            Terms of service
          </Link>{' '}
          or{' '}
          <Link href="/privacy" className={linkClass}>
            Privacy policy
          </Link>
          .
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge variant="warning">Draft: under legal review</Badge>
        <span className="text-sm text-muted-foreground">
          The wording may change before Diaspora Invest launches.
        </span>
      </div>
      <nav aria-label="On this page" className="mt-10">
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {ORDER.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="label-caps border-b border-foreground/30 pb-1 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </PageHero>

    <Container className="pb-20 md:pb-28">
      <div className="border-b border-border">
        <SectionCard section={S.role}>
          <PointList points={ROLE_POINTS} tone="info" />
        </SectionCard>

        <SectionCard section={S.parties}>
          <DisclosureList
            items={THIRD_PARTIES.map((party) => ({
              id: party.title,
              summary: party.title,
              content: party.body,
            }))}
          />
        </SectionCard>

        <SectionCard section={S.fees}>
          <PointList points={FEE_POINTS} tone="info" />
        </SectionCard>

        <SectionCard section={S.checks}>
          <div className="space-y-6">
            <div>
              <Subheading>What is checked</Subheading>
              <PointList points={CHECKED} tone="yes" />
            </div>
            <div>
              <Subheading>What a check does not cover</Subheading>
              <PointList points={[...LIMITS, ...VERIFICATION_LIMITS_FALLBACK]} tone="info" />
            </div>
          </div>
        </SectionCard>

        <SectionCard section={S.money}>
          <div className="space-y-6">
            <PointList points={MONEY_POINTS} tone="info" />
            <div>
              <Subheading>What Payment Protection does not do</Subheading>
              <PointList points={PROTECTION_DOES_NOT} tone="no" />
            </div>
          </div>
        </SectionCard>

        <SectionCard section={S.refunds}>
          <PointList points={REFUND_POINTS} tone="info" />
        </SectionCard>

        <SectionCard section={S.complaints}>
          <div className="space-y-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
            <p>
              Tell us from your account, through{' '}
              <Link href={signInThen(ROUTES.BUYER_HELP)} className={linkClass}>
                Help
              </Link>
              , or by email to{' '}
              <a href={`mailto:${SUPPORT.email}`} className={linkClass}>
                {SUPPORT.email}
              </a>
              .
            </p>
            <p>
              To dispute a held deposit, open the purchase from your{' '}
              <Link href={signInThen(ROUTES.BUYER_TRANSACTIONS)} className={linkClass}>
                transactions
              </Link>
              . The deposit stays held while Sureground reviews it, and Sureground decides whether
              it is released or refunded.
            </p>
            <p>
              Problems with land, such as a competing claim or a boundary, are raised as a land case
              and followed in{' '}
              <Link href={signInThen('/land/disputes')} className={linkClass}>
                land disputes
              </Link>
              . You can appeal a decision once, within 14 days, and a different member of our team
              reviews the appeal.
            </p>
            <p>A decision on a deposit dispute has no appeal step in the product yet.</p>
          </div>
        </SectionCard>

        <SectionCard section={S.privacy}>
          <div className="space-y-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
            <p>
              {TRANSPARENCY[4].body} Identity documents and selfies are sent to Smile ID for
              checking.
            </p>
            <p>
              <Link href="/privacy" className={linkClass}>
                Read the Privacy policy
              </Link>{' '}
              for what we collect, who we share it with and your rights.
            </p>
          </div>
        </SectionCard>

        <SectionCard section={S.conflicts}>
          <PointList points={CONFLICT_POINTS} tone="info" />
        </SectionCard>

        <SectionCard section={S.undecided}>
          <PointList points={UNDECIDED_POINTS} tone="info" />
        </SectionCard>
      </div>
    </Container>
  </>
);
