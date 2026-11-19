'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from '@sureground/icons';
import { Badge, Button, ConfirmDialog, ListSkeleton, Pagination } from '@sureground/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import {
  AddContractorPassModal,
  type AddContractorPassInput,
} from '@/components/estate/contractors/AddContractorPassModal';
import { IssuedContractorCode } from '@/components/estate/contractors/IssuedContractorCode';
import type { ContractorPass, IssuedContractorPass } from '@/types/estate';

const PAGE_SIZE = 10;

const statusVariant: Record<ContractorPass['status'], 'success' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  EXPIRED: 'neutral',
  REVOKED: 'danger',
};

/** People who come often, on one code, on the days the household chooses. */
export const RegularVisitorsSection = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [issued, setIssued] = useState<IssuedContractorPass | null>(null);
  const [withdrawing, setWithdrawing] = useState<ContractorPass | null>(null);

  const { data, isPending } = useQuery({
    queryKey: estateResidentKeys.regularVisitors(page),
    queryFn: () =>
      unwrap(estateResidentService.listMyRegularVisitors({ page, pageSize: PAGE_SIZE })),
  });
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: estateResidentKeys.regularVisitorsAll });

  const add = useMutation({
    mutationFn: (input: AddContractorPassInput) =>
      unwrap(estateResidentService.addMyRegularVisitor(input)),
    onSuccess: (created) => {
      invalidate();
      setPage(1);
      setIsAddOpen(false);
      setIssued(created);
    },
  });

  const withdraw = useMutation({
    mutationFn: (passId: string) => unwrap(estateResidentService.withdrawMyRegularVisitor(passId)),
    onSuccess: invalidate,
  });

  const visitors = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Regular visitors</h2>
          <p className="text-xs text-muted-foreground">
            Someone who comes often, like a cleaner or a driver, on one code.
          </p>
        </div>
        {data?.available && (
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
          >
            Add regular visitor
          </Button>
        )}
      </div>

      {issued && <IssuedContractorCode issued={issued} onDone={() => setIssued(null)} />}

      {isPending ? (
        <ListSkeleton rows={2} />
      ) : visitors.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {data?.available
            ? 'None yet. Add one so they can come in without a new pass each visit.'
            : "Your estate's plan doesn't include regular visitor passes. Ask the estate office to set one up for you."}
        </p>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {visitors.map((visitor) => (
              <div
                key={visitor.id}
                className="p-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {visitor.name}
                    {visitor.trade ? (
                      <span className="font-normal text-muted-foreground"> · {visitor.trade}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {visitor.scheduleLabel}
                    {visitor.visitCount > 0
                      ? ` · ${visitor.visitCount} ${visitor.visitCount === 1 ? 'visit' : 'visits'}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={statusVariant[visitor.status]}>{visitor.statusLabel}</Badge>
                  {visitor.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={withdraw.isPending && withdraw.variables === visitor.id}
                      onClick={() => setWithdrawing(visitor)}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {total > PAGE_SIZE && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          )}
        </div>
      )}

      <AddContractorPassModal
        isOpen={isAddOpen}
        forHousehold
        maxDays={data?.maxDays}
        onClose={() => {
          add.reset();
          setIsAddOpen(false);
        }}
        onSubmit={(input) => add.mutate(input)}
        isSubmitting={add.isPending}
        error={add.error instanceof Error ? add.error.message : null}
      />

      <ConfirmDialog
        open={withdrawing !== null}
        onOpenChange={(open) => {
          if (!open) setWithdrawing(null);
        }}
        tone="danger"
        title="Withdraw this regular visitor?"
        description={
          withdrawing
            ? `${withdrawing.name}'s code stops working at the gate straight away. You can add them again later with a new code.`
            : ''
        }
        confirmLabel="Withdraw"
        onConfirm={() =>
          withdrawing && withdraw.mutateAsync(withdrawing.id).then(() => setWithdrawing(null))
        }
        isLoading={withdraw.isPending}
      />
    </section>
  );
};
