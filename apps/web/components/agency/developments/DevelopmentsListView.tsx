'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, Plus } from '@sureground/icons';
import { DEVELOPMENT_STAGE_LABEL } from '@sureground/shared/showroom';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Select,
  useToast,
} from '@sureground/ui';
import { NIGERIA_STATES } from '@/lib/constants/locations';
import { formatDate } from '@/lib/format';
import { DevelopmentPaymentNotice } from '@/components/showroom/DevelopmentAssurance';
import {
  DEVELOPMENT_STATUS_LABEL,
  developmentEnquiriesService,
  developmentsService,
  type DevelopmentStatus,
} from '@/services/developmentsService';

export const DEVELOPMENTS_KEY = ['agency', 'developments'] as const;
export const ENQUIRY_COUNTS_KEY = [...DEVELOPMENTS_KEY, 'enquiry-counts'] as const;

export const STATUS_VARIANT: Record<
  DevelopmentStatus,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  DRAFT: 'neutral',
  IN_REVIEW: 'info',
  CHANGES_REQUESTED: 'warning',
  LIVE: 'success',
  WITHDRAWN: 'neutral',
};

const STATE_OPTIONS = NIGERIA_STATES.map((s) => ({ value: s, label: s }));

export function DevelopmentsListView() {
  const router = useRouter();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', addressLine: '', city: '', state: 'Lagos' });
  const query = useQuery({
    queryKey: DEVELOPMENTS_KEY,
    queryFn: async () => {
      const res = await developmentsService.list();
      if (!res.success) throw new Error(res.error || 'Could not load your developments.');
      return res.data ?? [];
    },
  });

  // Best effort: the list still works when the counts do not load.
  const counts = useQuery({
    queryKey: ENQUIRY_COUNTS_KEY,
    queryFn: async () => {
      const res = await developmentEnquiriesService.newCounts();
      return res.success && res.data ? res.data : {};
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await developmentsService.create(form);
      if (!res.success || !res.data)
        throw new Error(res.error || 'Could not start the development.');
      return res.data;
    },
    onSuccess: (d) => router.push(`/agency/developments/${d.id}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      form.name.trim().length < 2 ||
      form.addressLine.trim().length < 3 ||
      form.city.trim().length < 2
    ) {
      toast.error('Give the name, the site address and the city.');
      return;
    }
    create.mutate();
  };

  const rows = query.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Developments"
        description="List an off-plan development on Sureground. It goes live only after our staff check your CAC registration, your directors' identities, the title to the site and the building plan approval."
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setShowForm(true)}>
            New development
          </Button>
        }
      />
      <DevelopmentPaymentNotice compact />

      {showForm && (
        <Card className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Development name" required>
              <Input
                value={form.name}
                maxLength={120}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Site address" required>
              <Input
                value={form.addressLine}
                maxLength={200}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              />
            </Field>
            <Field label="City or area" required>
              <Input
                value={form.city}
                maxLength={80}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="State">
              <Select
                value={form.state}
                onValueChange={(state) => setForm({ ...form, state })}
                options={STATE_OPTIONS}
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" isLoading={create.isPending} loadingText="Starting">
                Start a draft
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError ? (
        <PageErrorState
          title="Could not load your developments"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No developments yet"
          description="Start a draft. Nothing is public until all four checks pass."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((d) => (
            <li key={d.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/agency/developments/${d.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {d.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[
                        `${d.city}, ${d.state}`,
                        DEVELOPMENT_STAGE_LABEL[d.stage],
                        `${d.checksPassed} of 4 checks passed`,
                        `updated ${formatDate(d.updatedAt)}`,
                      ].join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(counts.data?.[d.id] ?? 0) > 0 && (
                      <Link
                        href={`/agency/developments/${d.id}#enquiries`}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Badge variant="warning">
                          {counts.data![d.id] === 1
                            ? '1 new question'
                            : `${counts.data![d.id]} new questions`}
                        </Badge>
                      </Link>
                    )}
                    <Badge variant={STATUS_VARIANT[d.status]}>
                      {DEVELOPMENT_STATUS_LABEL[d.status]}
                    </Badge>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
