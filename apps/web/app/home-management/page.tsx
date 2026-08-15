import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  House,
  Layers3,
  Network,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants/auth';

const workflows = [
  {
    icon: House,
    title: 'A complete asset record',
    description:
      'Track equipment, warranties, model details, service history, and the home or unit where each asset belongs.',
  },
  {
    icon: CalendarClock,
    title: 'Preventive care that stays ahead',
    description:
      'Schedule recurring care, connect the right vendor, and surface due work before an expensive failure occurs.',
  },
  {
    icon: ClipboardCheck,
    title: 'Controlled work orders',
    description:
      'Bring tenant requests and planned work into one queue with ownership, due dates, vendor context, and spend approvals.',
  },
  {
    icon: FileText,
    title: 'A durable operating record',
    description:
      'Keep lease records, home documents, receipts, and service conversations tied to the property—not scattered across tools.',
  },
];

const audiences = [
  {
    title: 'Owners',
    description: 'Protect the long-term condition and value of each property in your portfolio.',
    action: 'Open owner workspace',
    href: ROUTES.OWNER_HOME_MANAGEMENT,
  },
  {
    title: 'Landlords & operators',
    description:
      'Coordinate tenants, vendors, maintenance, and budgets across every occupied unit.',
    action: 'Open landlord workspace',
    href: ROUTES.LANDLORD_HOME_MANAGEMENT,
  },
  {
    title: 'Residents',
    description:
      'See one trusted place for your lease, home-care requests, records, payments, and support.',
    action: 'Open My Home',
    href: ROUTES.RENTER_HOME,
  },
];

const governancePoints = [
  'Role-specific workspaces for owners, landlords, and residents.',
  'Property-scoped data access and audited work-order approvals.',
  'A single operational trail from reported issue to approved, completed work.',
];

const operatingPlans = [
  {
    icon: House,
    name: 'Home Care',
    audience: 'Independent owners',
    description:
      'The essential operating layer for a small portfolio or a single investment property.',
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
    description:
      'Coordinate vendors, recurring care, approvals, and service accountability across a growing portfolio.',
    includes: [
      'Preventive maintenance plans',
      'Vendor quotes and spend controls',
      'SLA, escalation, and operational reporting',
    ],
    featured: true,
  },
  {
    icon: Layers3,
    name: 'Enterprise',
    audience: 'Agencies and communities',
    description:
      'A governed operating system for multi-property teams, service partners, and residential communities.',
    includes: [
      'Portfolio workspaces and policy controls',
      'Role-aware approvals and audit exports',
      'Tailored implementation and integration planning',
    ],
  },
];

export default function HomeManagementProductPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(25,118,210,0.14),transparent_42%),radial-gradient(circle_at_top_right,rgba(46,125,100,0.12),transparent_38%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
              <Wrench className="h-4 w-4" />
              GetRentos Home Management
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Operate every home with the care of a world-class property team.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              A dedicated operational workspace for the work that begins after move-in: assets,
              preventive care, work orders, vendor coordination, approvals, and home records.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href={ROUTES.SIGNUP} size="lg" rounded="lg">
                Set up Home Management
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="#workflows" variant="outline" size="lg" rounded="lg">
                Explore the workflow
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Built into the GetRentos operating system—no separate spreadsheets, inboxes, or guest
              accounts.
            </p>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_24px_80px_rgba(15,23,42,0.11)] sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="text-sm font-medium text-primary">Portfolio health</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em]">
                  Today&apos;s operating view
                </h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Asset register" value="Ready" tone="blue" />
              <Metric label="Care plans" value="On track" tone="green" />
              <Metric label="Work orders" value="In control" tone="amber" />
              <Metric label="Approvals" value="Audited" tone="violet" />
            </div>
            <div className="mt-5 rounded-2xl border border-border bg-secondary/55 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarClock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">Preventive care stays visible</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Planned service, warranty context, vendor assignment, and approval decisions
                    remain connected to the home.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflows" className="border-y border-border bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">One operating model</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              From the first asset to the final service record.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Home Management connects the operational layers of a property so decisions happen with
              the right context, authority, and history.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {workflows.map((workflow) => (
              <article
                key={workflow.title}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <workflow.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em]">{workflow.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {workflow.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Built for every participant</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                Different roles. One trusted home record.
              </h2>
            </div>
            <Link
              href={ROUTES.SIGNUP}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {audiences.map((audience) => (
              <article
                key={audience.title}
                className="flex flex-col rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="text-xl font-semibold tracking-[-0.025em]">{audience.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                  {audience.description}
                </p>
                <Button
                  href={audience.href}
                  variant="outline"
                  size="sm"
                  rounded="lg"
                  className="mt-6 self-start"
                >
                  {audience.action}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">
              A product line that grows with your operations
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Start with the homes you operate today.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Home Management is designed to be funded by the operator—not the resident—and to
              expand from everyday care into governed portfolio operations.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {operatingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-6 ${
                  plan.featured
                    ? 'border-primary/35 bg-primary/[0.035] shadow-[0_18px_50px_rgba(15,23,42,0.08)]'
                    : 'border-border bg-background'
                }`}
              >
                {plan.featured && (
                  <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    Built for operators
                  </span>
                )}
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <plan.icon className="h-5 w-5" />
                </span>
                <p className="mt-5 text-sm font-medium text-primary">{plan.audience}</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">{plan.name}</h3>
                <p className="mt-3 min-h-14 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-3 border-t border-border pt-5">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-6 text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  href={ROUTES.SIGNUP}
                  variant={plan.featured ? 'primary' : 'outline'}
                  size="sm"
                  rounded="lg"
                  className="mt-7 self-start"
                >
                  Explore {plan.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
            <Network className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            The commercial model can combine a property or unit subscription with optional managed
            coordination, verification, inspection, and payment services as your operations mature.
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-3xl border border-border bg-secondary/55 p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
              <BadgeCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em]">
              Control without slowing the work down.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              The operational workspace is deliberately role-aware: those close to a home can act
              quickly, while owners retain clear visibility and approval control.
            </p>
          </div>
          <ul className="space-y-4">
            {governancePoints.map((point) => (
              <li
                key={point}
                className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-sm leading-6 text-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-card px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-primary">Ready to operate with confidence?</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Make every home easier to care for, govern, and grow.
        </h2>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href={ROUTES.SIGNUP} size="lg" rounded="lg">
            Get started
          </Button>
          <Button href={ROUTES.LOGIN} variant="outline" size="lg" rounded="lg">
            Sign in to your workspace
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'amber' | 'violet';
}) {
  const styles = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  } as const;

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>
        {value}
      </span>
      <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
    </div>
  );
}
