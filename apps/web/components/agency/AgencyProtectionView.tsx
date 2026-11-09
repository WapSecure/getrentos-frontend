'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, ShieldCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  CurrencyInput,
  DataTable,
  DatePicker,
  EmptyState,
  Field,
  Input,
  Textarea,
  PageLoadingState,
  PageErrorState,
  type BadgeVariant,
  type Column,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import {
  agencyProtectionService,
  type ProtectionAttestation,
  type ProtectionAttestationStatus,
} from '@/services/agencyProtectionService';

const STATUS_VARIANT: Record<ProtectionAttestationStatus, BadgeVariant> = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  REVOKED: 'neutral',
};

const emptyForm = {
  schemeName: '',
  schemeReference: '',
  coverageAmount: '',
  segregationConfirmed: true,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: '',
  note: '',
};

export function AgencyProtectionView() {
  const queryClient = useQueryClient();
  const queryKey = ['agency', 'protection'];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => unwrap(agencyProtectionService.list()),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      unwrap(
        agencyProtectionService.create({
          schemeName: form.schemeName.trim(),
          schemeReference: form.schemeReference.trim() || undefined,
          coverageAmount: form.coverageAmount ? Number(form.coverageAmount) : undefined,
          segregationConfirmed: form.segregationConfirmed,
          effectiveFrom: form.effectiveFrom,
          effectiveTo: form.effectiveTo || undefined,
          note: form.note.trim() || undefined,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setAdding(false);
      setForm(emptyForm);
      toast.success('Attestation recorded.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record the attestation.'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => unwrap(agencyProtectionService.revoke(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Attestation revoked.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not revoke.'),
  });

  const columns: Column<ProtectionAttestation>[] = [
    {
      key: 'scheme',
      header: 'Scheme',
      render: (a) => (
        <>
          <span className="block text-foreground">{a.schemeName}</span>
          {a.schemeReference && (
            <span className="block text-xs text-muted-foreground">{a.schemeReference}</span>
          )}
        </>
      ),
    },
    {
      key: 'cover',
      header: 'Cover',
      numeric: true,
      className: 'text-muted-foreground',
      render: (a) => (a.coverageAmount != null ? formatCurrency(a.coverageAmount) : '—'),
    },
    {
      key: 'segregated',
      header: 'Segregated',
      className: 'text-muted-foreground',
      render: (a) => (a.segregationConfirmed ? 'Yes' : 'No'),
    },
    {
      key: 'valid',
      header: 'Valid',
      className: 'text-muted-foreground',
      render: (a) => (
        <>
          {formatDate(a.effectiveFrom)} – {a.effectiveTo ? formatDate(a.effectiveTo) : 'open'}
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <Badge variant={STATUS_VARIANT[a.status]}>{a.status.toLowerCase()}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      render: (a) =>
        a.status === 'ACTIVE' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => revokeMutation.mutate(a.id)}
            disabled={revokeMutation.isPending}
            isLoading={revokeMutation.isPending && revokeMutation.variables === a.id}
          >
            Revoke
          </Button>
        ),
    },
  ];

  if (isLoading) return <PageLoadingState />;
  if (!data) return <PageErrorState title="Couldn’t load attestations" onRetry={() => refetch()} />;

  const canSave = form.schemeName.trim().length >= 2 && !!form.effectiveFrom;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        href="/agency/owners"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      <PageHeader
        title="Client-money protection"
        description="How your firm protects the money it holds for clients. Clients see this on their money view."
        actions={
          !adding && (
            <Button onClick={() => setAdding(true)} icon={<Plus className="h-4 w-4" />}>
              Add attestation
            </Button>
          )
        }
      />

      {adding && (
        <Card className="mb-6 rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">New attestation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Scheme name" required className="sm:col-span-2">
              <Input
                value={form.schemeName}
                onChange={(e) => setForm((f) => ({ ...f, schemeName: e.target.value }))}
                placeholder="e.g. Sureground Client Money Protection"
              />
            </Field>
            <Field label="Membership / policy number">
              <Input
                value={form.schemeReference}
                onChange={(e) => setForm((f) => ({ ...f, schemeReference: e.target.value }))}
                placeholder="Optional"
              />
            </Field>
            <Field label="Cover amount">
              <CurrencyInput
                value={form.coverageAmount}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, coverageAmount: v ? String(v) : '' }))
                }
                placeholder="Optional"
              />
            </Field>
            <Field label="Effective from" required>
              <DatePicker
                value={form.effectiveFrom}
                onChange={(v) => setForm((f) => ({ ...f, effectiveFrom: v }))}
                max={form.effectiveTo || undefined}
              />
            </Field>
            <Field label="Effective to (optional)">
              <DatePicker
                value={form.effectiveTo || undefined}
                onChange={(v) => setForm((f) => ({ ...f, effectiveTo: v }))}
                min={form.effectiveFrom || undefined}
                placeholder="Open-ended"
                clearable
              />
            </Field>
            <Field label="Note" className="sm:col-span-2">
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="Optional"
              />
            </Field>
            <Checkbox
              className="sm:col-span-2"
              checked={form.segregationConfirmed}
              onCheckedChange={(c) => setForm((f) => ({ ...f, segregationConfirmed: c }))}
              label="Client money is held in a segregated client account"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!canSave}
              isLoading={createMutation.isPending}
            >
              Record attestation
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setForm(emptyForm);
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No protection attestations yet."
          description="Record how you protect client money before marketing your agency."
        />
      ) : (
        <DataTable
          caption="Client-money protection attestations"
          density="compact"
          columns={columns}
          data={data}
          getRowKey={(a) => a.id}
        />
      )}
    </div>
  );
}
