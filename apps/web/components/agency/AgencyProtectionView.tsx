'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, ShieldCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Checkbox,
  DatePicker,
  Input,
  NumberInput,
  Textarea,
  PageLoadingState,
  PageErrorState,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import {
  agencyProtectionService,
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

/**
 * The firm's client-money-protection register — the compliance posture it stands
 * behind. Attestations are declared here and surfaced to clients on their money
 * view; segregation and daily reconciliation are enforced elsewhere.
 */
export function AgencyProtectionView() {
  const queryClient = useQueryClient();
  const queryKey = ['agency', 'protection'];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
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
      setToast({ message: 'Attestation recorded.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not record the attestation.', variant: 'error' }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => unwrap(agencyProtectionService.revoke(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setToast({ message: 'Attestation revoked.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not revoke.', variant: 'error' }),
  });

  if (isLoading) return <PageLoadingState />;
  if (isError || !data)
    return <PageErrorState title="Couldn’t load attestations" onRetry={() => refetch()} />;

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

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Client-money protection
          </h1>
          <p className="mt-1 text-muted-foreground">
            How your firm protects the money it holds for clients. Clients see this on their money
            view.
          </p>
        </div>
        {!adding && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Add attestation
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">New attestation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs text-muted-foreground">Scheme name</span>
              <Input
                value={form.schemeName}
                onChange={(e) => setForm((f) => ({ ...f, schemeName: e.target.value }))}
                placeholder="e.g. GetRentos Client Money Protection"
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Membership / policy number</span>
              <Input
                value={form.schemeReference}
                onChange={(e) => setForm((f) => ({ ...f, schemeReference: e.target.value }))}
                placeholder="Optional"
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Cover amount (₦)</span>
              <NumberInput
                value={form.coverageAmount}
                onValueChange={(v) => setForm((f) => ({ ...f, coverageAmount: v }))}
                placeholder="Optional"
                className="mt-1"
              />
            </label>
            <div className="block">
              <span className="text-xs text-muted-foreground">Effective from</span>
              <div className="mt-1">
                <DatePicker
                  value={form.effectiveFrom}
                  onChange={(v) => setForm((f) => ({ ...f, effectiveFrom: v }))}
                  max={form.effectiveTo || undefined}
                />
              </div>
            </div>
            <div className="block">
              <span className="text-xs text-muted-foreground">Effective to (optional)</span>
              <div className="mt-1">
                <DatePicker
                  value={form.effectiveTo || undefined}
                  onChange={(v) => setForm((f) => ({ ...f, effectiveTo: v }))}
                  min={form.effectiveFrom || undefined}
                  placeholder="Open-ended"
                />
              </div>
            </div>
            <label className="block sm:col-span-2">
              <span className="text-xs text-muted-foreground">Note</span>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="Optional"
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                checked={form.segregationConfirmed}
                onCheckedChange={(c) => setForm((f) => ({ ...f, segregationConfirmed: c }))}
                aria-label="Client money is held in a segregated account"
              />
              <span className="text-sm text-foreground">
                Client money is held in a segregated client account
              </span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!canSave || createMutation.isPending}
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
        </div>
      )}

      {data.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No protection attestations yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Record how you protect client money before marketing your agency.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Scheme</th>
                <th className="px-4 py-2.5 font-medium">Cover</th>
                <th className="px-4 py-2.5 font-medium">Segregated</th>
                <th className="px-4 py-2.5 font-medium">Valid</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2.5">
                    <span className="block text-foreground">{a.schemeName}</span>
                    {a.schemeReference && (
                      <span className="block text-xs text-muted-foreground">
                        {a.schemeReference}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {a.coverageAmount != null ? formatCurrency(a.coverageAmount) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {a.segregationConfirmed ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatDate(a.effectiveFrom)} –{' '}
                    {a.effectiveTo ? formatDate(a.effectiveTo) : 'open'}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_VARIANT[a.status]}>{a.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {a.status === 'ACTIVE' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeMutation.mutate(a.id)}
                        disabled={revokeMutation.isPending}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
