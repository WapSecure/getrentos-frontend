'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Users, DoorOpen, ArrowRight } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

export default function EstateDashboardPage() {
  const { data: estate, isLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

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
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-8">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
          {estate.name}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
          <MapPin className="h-4 w-4 shrink-0" />
          {estate.address}, {estate.city}, {estate.state}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Households</p>
            <p className="text-2xl font-semibold text-foreground">{estate.householdCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <DoorOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Gates</p>
            <p className="text-2xl font-semibold text-foreground">{estate.gateCount ?? '—'}</p>
          </div>
        </div>
      </section>

      <Button href={ROUTES.ESTATE_HOUSEHOLDS} variant="outline" rounded="lg">
        Manage households
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
