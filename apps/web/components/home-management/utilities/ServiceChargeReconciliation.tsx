'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from '@sureground/icons';
import {
  SERVICE_CHARGE_ACTUAL_SOURCE_LABELS,
  SERVICE_CHARGE_CATEGORY_LABELS,
  actualLinkBody,
  formatCurrency,
  varianceLabel,
  type ServiceChargeActualCandidate,
} from '@sureground/shared';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  IconButton,
  Select,
  Skeleton,
  useToast,
} from '@sureground/ui';
import { ReceiptText } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import { serviceChargesService } from '@/services/serviceChargesService';
import { formatDay } from './ServiceChargePanel';

/** Budget against what was actually spent, per line, and what was billed and collected. */
export function ServiceChargeReconciliation({
  budgetId,
  editable,
}: {
  budgetId: string;
  editable: boolean;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const key = [...homeManagementKeys.utilities.serviceCharge(budgetId), 'reconciliation'];
  const reconciliation = useQuery({
    queryKey: key,
    queryFn: () => unwrap(serviceChargesService.reconciliation(budgetId)),
  });
  const [counting, setCounting] = useState(false);
  const unlink = useMutation({
    mutationFn: (linkId: string) => unwrap(serviceChargesService.unlinkActual(budgetId, linkId)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key }),
    onError: (error: Error) => toast.error(error.message),
  });
  const data = reconciliation.data;

  return (
    <Card className="space-y-4 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground">Budget against actual</h3>
          <p className="text-sm text-muted-foreground">
            Count fuel, expenses and approved invoices against each line to see where the money
            went.
          </p>
        </div>
        {editable && (
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setCounting(true)}
          >
            Count spend
          </Button>
        )}
      </div>

      {reconciliation.isLoading || !data ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-4">
            <Figure
              label="Spent so far"
              value={formatCurrency(data.totals.actual)}
              hint={varianceLabel(data.totals.variance)}
            />
            <Figure label="Billed to tenants" value={formatCurrency(data.totals.billed)} />
            <Figure
              label="Collected"
              value={formatCurrency(data.totals.collected)}
              hint={
                data.totals.outstanding > 0
                  ? `${formatCurrency(data.totals.outstanding)} still to pay`
                  : undefined
              }
            />
            <Figure label="Owner bears (vacant)" value={formatCurrency(data.totals.ownerBears)} />
          </dl>
          <ul className="divide-y divide-border">
            {data.lines.map((line) => (
              <li key={line.id} className="py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="min-w-0 flex-1 font-medium text-foreground">
                    {line.label}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {SERVICE_CHARGE_CATEGORY_LABELS[line.category]}
                      {line.retired ? ', removed by an amendment' : ''}
                    </span>
                  </p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(line.actual)} of {formatCurrency(line.budget)}
                  </p>
                  <p
                    className={`text-sm ${line.variance < 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
                  >
                    {varianceLabel(line.variance)}
                  </p>
                </div>
                {line.items.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {line.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{formatDay(item.date)}</span>
                        <span className="min-w-0 flex-1 truncate">{item.description}</span>
                        <span className="tabular-nums">{formatCurrency(item.amount)}</span>
                        {editable && (
                          <IconButton
                            size="sm"
                            label={`Stop counting ${item.description}`}
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => unlink.mutate(item.id)}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog open={counting} onOpenChange={setCounting}>
        <DialogContent size="xl">
          {counting && data && (
            <CountSpendForm
              budgetId={budgetId}
              lines={data.lines.filter((line) => !line.retired)}
              onDone={() => {
                void queryClient.invalidateQueries({ queryKey: key });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

function CountSpendForm({
  budgetId,
  lines,
  onDone,
}: {
  budgetId: string;
  lines: { id: string; label: string }[];
  onDone: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const candidatesKey = [...homeManagementKeys.utilities.serviceCharge(budgetId), 'candidates'];
  const candidates = useQuery({
    queryKey: candidatesKey,
    queryFn: () => unwrap(serviceChargesService.actualCandidates(budgetId)),
  });
  const [lineFor, setLineFor] = useState<Record<string, string>>({});
  const link = useMutation({
    mutationFn: (candidate: ServiceChargeActualCandidate) =>
      unwrap(
        serviceChargesService.linkActual(
          budgetId,
          actualLinkBody(lineFor[candidate.id] ?? lines[0]?.id ?? '', candidate)
        )
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: candidatesKey });
      onDone();
      toast.success('Counted.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const items = candidates.data ?? [];
  return (
    <div>
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Count spend
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Purchases, expenses and approved invoices on this property, dated within the budget, that
        are not counted anywhere yet. Choose the line each one belongs to.
      </DialogDescription>
      <div className="mt-6 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
        {candidates.isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            size="compact"
            bare
            title="Nothing left to count"
            description="Log fuel under Power, or record expenses and approve vendor invoices, and they appear here."
          />
        ) : (
          items.map((candidate) => (
            <div
              key={candidate.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{candidate.description}</p>
                <p className="text-xs text-muted-foreground">
                  {SERVICE_CHARGE_ACTUAL_SOURCE_LABELS[candidate.source]} ·{' '}
                  {formatDay(candidate.date)}
                </p>
              </div>
              <p className="font-medium tabular-nums">{formatCurrency(candidate.amount)}</p>
              <Select
                className="w-48"
                ariaLabel={`Line for ${candidate.description}`}
                value={lineFor[candidate.id] ?? lines[0]?.id ?? ''}
                onValueChange={(value) => setLineFor((all) => ({ ...all, [candidate.id]: value }))}
                options={lines.map((line) => ({ value: line.id, label: line.label }))}
              />
              <Button
                size="sm"
                isLoading={link.isPending && link.variables?.id === candidate.id}
                onClick={() => link.mutate(candidate)}
              >
                Count
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
