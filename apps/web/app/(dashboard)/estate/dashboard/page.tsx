'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Car,
  DoorOpen,
  KeyRound,
  MapPin,
  Megaphone,
  Package,
  Receipt,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';

const modules = [
  {
    label: 'Announcements',
    description: 'Broadcast to the estate',
    href: ROUTES.ESTATE_ANNOUNCEMENTS,
    icon: Megaphone,
  },
  {
    label: 'Households',
    description: 'Manage homes & residents',
    href: ROUTES.ESTATE_HOUSEHOLDS,
    icon: Users,
  },
  { label: 'Dues', description: 'Track and collect dues', href: ROUTES.ESTATE_DUES, icon: Receipt },
  {
    label: 'Visitor Passes',
    description: 'Issue entry passes',
    href: ROUTES.ESTATE_VISITOR_PASSES,
    icon: KeyRound,
  },
  { label: 'Vehicles', description: 'Register vehicles', href: ROUTES.ESTATE_VEHICLES, icon: Car },
  {
    label: 'Deliveries',
    description: 'Log packages at the gate',
    href: ROUTES.ESTATE_DELIVERIES,
    icon: Package,
  },
  {
    label: 'Violations',
    description: 'Review infractions',
    href: ROUTES.ESTATE_VIOLATIONS,
    icon: TriangleAlert,
  },
  {
    label: 'Governance',
    description: 'Rules & decisions',
    href: ROUTES.ESTATE_GOVERNANCE,
    icon: BookOpen,
  },
  {
    label: 'Staff',
    description: 'Manage estate staff',
    href: ROUTES.ESTATE_STAFF,
    icon: ShieldCheck,
  },
] as const;

export default function EstateDashboardPage() {
  const { estate, isLoading } = useSelectedEstate();

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (!estate) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-foreground">
          No estate yet
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Set up your estate to start managing households.
        </p>
        <Button href={ROUTES.ESTATE_SETUP} rounded="lg" className="mt-7">
          Set up estate
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/90 bg-card px-6 py-7 shadow-sm sm:px-8">
        <span className="mb-3 inline-flex items-center rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          Estate dashboard
        </span>
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
          {estate.name}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
          <MapPin className="h-4 w-4 shrink-0" />
          {estate.address}, {estate.city}, {estate.state}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href={ROUTES.ESTATE_HOUSEHOLDS}
          className="group flex items-center gap-4 rounded-2xl border border-border/90 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary transition-transform duration-300 group-hover:scale-105">
            <Users className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Households</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {estate.householdCount}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-4 rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <DoorOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Active gates</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {estate.gateCount ?? '—'}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="type-heading">Manage your estate</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Households, access control, and community operations in one place.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group flex items-center gap-3 rounded-xl border border-border/90 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary transition-transform duration-300 group-hover:scale-105">
                <module.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {module.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {module.description}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
