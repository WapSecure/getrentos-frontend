import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileText,
  House,
  Layers3,
} from '@sureground/icons';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { ArrowLink } from '@/components/marketing/ArrowLink';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { LandingHero } from '@/components/marketing/LandingHero';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { photos } from '@/components/marketing/photos';
import { ROUTES } from '@/lib/constants/auth';

export const metadata: Metadata = {
  title: 'Property Management: assets, care, vendors',
  description:
    'Track assets, schedule preventive care and control work orders for your property with Sureground property management.',
  alternates: { canonical: '/home-management' },
};

const WORKFLOWS = [
  {
    icon: House,
    title: 'A complete asset record',
    body: 'Equipment, warranties, model details and service history, tied to the home or unit each asset belongs to.',
  },
  {
    icon: CalendarClock,
    title: 'Preventive care ahead of failures',
    body: 'Schedule recurring care, connect the right vendor and see due work before it becomes an expensive repair.',
  },
  {
    icon: ClipboardCheck,
    title: 'Controlled work orders',
    body: 'Tenant requests and planned work in one queue, with an owner, due dates, vendor context and spend approvals.',
  },
  {
    icon: FileText,
    title: 'One operating record',
    body: 'Lease records, home documents, receipts and service conversations stay with the property, not scattered across tools.',
  },
];

const AUDIENCES = [
  {
    title: 'Owners',
    body: 'Protect the long-term condition and value of each property in your portfolio.',
    action: 'Owner workspace',
    href: ROUTES.OWNER_HOME_MANAGEMENT,
  },
  {
    title: 'Landlords and operators',
    body: 'Coordinate tenants, vendors, maintenance and budgets across every occupied unit.',
    action: 'Landlord workspace',
    href: ROUTES.LANDLORD_HOME_MANAGEMENT,
  },
  {
    title: 'Residents',
    body: 'Your lease, home-care requests, records, payments and support in one place.',
    action: 'My home',
    href: ROUTES.RENTER_HOME,
  },
];

const PLANS = [
  {
    icon: House,
    name: 'Home Care',
    audience: 'Independent owners',
    body: 'The essential operating layer for a small portfolio or a single investment property.',
    includes: [
      'Asset and home records',
      'Resident requests and work orders',
      'Documents and service history',
    ],
  },
  {
    icon: Building2,
    name: 'Operations',
    audience: 'Landlords and property teams',
    body: 'Vendors, recurring care, approvals and service accountability across a growing portfolio.',
    includes: [
      'Preventive maintenance plans',
      'Vendor quotes and spend controls',
      'Service levels, escalation and reporting',
    ],
  },
  {
    icon: Layers3,
    name: 'Enterprise',
    audience: 'Agencies and communities',
    body: 'Governed operations for multi-property teams, service partners and residential communities.',
    includes: [
      'Portfolio workspaces and policy controls',
      'Role-aware approvals and audit exports',
      'Implementation planning with our team',
    ],
  },
];

const GOVERNANCE = [
  'Role-specific workspaces for owners, landlords and residents.',
  'Property-scoped access and audited work-order approvals.',
  'One trail from a reported issue to approved, completed work.',
];

export default function HomeManagementProductPage() {
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <LandingHero
          eyebrow="Property management"
          title="Run every home after move-in from one place"
          lead="Assets, preventive care, work orders, vendors, approvals and home records in one workspace, built into Sureground."
          photo={photos.livingRoomWhite}
          actions={
            <>
              <CtaLink href={ROUTES.SIGNUP} arrow>
                Set up property management
              </CtaLink>
              <CtaLink href="#workflows" variant="outline">
                How it works
              </CtaLink>
            </>
          }
        />

        <section
          id="workflows"
          aria-labelledby="pm-workflows"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="pm-workflows"
              eyebrow="One operating model"
              title="From the first asset to the last service record"
              lead="Each decision is made with the right context, authority and history, because every part of the property's operations is connected."
            />
            <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {WORKFLOWS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="border-t border-border pt-6">
                  <Icon className="mb-5 h-6 w-6 text-foreground" aria-hidden="true" />
                  <h3 className="font-display mb-2 text-[1.5rem] font-normal">{title}</h3>
                  <p className="max-w-[52ch] leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section aria-labelledby="pm-roles" className="py-20 md:py-28">
          <Container>
            <SectionIntro
              id="pm-roles"
              eyebrow="Built for every participant"
              title="Different roles, one home record"
            />
            <ul className="grid gap-x-10 gap-y-12 md:grid-cols-3">
              {AUDIENCES.map((audience) => (
                <li key={audience.title} className="flex flex-col border-t border-border pt-6">
                  <h3 className="font-display mb-3 text-[1.5rem] font-normal">{audience.title}</h3>
                  <p className="mb-6 flex-1 leading-relaxed text-muted-foreground">
                    {audience.body}
                  </p>
                  <ArrowLink href={audience.href} className="self-start">
                    {audience.action}
                  </ArrowLink>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section
          aria-labelledby="pm-plans"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="pm-plans"
              eyebrow="Grows with your operations"
              title="Start with the homes you run today"
              lead="Property management is paid for by the operator, not the resident, and grows from everyday care into governed portfolio operations."
            />
            <ul className="grid gap-x-10 gap-y-12 lg:grid-cols-3">
              {PLANS.map(({ icon: Icon, ...plan }) => (
                <li key={plan.name} className="flex flex-col border-t border-foreground/80 pt-6">
                  <Icon className="mb-5 h-6 w-6 text-foreground" aria-hidden="true" />
                  <p className="label-caps mb-2 text-muted-foreground">{plan.audience}</p>
                  <h3 className="font-display mb-3 text-[1.75rem] font-normal">{plan.name}</h3>
                  <p className="mb-6 leading-relaxed text-muted-foreground">{plan.body}</p>
                  <ul className="mt-auto flex flex-col gap-2.5 border-t border-border pt-5 text-[0.9375rem]">
                    {plan.includes.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span aria-hidden="true" className="text-muted-foreground">
                          —
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="mt-12 max-w-[72ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
              Pricing can combine a property or unit subscription with optional managed
              coordination, verification, inspection and payment services as your operations grow.
              See{' '}
              <Link href={ROUTES.PRICING} className="text-foreground underline underline-offset-4">
                Pricing
              </Link>{' '}
              for current plans.
            </p>
          </Container>
        </section>

        <section aria-label="Control and approvals" className="py-20 md:py-28">
          <Container>
            <FeatureRow
              eyebrow="Control"
              title="Control without slowing the work down"
              photo={photos.houseWhiteCubic}
              reverse
            >
              <p>
                People close to a home can act quickly, while owners keep clear visibility and
                approval control.
              </p>
              <ul className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-foreground">
                {GOVERNANCE.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span aria-hidden="true" className="text-muted-foreground">
                      —
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </FeatureRow>
          </Container>
        </section>

        <ClosingBand
          title="Make every home easier to care for and govern"
          actions={
            <>
              <CtaLink href={ROUTES.SIGNUP} variant="light" arrow>
                Get started
              </CtaLink>
              <CtaLink href={ROUTES.LOGIN} variant="outline-light">
                Sign in
              </CtaLink>
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
