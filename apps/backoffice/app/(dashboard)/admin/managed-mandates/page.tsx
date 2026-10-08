'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Sparkles } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageErrorState,
  Select,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';

import { adminManagedService, type ManagedMandate } from '@/services/adminManagedService';
import { adminService } from '@/services/adminService';

const TIER_LABEL: Record<string, string> = {
  COLLECT_ONLY: 'Collect (5%)',
  COLLECT_MAINTAIN: 'Collect + Maintain (8%)',
  FULL_MANAGEMENT: 'Full management (10%)',
};

const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING_OWNER: { label: 'Opted in', variant: 'warning' },
  PENDING_OPS: { label: 'Signed, awaiting ops', variant: 'warning' },
};

const ManagedMandateCard = ({
  mandate,
  staffOptions,
}: {
  mandate: ManagedMandate;
  staffOptions: { value: string; label: string }[];
}) => {
  const queryClient = useQueryClient();
  const [managerUserId, setManagerUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activate = useMutation({
    mutationFn: () => unwrap(adminManagedService.activate(mandate.id, managerUserId)),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-mandates'] });
    },
    onError: (err: Error) => setError(err.message || 'Could not activate the engagement.'),
  });

  const status = STATUS_META[mandate.status] ?? {
    label: mandate.status,
    variant: 'neutral' as const,
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-muted p-2.5">
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{mandate.propertyTitle ?? 'Property'}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Owner: <span className="text-foreground">{mandate.ownerName ?? 'unknown'}</span> ·
              opted in {formatDate(mandate.createdAt)}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {mandate.servicingTier ? TIER_LABEL[mandate.servicingTier] : 'GetRentos Managed'}
            </p>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block">
          <span className="text-sm text-muted-foreground">Portfolio manager</span>
          <div className="mt-1 w-full sm:w-72">
            <Select
              ariaLabel={`Portfolio manager for ${mandate.propertyTitle ?? 'property'}`}
              value={managerUserId}
              onValueChange={setManagerUserId}
              options={[{ value: '', label: 'Choose a staff member…' }, ...staffOptions]}
            />
          </div>
        </label>
        <Button
          isLoading={activate.isPending}
          disabled={!managerUserId}
          onClick={() => activate.mutate()}
        >
          Assign &amp; activate
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </Card>
  );
};

export default function AdminManagedMandatesPage() {
  const pending = useQuery({
    queryKey: ['admin', 'managed-mandates'],
    queryFn: () => unwrap(adminManagedService.listPending()),
  });
  const staff = useQuery({
    queryKey: ['admin', 'staff', 'for-managed'],
    queryFn: () => unwrap(adminService.listStaff({ pageSize: 100 })),
  });

  const staffOptions = useMemo(
    () =>
      (staff.data?.items ?? []).map((member) => ({
        value: member.id,
        label: member.email ? `${member.legalName} · ${member.email}` : member.legalName,
      })),
    [staff.data]
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden />
          GetRentos Managed
        </h1>
        <p className="mt-1 text-muted-foreground">
          Owner opt-ins awaiting a portfolio manager. Assigning one activates the engagement and
          provisions their access to run the property.
        </p>
      </div>

      {pending.isError ? (
        <PageErrorState
          title="Could not load the queue"
          description={(pending.error as Error).message}
          onRetry={() => {
            void pending.refetch();
          }}
        />
      ) : pending.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (pending.data ?? []).length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing waiting"
          description="No GetRentos Managed opt-ins need activating right now."
        />
      ) : (
        <div className="space-y-3">
          {(pending.data ?? []).map((mandate) => (
            <ManagedMandateCard key={mandate.id} mandate={mandate} staffOptions={staffOptions} />
          ))}
        </div>
      )}
    </>
  );
}
