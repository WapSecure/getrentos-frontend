'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, ReceiptText, Trash2 } from '@sureground/icons';
import {
  SERVICE_CHARGE_CATEGORIES,
  SERVICE_CHARGE_CATEGORY_LABELS,
  SERVICE_CHARGE_COLLECTION_LABELS,
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_STATUS_LABELS,
  bedroomWeight,
  formatCurrency,
  shareSummary,
  withStepUpSummary,
  type ServiceChargeBudget,
  type ServiceChargeCategory,
  type ServiceChargeCollection,
  type ServiceChargeInvoice,
  type ServiceChargeMethod,
} from '@sureground/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  CurrencyInput,
  DataTable,
  EmptyState,
  IconButton,
  Input,
  Pagination,
  ReasonDialog,
  SegmentedControl,
  Select,
  Skeleton,
  Switch,
  useToast,
  type BadgeVariant,
  type Column,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import { serviceChargesService } from '@/services/serviceChargesService';
import { STATUS_BADGE, formatDay } from './ServiceChargePanel';

const COLLECTION_BADGE: Record<ServiceChargeCollection, BadgeVariant> = {
  PAID: 'success',
  PART_PAID: 'warning',
  UNPAID: 'neutral',
  REMOVED: 'neutral',
  NOT_BILLED: 'info',
  VOIDED: 'danger',
};

type LineDraft = { key: string; category: ServiceChargeCategory; label: string; amount: number };
type UnitDraft = {
  unitId: string;
  label: string;
  bedrooms: number | null;
  weight: string;
  included: boolean;
};

let lineKey = 0;
const toLineDrafts = (budget: ServiceChargeBudget): LineDraft[] =>
  budget.lines.map((line) => ({
    key: line.id,
    category: line.category,
    label: line.label,
    amount: line.amount,
  }));
const toUnitDrafts = (budget: ServiceChargeBudget): UnitDraft[] =>
  budget.participants
    .filter((participant) => participant.unitId)
    .map((participant) => ({
      unitId: participant.unitId!,
      label: participant.label,
      bedrooms: participant.bedrooms,
      weight: String(participant.weight),
      included: participant.included,
    }));

export function ServiceChargeBudgetView({
  budgetId,
  onBack,
}: {
  budgetId: string;
  onBack: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const budgetKey = homeManagementKeys.utilities.serviceCharge(budgetId);
  const budget = useQuery({
    queryKey: budgetKey,
    queryFn: () => unwrap(serviceChargesService.get(budgetId)),
  });
  const data = budget.data;
  const isDraft = data?.status === 'DRAFT';
  const preview = useQuery({
    queryKey: [
      ...budgetKey,
      'preview',
      data?.version,
      data?.lines,
      data?.participants,
      data?.method,
    ],
    queryFn: () => unwrap(serviceChargesService.preview(budgetId)),
    enabled: !!data && data.status === 'DRAFT',
    placeholderData: keepPreviousData,
  });

  const [lines, setLines] = useState<LineDraft[]>([]);
  const [units, setUnits] = useState<UnitDraft[]>([]);
  const [confirming, setConfirming] = useState<'publish' | 'close' | null>(null);
  const [voiding, setVoiding] = useState(false);
  // Drafts reset whenever the saved budget changes (React's "adjust state on prop change" pattern).
  const [syncedWith, setSyncedWith] = useState<ServiceChargeBudget | undefined>(undefined);
  if (data && data !== syncedWith) {
    setSyncedWith(data);
    setLines(toLineDrafts(data));
    setUnits(toUnitDrafts(data));
  }

  const refresh = (next?: ServiceChargeBudget) => {
    if (next) queryClient.setQueryData(budgetKey, next);
    void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
  };

  const saveLines = useMutation({
    mutationFn: () =>
      unwrap(
        serviceChargesService.setLines(
          budgetId,
          lines
            .filter((line) => line.label.trim() && line.amount > 0)
            .map(({ category, label, amount }) => ({ category, label: label.trim(), amount }))
        )
      ),
    onSuccess: (next) => {
      refresh(next);
      toast.success('Budget lines saved.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const saveUnits = useMutation({
    mutationFn: () =>
      unwrap(
        serviceChargesService.setParticipants(
          budgetId,
          units.map((unit) => ({
            unitId: unit.unitId,
            weight: Number(unit.weight) >= 0 ? Number(unit.weight) : 1,
            included: unit.included,
          }))
        )
      ),
    onSuccess: (next) => {
      refresh(next);
      toast.success('Units saved.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const setMethod = useMutation({
    mutationFn: (method: ServiceChargeMethod) =>
      unwrap(serviceChargesService.update(budgetId, { method })),
    onSuccess: (next) => refresh(next),
    onError: (error: Error) => toast.error(error.message),
  });
  const publish = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Publish ${data!.title} and bill tenants their shares`, () =>
        unwrap(serviceChargesService.publish(budgetId, preview.data!.previewHash))
      ),
    onSuccess: (next) => {
      setConfirming(null);
      refresh(next);
      toast.success(
        next.issuedNow > 0
          ? `Published. ${next.issuedNow} ${next.issuedNow === 1 ? 'tenant has' : 'tenants have'} been billed for the first instalment.`
          : 'Published. Each instalment is billed to tenants when it falls due.'
      );
    },
    onError: (error: Error) => {
      setConfirming(null);
      void preview.refetch();
      toast.error(error.message);
    },
  });
  const close = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Close ${data!.title}`, () =>
        unwrap(serviceChargesService.close(budgetId))
      ),
    onSuccess: (next) => {
      setConfirming(null);
      refresh(next);
      toast.success('Closed. Nothing more will be billed from this budget.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const voidBudget = useMutation({
    mutationFn: (reason: string) =>
      withStepUpSummary(`Void ${data!.title}`, () =>
        unwrap(serviceChargesService.void(budgetId, reason))
      ),
    onSuccess: () => {
      refresh();
      void budget.refetch();
      toast.success('Voided. Its unpaid charges have been removed.');
    },
  });

  if (budget.isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!data) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="This budget could not be loaded"
        description={budget.error?.message ?? 'Go back and try again.'}
        action={<Button onClick={onBack}>Back to budgets</Button>}
      />
    );
  }

  const lineValues = (all: LineDraft[]) =>
    all.map(({ category, label, amount }) => ({ category, label, amount }));
  const linesDirty =
    JSON.stringify(lineValues(lines)) !== JSON.stringify(lineValues(toLineDrafts(data)));
  const unitsDirty = JSON.stringify(units) !== JSON.stringify(toUnitDrafts(data));
  const linesTotal = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  const p = preview.data;
  const canPublish = isDraft && !!p && p.blockers.length === 0 && !linesDirty && !unitsDirty;

  return (
    <section aria-labelledby="budget-heading" className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>
          All budgets
        </Button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="budget-heading"
              className="text-xl font-semibold tracking-[-0.02em] text-foreground"
            >
              {data.title}
            </h2>
            <Badge variant={STATUS_BADGE[data.status]}>
              {SERVICE_CHARGE_STATUS_LABELS[data.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.property.title} · {formatDay(data.periodStart)} to {formatDay(data.lastDay)} ·
            Billed {SERVICE_CHARGE_CYCLE_LABELS[data.billingCycle].toLowerCase()} ·{' '}
            {shareSummary(data.method, data.participants.filter((x) => x.included).length)}
          </p>
          {data.voidReason && (
            <p className="mt-1 text-sm text-muted-foreground">Voided: {data.voidReason}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.status === 'PUBLISHED' && (
            <Button variant="outline" onClick={() => setConfirming('close')}>
              Close budget
            </Button>
          )}
          {data.status !== 'VOIDED' && (
            <Button variant="danger-ghost" onClick={() => setVoiding(true)}>
              Void
            </Button>
          )}
        </div>
      </div>

      {/* Lines */}
      <Card className="space-y-4 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">Budget lines</h3>
            <p className="text-sm text-muted-foreground">
              What the shared costs come to for the whole period. Total{' '}
              {formatCurrency(isDraft ? linesTotal : data.total)}.
            </p>
          </div>
          {isDraft && (
            <SegmentedControl
              aria-label="How the budget is shared"
              value={data.method}
              onValueChange={(method) => setMethod.mutate(method)}
              segments={[
                { value: 'EQUAL', label: 'Equally' },
                { value: 'WEIGHTED', label: 'By weight' },
              ]}
            />
          )}
        </div>
        {lines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No lines yet. Add diesel, security, cleaning and so on.
          </p>
        )}
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div
              key={line.key}
              className="grid gap-2 sm:grid-cols-[12rem_1fr_11rem_auto] sm:items-center"
            >
              <Select
                ariaLabel={`Line ${index + 1} category`}
                value={line.category}
                disabled={!isDraft}
                onValueChange={(category) =>
                  setLines((all) =>
                    all.map((l) =>
                      l.key === line.key ? { ...l, category: category as ServiceChargeCategory } : l
                    )
                  )
                }
                options={SERVICE_CHARGE_CATEGORIES.map((value) => ({
                  value,
                  label: SERVICE_CHARGE_CATEGORY_LABELS[value],
                }))}
              />
              <Input
                aria-label={`Line ${index + 1} description`}
                value={line.label}
                disabled={!isDraft}
                maxLength={120}
                onChange={(event) =>
                  setLines((all) =>
                    all.map((l) => (l.key === line.key ? { ...l, label: event.target.value } : l))
                  )
                }
              />
              <CurrencyInput
                aria-label={`Line ${index + 1} amount`}
                value={line.amount || ''}
                disabled={!isDraft}
                onValueChange={(amount) =>
                  setLines((all) => all.map((l) => (l.key === line.key ? { ...l, amount } : l)))
                }
                placeholder="0"
              />
              {isDraft ? (
                <IconButton
                  label={`Remove line ${index + 1}`}
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setLines((all) => all.filter((l) => l.key !== line.key))}
                />
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
        {isDraft && (
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() =>
                setLines((all) => [
                  ...all,
                  {
                    key: `new-${(lineKey += 1)}`,
                    category: 'DIESEL',
                    label: SERVICE_CHARGE_CATEGORY_LABELS.DIESEL,
                    amount: 0,
                  },
                ])
              }
            >
              Add line
            </Button>
            <Button
              size="sm"
              disabled={!linesDirty}
              isLoading={saveLines.isPending}
              onClick={() => saveLines.mutate()}
            >
              Save lines
            </Button>
          </div>
        )}
      </Card>

      {/* Units */}
      {isDraft && (
        <Card className="space-y-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">Units sharing it</h3>
              <p className="text-sm text-muted-foreground">
                {data.method === 'EQUAL'
                  ? 'Every included unit pays the same share.'
                  : 'A unit with weight 2 pays twice the share of a unit with weight 1.'}
              </p>
            </div>
            {data.method === 'WEIGHTED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setUnits((all) =>
                    all.map((u) => ({ ...u, weight: String(bedroomWeight(u.bedrooms)) }))
                  )
                }
              >
                Weight by bedrooms
              </Button>
            )}
          </div>
          <ul className="divide-y divide-border">
            {units.map((unit) => {
              const note = data.participants.find((x) => x.unitId === unit.unitId)?.exclusionReason;
              return (
                <li key={unit.unitId} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{unit.label}</p>
                    {!unit.included && note && (
                      <p className="text-xs text-muted-foreground">{note}</p>
                    )}
                  </div>
                  {data.method === 'WEIGHTED' && (
                    <Input
                      aria-label={`Weight for ${unit.label}`}
                      className="w-24"
                      inputMode="decimal"
                      value={unit.weight}
                      disabled={!unit.included}
                      onChange={(event) =>
                        setUnits((all) =>
                          all.map((u) =>
                            u.unitId === unit.unitId ? { ...u, weight: event.target.value } : u
                          )
                        )
                      }
                    />
                  )}
                  <Switch
                    aria-label={`${unit.label} shares the service charge`}
                    checked={unit.included}
                    onCheckedChange={(included) =>
                      setUnits((all) =>
                        all.map((u) => (u.unitId === unit.unitId ? { ...u, included } : u))
                      )
                    }
                    label="Shares it"
                  />
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!unitsDirty}
              isLoading={saveUnits.isPending}
              onClick={() => saveUnits.mutate()}
            >
              Save units
            </Button>
          </div>
        </Card>
      )}

      {/* Preview and publish */}
      {isDraft && (
        <Card className="space-y-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">Each unit&apos;s share</h3>
              <p className="text-sm text-muted-foreground">
                Checked against the saved lines and units. Tenants are billed for the part of each
                instalment their lease covers; a vacant unit&apos;s share is the owner&apos;s.
              </p>
            </div>
            <Button disabled={!canPublish} onClick={() => setConfirming('publish')}>
              Publish and bill tenants
            </Button>
          </div>
          {(linesDirty || unitsDirty) && (
            <Alert variant="info">Save your changes to see the shares they give.</Alert>
          )}
          {p?.blockers.map((blocker) => (
            <Alert key={blocker} variant="warning">
              {blocker}
            </Alert>
          ))}
          {p?.warnings.map((warning) => (
            <Alert key={warning} variant="warning">
              {warning}
            </Alert>
          ))}
          {preview.isLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : p && p.blockers.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {p.instalments.length === 1
                  ? `One payment, due ${formatDay(p.instalments[0].dueDate)}.`
                  : `${p.instalments.length} instalments, the first due ${formatDay(p.instalments[0].dueDate)}.`}{' '}
                Each is billed {data.leadDays} days before it is due.
              </p>
              <DataTable
                caption="Each unit's share"
                density="compact"
                minWidth="560px"
                getRowKey={(row) => row.id}
                data={p.participants}
                columns={
                  [
                    {
                      key: 'unit',
                      header: 'Unit',
                      render: (row) => (
                        <div>
                          <p className={row.included ? 'font-medium' : 'text-muted-foreground'}>
                            {row.label}
                          </p>
                          {row.tenancies[0]?.tenant && (
                            <p className="text-xs text-muted-foreground">
                              {row.tenancies[0].tenant}
                            </p>
                          )}
                          {row.notes.map((n) => (
                            <p key={n} className="text-xs text-muted-foreground">
                              {n}
                            </p>
                          ))}
                        </div>
                      ),
                    },
                    {
                      key: 'per',
                      header: p.instalments.length === 1 ? 'Payment' : 'Each instalment',
                      numeric: true,
                      render: (row) =>
                        row.included
                          ? row.instalments.every((n) => n === row.instalments[0])
                            ? formatCurrency(row.instalments[0] ?? 0)
                            : `${formatCurrency(Math.min(...row.instalments))} to ${formatCurrency(Math.max(...row.instalments))}`
                          : 'Not sharing',
                    },
                    {
                      key: 'total',
                      header: 'Share of budget',
                      numeric: true,
                      render: (row) =>
                        row.included ? (
                          <span className="font-medium">{formatCurrency(row.total)}</span>
                        ) : (
                          ''
                        ),
                    },
                  ] satisfies Column<(typeof p.participants)[number]>[]
                }
              />
              <p className="text-sm text-muted-foreground">
                Shares add up to {formatCurrency(p.apportioned)} of {formatCurrency(p.total)}.
              </p>
            </>
          ) : null}
        </Card>
      )}

      {!isDraft && <ChargesTable budgetId={budgetId} />}

      <ConfirmDialog
        open={confirming === 'publish'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Publish and bill tenants?"
        description={
          p
            ? `${formatCurrency(p.total)} will be shared across ${p.unitsSharing} ${p.unitsSharing === 1 ? 'unit' : 'units'}. ${
                p.instalments.filter((i) => i.alreadyDue).length
                  ? 'Instalments already within their billing window are billed to tenants now.'
                  : 'Tenants are billed as each instalment falls due.'
              } Once published, the lines and shares are locked. You will be asked to confirm it is you.`
            : ''
        }
        confirmLabel="Publish"
        isLoading={publish.isPending}
        onConfirm={() => publish.mutate()}
      />
      <ConfirmDialog
        open={confirming === 'close'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Close this budget?"
        description="Nothing more will be billed from it. Charges already issued stay as they are."
        confirmLabel="Close budget"
        isLoading={close.isPending}
        onConfirm={() => close.mutate()}
      />
      <ReasonDialog
        open={voiding}
        onOpenChange={setVoiding}
        title="Void this budget"
        description="Only possible while no tenant has paid towards it. Its unpaid charges are removed from tenants' accounts."
        reasonLabel="Why is it being voided?"
        reasonPlaceholder="e.g. Wrong figures, re-entered as a new budget"
        minLength={3}
        maxLength={500}
        confirmLabel="Void budget"
        tone="danger"
        error={voidBudget.error?.message}
        onSubmit={({ reason }) => voidBudget.mutateAsync(reason).then(() => setVoiding(false))}
      />
    </section>
  );
}

function ChargesTable({ budgetId }: { budgetId: string }) {
  const [page, setPage] = useState(1);
  const invoices = useQuery({
    queryKey: [...homeManagementKeys.utilities.serviceCharge(budgetId), 'invoices', page],
    queryFn: () => unwrap(serviceChargesService.invoices(budgetId, page)),
    placeholderData: keepPreviousData,
  });
  const columns: Column<ServiceChargeInvoice>[] = [
    { key: 'instalment', header: 'Instalment', render: (row) => `${row.instalment}` },
    {
      key: 'unit',
      header: 'Unit and tenant',
      render: (row) => (
        <div>
          <p className="font-medium">{row.unit}</p>
          <p className="text-xs text-muted-foreground">
            {row.tenant ?? (row.skipReason === 'VACANT' ? 'Vacant' : 'No tenant')}
            {row.prorated ? ` · ${formatDay(row.periodStart)} to ${formatDay(row.periodEnd)}` : ''}
          </p>
        </div>
      ),
    },
    { key: 'due', header: 'Due', render: (row) => formatDay(row.dueDate) },
    { key: 'amount', header: 'Amount', numeric: true, render: (row) => formatCurrency(row.amount) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={COLLECTION_BADGE[row.collection]}>
          {SERVICE_CHARGE_COLLECTION_LABELS[row.collection]}
        </Badge>
      ),
    },
  ];
  const data = invoices.data;
  return (
    <Card className="space-y-4 rounded-2xl p-5">
      <div>
        <h3 className="font-semibold text-foreground">What was billed</h3>
        <p className="text-sm text-muted-foreground">
          Tenants pay these with their rent. Payment status comes from each tenant&apos;s account.
        </p>
      </div>
      {invoices.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          size="compact"
          bare
          title="Nothing billed yet"
          description="Each instalment is billed to tenants when it reaches its billing date."
        />
      ) : (
        <>
          <DataTable
            caption="Service charges billed"
            density="compact"
            minWidth="640px"
            columns={columns}
            data={data.items}
            getRowKey={(row) => row.id}
          />
          {data.total > 25 && (
            <Pagination page={page} pageSize={25} total={data.total} onPageChange={setPage} />
          )}
        </>
      )}
    </Card>
  );
}
