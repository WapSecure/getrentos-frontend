'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  Field,
  Skeleton,
  type BadgeVariant,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { renterService } from '@/services/renterService';
import type { Affordability, AffordabilityInput } from '@/types/rentDecision';

const BAND: Record<Affordability['band'], { label: string; variant: BadgeVariant } | null> = {
  comfortable: { label: 'Comfortable', variant: 'success' },
  stretched: { label: 'A stretch', variant: 'warning' },
  high: { label: 'Hard to keep up', variant: 'danger' },
  unknown: null,
};

/**
 * "Can I afford it?": rent against income by the same rule landlords' screening
 * uses, the cash needed to move in, and how long saving it takes. Worked out by
 * Sureground, not AI. The figures entered are used for this answer only.
 */
export function AffordabilityCard({ listingId }: { listingId: string }) {
  const [form, setForm] = useState<AffordabilityInput>({});
  const [asked, setAsked] = useState<AffordabilityInput>({});
  const { data, isLoading } = useQuery({
    queryKey: renterKeys.affordability(listingId, asked),
    queryFn: () => unwrap(renterService.getAffordability(listingId, asked)),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (isLoading && !data) {
    return (
      <Card className="p-4 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }
  if (!data) return null;
  const band = BAND[data.band];

  return (
    <Card className="p-4 space-y-3" aria-labelledby="affordability-title">
      <div className="flex flex-wrap items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="affordability-title" className="text-sm font-semibold text-foreground">
          Can I afford it?
        </h2>
        {band && <Badge variant={band.variant}>{band.label}</Badge>}
      </div>
      <p className="text-sm text-foreground">{data.verdict}</p>
      {data.incomeSource === 'last_application' && (
        <p className="text-xs text-muted-foreground">
          Using the monthly income from your last application. Change it below.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Rent</dt>
        <dd className="text-foreground">
          {data.rent.amount} {data.rent.period}
        </dd>
        <dt className="text-muted-foreground">Deposit</dt>
        <dd className="text-foreground">{data.moveIn.deposit ?? 'None stated'}</dd>
        <dt className="font-medium text-foreground">Cash to move in</dt>
        <dd className="font-medium text-foreground">{data.moveIn.total}</dd>
      </dl>
      {data.savingPlan && <p className="text-sm text-foreground">{data.savingPlan}</p>}

      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setAsked(form);
        }}
      >
        <Field label="Monthly income">
          <CurrencyInput
            prefix="₦"
            value={form.monthlyIncome ?? ''}
            onValueChange={(v) => setForm((f) => ({ ...f, monthlyIncome: v }))}
            placeholder={data.monthlyIncome ? String(data.monthlyIncome) : 'e.g. 450000'}
          />
        </Field>
        <Field label="Savings so far" optionalLabel="(optional)">
          <CurrencyInput
            prefix="₦"
            value={form.savings ?? ''}
            onValueChange={(v) => setForm((f) => ({ ...f, savings: v }))}
          />
        </Field>
        <Field label="Can save each month" optionalLabel="(optional)">
          <CurrencyInput
            prefix="₦"
            value={form.monthlySaving ?? ''}
            onValueChange={(v) => setForm((f) => ({ ...f, monthlySaving: v }))}
          />
        </Field>
        <div>
          <Button type="submit" variant="outline" size="sm">
            Work it out
          </Button>
        </div>
      </form>

      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Ask the landlord about</p>
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {data.toAsk.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </div>
      <p className="text-2xs text-muted-foreground">
        Worked out by Sureground from the listing. What you enter is used for this answer only and
        is not saved.
      </p>
    </Card>
  );
}
