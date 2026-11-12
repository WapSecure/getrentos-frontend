import Link from 'next/link';
import type { ReactNode } from 'react';
import { VERIFICATION_LIMITS_FALLBACK } from '@sureground/shared';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DisclosureList,
} from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import { signInThen } from '@/lib/constants/landBuyerRoutes';
import { SUPPORT } from '@/lib/support';
import { PointList } from './DiasporaInvestLanding';
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

// Server-rendered like the Diaspora Invest page: plain markup that reads without JavaScript.

const linkClass = 'font-medium text-primary hover:underline';

/** One section; `flush` sits a list straight under the header, edge to edge, as the FAQ does. */
const SectionCard = ({
  section,
  flush = false,
  children,
}: {
  section: TransparencySection;
  flush?: boolean;
  children: ReactNode;
}) => (
  <section id={section.id} aria-label={section.title} className="scroll-mt-24">
    <Card>
      <CardHeader>
        <CardTitle as="h2">{section.title}</CardTitle>
        {section.description && <CardDescription>{section.description}</CardDescription>}
      </CardHeader>
      {flush ? (
        <div className="mt-4 border-t border-border">{children}</div>
      ) : (
        <CardContent>{children}</CardContent>
      )}
    </Card>
  </section>
);

const Subheading = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-3 text-sm font-semibold text-foreground">{children}</h3>
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
  <div className="px-4 pb-20 pt-28 md:pt-32">
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="mb-3 text-sm font-semibold text-primary">
          <Link href={DIASPORA_ROUTES.PUBLIC} className="hover:underline">
            Sureground Diaspora Invest
          </Link>
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
          Transparency centre
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
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
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge variant="warning">Draft: under legal review</Badge>
          <span className="text-xs text-muted-foreground">
            The wording may change before Diaspora Invest launches.
          </span>
        </div>
        <nav aria-label="On this page" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {ORDER.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="mt-10 space-y-6">
        <SectionCard section={S.role}>
          <PointList points={ROLE_POINTS} tone="info" />
        </SectionCard>

        <SectionCard section={S.parties} flush>
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
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
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
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
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
    </div>
  </div>
);
