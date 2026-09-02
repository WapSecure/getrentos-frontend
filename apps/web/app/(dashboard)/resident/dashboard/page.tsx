'use client';

import { useQuery } from '@tanstack/react-query';
import { Home, KeyRound, Megaphone, Package, Receipt, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);

const quickLinks = [
  {
    label: 'Visitor Passes',
    description: 'Invite guests',
    href: ROUTES.RESIDENT_VISITOR_PASSES,
    icon: KeyRound,
  },
  {
    label: 'Deliveries',
    description: 'Track packages',
    href: ROUTES.RESIDENT_DELIVERIES,
    icon: Package,
  },
  {
    label: 'Violations',
    description: 'View reports',
    href: ROUTES.RESIDENT_VIOLATIONS,
    icon: TriangleAlert,
  },
] as const;

export default function ResidentDashboardPage() {
  const { data: household, isLoading: isHouseholdLoading } = useQuery({
    queryKey: estateResidentKeys.myHousehold,
    queryFn: () => unwrap(estateResidentService.getMyHousehold()),
  });

  const { data: duesData } = useQuery({
    queryKey: estateResidentKeys.dues('pending'),
    queryFn: () => unwrap(estateResidentService.listMyDues({ status: 'pending', pageSize: 50 })),
  });

  const { data: announcementsData } = useQuery({
    queryKey: estateResidentKeys.announcements,
    queryFn: () => unwrap(estateResidentService.listMyAnnouncements({ pageSize: 3 })),
  });

  const pendingTotal = (duesData?.items ?? []).reduce((sum, due) => sum + due.amount, 0);
  const announcements = announcementsData?.items ?? [];

  if (isHouseholdLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/90 bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent text-primary flex items-center justify-center shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="mb-2 inline-flex items-center rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
              Resident dashboard
            </span>
            <h1 className="text-xl font-bold tracking-[-0.01em] text-foreground">
              {household?.unitLabel}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {household?.estate.name} · {household?.estate.address}, {household?.estate.city}
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href={ROUTES.RESIDENT_DUES}
          className="group rounded-2xl border border-border/90 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Receipt className="w-4 h-4" />
            Outstanding dues
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingTotal)}</p>
        </Link>

        <Link
          href={ROUTES.RESIDENT_ANNOUNCEMENTS}
          className="group rounded-2xl border border-border/90 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Megaphone className="w-4 h-4" />
            Announcements
          </div>
          <p className="text-2xl font-bold text-foreground">{announcementsData?.total ?? 0}</p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3 rounded-xl border border-border/90 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary transition-transform duration-300 group-hover:scale-105">
              <link.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {link.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {link.description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border/90 bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent announcements</h2>
        </div>
        {announcements.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4">
                <p className="text-sm font-medium text-foreground">{announcement.title}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {announcement.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
