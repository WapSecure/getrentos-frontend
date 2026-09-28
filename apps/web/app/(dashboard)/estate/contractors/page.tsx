'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound, Plus, UserCheck } from 'lucide-react';
import { Button, EmptyState, Pagination } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import {
  AddContractorPassModal,
  type AddContractorPassInput,
} from '@/components/estate/contractors/AddContractorPassModal';
import type { ContractorPass, ContractorPassStatus, IssuedContractorPass } from '@/types/estate';

const PAGE_SIZE = 10;

/** The API's floor on a withdrawal reason, kept in step so the form cannot under-run it. */
const REASON_MIN_LENGTH = 10;

type StatusFilter = 'all' | 'active' | 'revoked' | 'expired';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'In force' },
  { value: 'revoked', label: 'Withdrawn' },
  { value: 'expired', label: 'Expired' },
];

const toApiStatus = (filter: StatusFilter): ContractorPassStatus | undefined =>
  filter === 'all' ? undefined : (filter.toUpperCase() as ContractorPassStatus);

const statusTone: Record<ContractorPassStatus, string> = {
  ACTIVE: 'text-emerald-600',
  REVOKED: 'text-destructive',
  EXPIRED: 'text-muted-foreground',
};

/**
 * The estate's standing authorisations.
 *
 * Named "contractors" in the nav because that is what an estate calls them, but
 * the list is anybody who comes back: a cleaner, a driver, a tutor. What the page
 * has to make clear is the thing that is easy to get wrong — this is permission
 * to keep arriving, not a visit. Each arrival still appears as its own visitor
 * pass, which is why the visit count here is the number worth looking at.
 */
export default function EstateContractorPassesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [issued, setIssued] = useState<IssuedContractorPass | null>(null);
  const [revoking, setRevoking] = useState<ContractorPass | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const status = toApiStatus(statusFilter);

  const { data, isLoading } = useQuery({
    queryKey: [
      ...estateKeys.contractorPasses(estate?.id ?? '', statusFilter),
      { page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(estateService.listContractorPasses(estate!.id, { status, page, pageSize: PAGE_SIZE })),
    enabled: !!estate,
  });
  const passes = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'contractor-passes'] });
  };

  const createPass = useMutation({
    mutationFn: (input: AddContractorPassInput) =>
      unwrap(estateService.createContractorPass(estate!.id, input)),
    onSuccess: (created) => {
      invalidate();
      setPage(1);
      setIsAddOpen(false);
      // Shown once and never again — the API could not tell us this PIN a second
      // time if we asked, which is what makes the stored hash worth having.
      setIssued(created);
    },
  });

  const revokePass = useMutation({
    mutationFn: (input: { passId: string; reason: string }) =>
      unwrap(estateService.revokeContractorPass(estate!.id, input.passId, input.reason)),
    onSuccess: () => {
      invalidate();
      setRevoking(null);
      setRevokeReason('');
    },
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Regular visitors</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? 'authorisation' : 'authorisations'} at {estate.name}
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            createPass.reset();
            setIsAddOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Authorise somebody
        </Button>
      </div>

      {/* The distinction the whole feature rests on, said plainly, because a
          manager who thinks this replaces the visitor passes would stop expecting
          to see individual arrivals. */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          This authorises somebody to{' '}
          <span className="font-medium text-foreground">keep arriving</span> — a cleaner on
          Tuesdays, a contractor on site for six weeks. They present the code below at the barrier
          exactly like any other visitor, and every arrival is still recorded as its own visitor
          pass, so &ldquo;who is inside?&rdquo; and check-out behave the same.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          A Free estate keeps one-off visitor passes, including everything the watch list does. An
          authorisation that stands for months is an Enterprise feature.
        </p>
      </div>

      {/* The code, once. */}
      {issued && (
        <div className="bg-card rounded-2xl border border-primary/40 p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <p className="font-medium text-foreground">Code for {issued.name} — shown once</p>
              </div>
              <p className="font-mono text-3xl tracking-[0.3em] text-foreground mt-3">
                {issued.pin}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Send it to them now. It cannot be read back, and it is the only way they get in
                without the household raising a pass each time.
              </p>
              <p className="text-xs text-muted-foreground mt-1">{issued.scheduleLabel}</p>
            </div>
            <img src={issued.qrDataUrl} alt="Gate code as a QR" className="w-28 h-28 rounded-lg" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => {
                void navigator.clipboard?.writeText(issued.pin);
              }}
            >
              <Copy className="w-4 h-4" />
              Copy code
            </Button>
            <Button variant="ghost" onClick={() => setIssued(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap border ${
              statusFilter === filter.value
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-20 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : passes.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Nobody is authorised to return"
          description="Authorise a cleaner, a driver or a contractor and they can be admitted by code, on the days you agree, without the household raising a pass each time."
        />
      ) : (
        <div className="space-y-3">
          {passes.map((pass) => (
            <div
              key={pass.id}
              className="bg-card rounded-2xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground">{pass.name}</p>
                  <span className={`text-xs font-medium ${statusTone[pass.status]}`}>
                    {pass.statusLabel}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {[pass.company, pass.trade].filter(Boolean).join(' · ') || 'No firm recorded'}
                  {pass.householdLabel ? ` · ${pass.householdLabel}` : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{pass.scheduleLabel}</p>
                {pass.revokeReason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Withdrawn: {pass.revokeReason}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right shrink-0">
                <p className="text-sm text-foreground">
                  {pass.visitCount} {pass.visitCount === 1 ? 'arrival' : 'arrivals'}
                </p>
                <p className="text-xs text-muted-foreground">recorded against this</p>
              </div>

              {pass.status === 'ACTIVE' && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRevokeReason('');
                    revokePass.reset();
                    setRevoking(pass);
                  }}
                >
                  Withdraw
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-6">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

      <AddContractorPassModal
        isOpen={isAddOpen}
        estateId={estate.id}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(input) => createPass.mutate(input)}
        isSubmitting={createPass.isPending}
        error={createPass.error ? (createPass.error as Error).message : null}
      />

      {/* Withdrawing, inline: one field, and the reason is the point of it. */}
      {revoking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-5">
            <h2 className="text-lg font-semibold text-foreground">
              Withdraw {revoking.name}&rsquo;s authorisation?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              They will be refused at the barrier from now on. The record stays, along with every
              arrival they were admitted for.
            </p>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
              placeholder="Why is it being withdrawn?"
              className="w-full mt-4 rounded-lg border border-border bg-transparent p-3 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              At least {REASON_MIN_LENGTH} characters. A withdrawal without a stated reason is one
              nobody can review later.
            </p>
            {revokePass.error && (
              <p className="text-sm text-destructive mt-2">{(revokePass.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setRevoking(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={revokeReason.trim().length < REASON_MIN_LENGTH || revokePass.isPending}
                onClick={() =>
                  revokePass.mutate({ passId: revoking.id, reason: revokeReason.trim() })
                }
              >
                {revokePass.isPending ? 'Withdrawing…' : 'Withdraw'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
