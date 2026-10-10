'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import {
  Badge,
  Button,
  Select,
  Textarea,
  PageLoadingState,
  PageErrorState,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import {
  agencyClientService,
  AGENCY_CLIENT_STAGES,
  AGENCY_CLIENT_STAGE_LABELS,
  type AgencyClientStage,
} from '@/services/agencyClientService';
import { MANDATE_STATUS_LABELS, type MandateStatus } from '@/services/mandateService';
import { unwrap } from '@/lib/apiHelpers';

const STATUS_VARIANT: Partial<Record<MandateStatus, BadgeVariant>> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  PENDING_OWNER: 'info',
  PENDING_OPS: 'info',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export function AgencyClientDetailView() {
  const params = useParams();
  const ownerId = String(params.ownerId);
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const queryKey = ['agency', 'client', ownerId];
  const {
    data: client,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => unwrap(agencyClientService.get(ownerId)),
  });

  const stageMutation = useMutation({
    mutationFn: (stage: AgencyClientStage) => unwrap(agencyClientService.setStage(ownerId, stage)),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      setToast({ message: 'Stage updated.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not update stage.', variant: 'error' }),
  });

  const noteMutation = useMutation({
    mutationFn: (content: string) => unwrap(agencyClientService.addNote(ownerId, content)),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      setNote('');
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not add note.', variant: 'error' }),
  });

  if (isLoading) return <PageLoadingState />;
  if (isError || !client)
    return <PageErrorState title="Couldn’t load this client" onRetry={() => refetch()} />;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        href="/agency/owners"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      {/* Contact card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserRound className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{client.ownerName ?? 'Owner'}</h1>
              {client.companyName && (
                <p className="text-sm text-muted-foreground">{client.companyName}</p>
              )}
            </div>
          </div>
          <div className="w-44">
            <label className="text-xs text-muted-foreground">Relationship stage</label>
            <Select
              value={client.stage}
              onValueChange={(v) => stageMutation.mutate(v as AgencyClientStage)}
              options={AGENCY_CLIENT_STAGES.map((s) => ({
                value: s,
                label: AGENCY_CLIENT_STAGE_LABELS[s],
              }))}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-1.5 text-foreground hover:text-primary"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              {client.email}
            </a>
          )}
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-1.5 text-foreground hover:text-primary"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              {client.phone}
            </a>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            {client.verificationStatus.replace(/_/g, ' ').toLowerCase()}
            {client.trustScore != null ? ` · trust ${client.trustScore}` : ''}
          </span>
        </div>
      </div>

      {/* Managed properties */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Properties you manage ({client.properties.length})
        </h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border/60">
          {client.properties.map((p) => (
            <div key={p.propertyId} className="flex items-center justify-between gap-3 p-3">
              <span className="flex min-w-0 items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm text-foreground">{p.title ?? 'Property'}</span>
              </span>
              <Badge variant={STATUS_VARIANT[p.mandateStatus as MandateStatus] ?? 'neutral'}>
                {MANDATE_STATUS_LABELS[p.mandateStatus as MandateStatus] ?? p.mandateStatus}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Notes</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex gap-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this client…"
              rows={2}
            />
            <Button
              variant="secondary"
              onClick={() => noteMutation.mutate(note.trim())}
              disabled={!note.trim() || noteMutation.isPending}
            >
              Add
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {client.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              client.notes.map((n) => (
                <div key={n.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm text-foreground">{n.content}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {n.authorName ?? 'Someone'} · {formatDate(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
