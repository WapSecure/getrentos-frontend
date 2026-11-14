'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Plus, ReceiptText, Trash2 } from '@sureground/icons';
import {
  SERVICE_CHARGE_CATEGORIES,
  SERVICE_CHARGE_CATEGORY_LABELS,
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_STATUS_LABELS,
  dayAfter,
  formatCurrency,
  shareSummary,
  withStepUpSummary,
  type ServiceChargeBillingCycle,
  type ServiceChargeBudgetStatus,
  type ServiceChargeCategory,
  type ServiceChargeMethod,
} from '@sureground/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardSkeleton,
  ConfirmDialog,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  ReasonDialog,
  SegmentedControl,
  Select,
  Skeleton,
  Switch,
  useToast,
  type BadgeVariant,
} from '@sureground/ui';
import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import {
  estateServiceChargesService,
  type EstateServiceChargeBudget,
} from '@/services/estateServiceChargesService';

const STATUS_BADGE: Record<ServiceChargeBudgetStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  CLOSED: 'info',
  VOIDED: 'danger',
};

const formatDay = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Service-charge budgets for the estate, billed to households as dues. */
export default function EstateServiceChargesPage() {
  const { estate, isLoading } = useSelectedEstate();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const budgets = useQuery({
    queryKey: estateKeys.serviceCharges(estate?.id ?? ''),
    queryFn: () => unwrap(estateServiceChargesService.list(estate!.id)),
    enabled: !!estate,
  });

  if (isLoading) return <CardSkeleton />;
  if (!estate) return <RedirectToEstateSetup />;
  if (openId)
    return <BudgetView estateId={estate.id} budgetId={openId} onBack={() => setOpenId(null)} />;

  const items = budgets.data ?? [];
  return (
    <>
      <PageHeader
        title="Service charge"
        description={`Yearly budgets for ${estate.name}'s shared costs, shared across households and billed as dues.`}
        breadcrumbs={[{ label: 'Dues', href: '/estate/dues' }, { label: 'Service charge' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            New budget
          </Button>
        }
      />
      {budgets.isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No service charge budgets yet"
          description="Set the year's security, waste, power and upkeep costs, check each household's share, then publish to bill them as dues."
          action={<Button onClick={() => setCreating(true)}>New budget</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((budget) => (
            <li key={budget.id}>
              <button
                type="button"
                className="w-full cursor-pointer text-left"
                onClick={() => setOpenId(budget.id)}
              >
                <Card className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-secondary/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{budget.title}</p>
                      <Badge variant={STATUS_BADGE[budget.status]}>
                        {SERVICE_CHARGE_STATUS_LABELS[budget.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {formatDay(budget.periodStart)} to {formatDay(budget.lastDay)} ·{' '}
                      {SERVICE_CHARGE_CYCLE_LABELS[budget.billingCycle]} ·{' '}
                      {shareSummary(
                        budget.method,
                        budget.participants.filter((p) => p.included).length
                      ).replace(/units?/, (u) => (u === 'unit' ? 'household' : 'households'))}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">{formatCurrency(budget.total)}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent size="lg">
          <CreateForm
            estateId={estate.id}
            onCreated={(id) => {
              setCreating(false);
              setOpenId(id);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateForm({
  estateId,
  onCreated,
}: {
  estateId: string;
  onCreated: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const year = new Date().getFullYear() + 1;
  const [title, setTitle] = useState(`Estate service charge ${year}`);
  const [start, setStart] = useState(`${year}-01-01`);
  const [lastDay, setLastDay] = useState(`${year}-12-31`);
  const [cycle, setCycle] = useState<ServiceChargeBillingCycle>('QUARTERLY');
  const [method, setMethod] = useState<ServiceChargeMethod>('EQUAL');
  const create = useMutation({
    mutationFn: () =>
      unwrap(
        estateServiceChargesService.create(estateId, {
          title: title.trim(),
          periodStart: start,
          periodEnd: dayAfter(lastDay),
          billingCycle: cycle,
          method,
        })
      ),
    onSuccess: (budget) => {
      void queryClient.invalidateQueries({ queryKey: estateKeys.serviceCharges(estateId) });
      onCreated(budget.id);
    },
  });
  const valid = title.trim().length >= 3 && !!start && !!lastDay && lastDay >= start;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) create.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        New service charge budget
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Every active household is added to share it. Nothing is billed until you publish.
      </DialogDescription>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Name" required className="md:col-span-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
        </Field>
        <Field label="Covers from" required>
          <DatePicker value={start} onChange={setStart} ariaLabel="Covers from" />
        </Field>
        <Field label="Last day covered" required>
          <DatePicker
            value={lastDay}
            onChange={setLastDay}
            min={start}
            ariaLabel="Last day covered"
          />
        </Field>
        <Field label="Billed" required>
          <Select
            ariaLabel="Billed"
            value={cycle}
            onValueChange={(value) => setCycle(value as ServiceChargeBillingCycle)}
            options={(['ANNUAL', 'QUARTERLY', 'MONTHLY'] as const).map((value) => ({
              value,
              label: SERVICE_CHARGE_CYCLE_LABELS[value],
            }))}
          />
        </Field>
        <Field label="Shared" required>
          <SegmentedControl
            aria-label="How the budget is shared"
            value={method}
            onValueChange={setMethod}
            segments={[
              { value: 'EQUAL', label: 'Equally' },
              { value: 'WEIGHTED', label: 'By weight' },
            ]}
          />
        </Field>
      </div>
      {create.error && (
        <Alert variant="danger" className="mt-4">
          {create.error.message}
        </Alert>
      )}
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={!valid} isLoading={create.isPending}>
          Create budget
        </Button>
      </div>
    </form>
  );
}

type LineDraft = { key: string; category: ServiceChargeCategory; label: string; amount: number };
let lineKey = 0;

function BudgetView({
  estateId,
  budgetId,
  onBack,
}: {
  estateId: string;
  budgetId: string;
  onBack: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const key = estateKeys.serviceCharge(estateId, budgetId);
  const budget = useQuery({
    queryKey: key,
    queryFn: () => unwrap(estateServiceChargesService.get(estateId, budgetId)),
  });
  const data = budget.data;
  const isDraft = data?.status === 'DRAFT';
  const preview = useQuery({
    queryKey: [...key, 'preview', data?.lines, data?.participants, data?.method],
    queryFn: () => unwrap(estateServiceChargesService.preview(estateId, budgetId)),
    enabled: isDraft,
  });
  const invoices = useQuery({
    queryKey: [...key, 'invoices'],
    queryFn: () => unwrap(estateServiceChargesService.invoices(estateId, budgetId)),
    enabled: !!data && !isDraft,
  });
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [households, setHouseholds] = useState<
    { householdId: string; label: string; weight: string; included: boolean }[]
  >([]);
  const [synced, setSynced] = useState<EstateServiceChargeBudget | undefined>();
  if (data && data !== synced) {
    setSynced(data);
    setLines(
      data.lines.map((l) => ({ key: l.id, category: l.category, label: l.label, amount: l.amount }))
    );
    setHouseholds(
      data.participants
        .filter((p) => p.householdId)
        .map((p) => ({
          householdId: p.householdId!,
          label: p.label,
          weight: String(p.weight),
          included: p.included,
        }))
    );
  }
  const [confirming, setConfirming] = useState<'publish' | 'close' | null>(null);
  const [voiding, setVoiding] = useState(false);
  const refresh = (next?: EstateServiceChargeBudget) => {
    if (next) queryClient.setQueryData(key, next);
    void queryClient.invalidateQueries({ queryKey: estateKeys.serviceCharges(estateId) });
  };
  const onError = (error: Error) => toast.error(error.message);
  const saveLines = useMutation({
    mutationFn: () =>
      unwrap(
        estateServiceChargesService.setLines(
          estateId,
          budgetId,
          lines
            .filter((l) => l.label.trim() && l.amount > 0)
            .map(({ category, label, amount }) => ({ category, label: label.trim(), amount }))
        )
      ),
    onSuccess: (next) => {
      refresh(next);
      toast.success('Budget lines saved.');
    },
    onError,
  });
  const saveHouseholds = useMutation({
    mutationFn: () =>
      unwrap(
        estateServiceChargesService.setHouseholds(
          estateId,
          budgetId,
          households.map((h) => ({
            householdId: h.householdId,
            weight: Number(h.weight) >= 0 ? Number(h.weight) : 1,
            included: h.included,
          }))
        )
      ),
    onSuccess: (next) => {
      refresh(next);
      toast.success('Households saved.');
    },
    onError,
  });
  const publish = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Publish ${data!.title} and bill households`, () =>
        unwrap(estateServiceChargesService.publish(estateId, budgetId, preview.data!.previewHash))
      ),
    onSuccess: (next) => {
      setConfirming(null);
      refresh(next);
      toast.success(
        next.issuedNow > 0
          ? `Published. ${next.issuedNow} ${next.issuedNow === 1 ? 'household has' : 'households have'} been billed.`
          : 'Published. Households are billed as each instalment falls due.'
      );
    },
    onError: (error: Error) => {
      setConfirming(null);
      void preview.refetch();
      onError(error);
    },
  });
  const close = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Close ${data!.title}`, () =>
        unwrap(estateServiceChargesService.close(estateId, budgetId))
      ),
    onSuccess: (next) => {
      setConfirming(null);
      refresh(next);
    },
    onError,
  });
  const voidBudget = useMutation({
    mutationFn: (reason: string) =>
      withStepUpSummary(`Void ${data!.title}`, () =>
        unwrap(estateServiceChargesService.void(estateId, budgetId, reason))
      ),
    onSuccess: () => {
      refresh();
      void budget.refetch();
      toast.success('Voided. Its unpaid dues have been waived.');
    },
  });

  if (budget.isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!data) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="This budget could not be loaded"
        action={<Button onClick={onBack}>Back to budgets</Button>}
      />
    );
  }
  const lineValues = (all: LineDraft[]) =>
    all.map(({ category, label, amount }) => ({ category, label, amount }));
  const linesDirty =
    JSON.stringify(lineValues(lines)) !==
    JSON.stringify(
      lineValues(
        data.lines.map((l) => ({
          key: l.id,
          category: l.category,
          label: l.label,
          amount: l.amount,
        }))
      )
    );
  const householdsDirty =
    JSON.stringify(households) !==
    JSON.stringify(
      data.participants
        .filter((p) => p.householdId)
        .map((p) => ({
          householdId: p.householdId!,
          label: p.label,
          weight: String(p.weight),
          included: p.included,
        }))
    );
  const p = preview.data;
  const canPublish = isDraft && !!p && p.blockers.length === 0 && !linesDirty && !householdsDirty;

  return (
    <section aria-labelledby="estate-budget-heading" className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>
        All budgets
      </Button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1
              id="estate-budget-heading"
              className="text-2xl font-semibold tracking-[-0.02em] text-foreground"
            >
              {data.title}
            </h1>
            <Badge variant={STATUS_BADGE[data.status]}>
              {SERVICE_CHARGE_STATUS_LABELS[data.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDay(data.periodStart)} to {formatDay(data.lastDay)} · Billed{' '}
            {SERVICE_CHARGE_CYCLE_LABELS[data.billingCycle].toLowerCase()} · Total{' '}
            {formatCurrency(data.total)}
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

      <Card className="space-y-4 rounded-2xl p-5">
        <h2 className="font-semibold text-foreground">Budget lines</h2>
        {!isDraft ? (
          <ul className="divide-y divide-border">
            {data.lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{line.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {SERVICE_CHARGE_CATEGORY_LABELS[line.category]}
                  </p>
                </div>
                <p className="font-medium tabular-nums">{formatCurrency(line.amount)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <>
            {lines.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No lines yet. Add security, waste (PSP), power and so on.
              </p>
            )}
            {lines.map((line, index) => (
              <div
                key={line.key}
                className="grid gap-2 sm:grid-cols-[12rem_1fr_11rem_auto] sm:items-center"
              >
                <Select
                  ariaLabel={`Line ${index + 1} category`}
                  value={line.category}
                  onValueChange={(category) =>
                    setLines((all) =>
                      all.map((l) =>
                        l.key === line.key
                          ? { ...l, category: category as ServiceChargeCategory }
                          : l
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
                  onValueChange={(amount) =>
                    setLines((all) => all.map((l) => (l.key === line.key ? { ...l, amount } : l)))
                  }
                  placeholder="0"
                />
                <IconButton
                  label={`Remove line ${index + 1}`}
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setLines((all) => all.filter((l) => l.key !== line.key))}
                />
              </div>
            ))}
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
                      category: 'SECURITY',
                      label: 'Security',
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
          </>
        )}
      </Card>

      {isDraft && (
        <Card className="space-y-4 rounded-2xl p-5">
          <div>
            <h2 className="font-semibold text-foreground">Households sharing it</h2>
            <p className="text-sm text-muted-foreground">
              {data.method === 'EQUAL'
                ? 'Every included household pays the same share.'
                : 'A household with weight 2 pays twice the share of one with weight 1.'}
            </p>
          </div>
          <ul className="divide-y divide-border">
            {households.map((h) => (
              <li key={h.householdId} className="flex flex-wrap items-center gap-3 py-2.5">
                <p className="min-w-0 flex-1 font-medium text-foreground">{h.label}</p>
                {data.method === 'WEIGHTED' && (
                  <Input
                    aria-label={`Weight for ${h.label}`}
                    className="w-24"
                    inputMode="decimal"
                    value={h.weight}
                    disabled={!h.included}
                    onChange={(event) =>
                      setHouseholds((all) =>
                        all.map((x) =>
                          x.householdId === h.householdId ? { ...x, weight: event.target.value } : x
                        )
                      )
                    }
                  />
                )}
                <Switch
                  aria-label={`${h.label} shares the service charge`}
                  checked={h.included}
                  onCheckedChange={(included) =>
                    setHouseholds((all) =>
                      all.map((x) => (x.householdId === h.householdId ? { ...x, included } : x))
                    )
                  }
                  label="Shares it"
                />
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!householdsDirty}
              isLoading={saveHouseholds.isPending}
              onClick={() => saveHouseholds.mutate()}
            >
              Save households
            </Button>
          </div>
        </Card>
      )}

      {isDraft && (
        <Card className="space-y-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-foreground">Each household&apos;s share</h2>
              <p className="text-sm text-muted-foreground">
                Billed as dues, which residents pay as they pay other estate dues.
              </p>
            </div>
            <Button disabled={!canPublish} onClick={() => setConfirming('publish')}>
              Publish and bill households
            </Button>
          </div>
          {(linesDirty || householdsDirty) && (
            <Alert variant="info">Save your changes to see the shares they give.</Alert>
          )}
          {p?.blockers.map((blocker) => (
            <Alert key={blocker} variant="warning">
              {blocker}
            </Alert>
          ))}
          {p && p.blockers.length === 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {p.instalments.length === 1
                  ? `One payment, due ${formatDay(p.instalments[0].dueDate)}.`
                  : `${p.instalments.length} instalments, the first due ${formatDay(p.instalments[0].dueDate)}.`}{' '}
                Shares add up to {formatCurrency(p.apportioned)} of {formatCurrency(p.total)}.
              </p>
              <ul className="divide-y divide-border">
                {p.participants.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <p
                      className={`min-w-0 flex-1 ${row.included ? 'font-medium' : 'text-muted-foreground'}`}
                    >
                      {row.label}
                    </p>
                    <p className="tabular-nums text-muted-foreground">
                      {row.included && p.instalments.length > 1
                        ? `${formatCurrency(row.instalments[0] ?? 0)} each instalment · `
                        : ''}
                    </p>
                    <p className="font-medium tabular-nums">
                      {row.included ? formatCurrency(row.total) : 'Not sharing'}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      {!isDraft && (
        <Card className="space-y-3 rounded-2xl p-5">
          <h2 className="font-semibold text-foreground">What was billed</h2>
          {invoices.isLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (invoices.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing billed yet. Each instalment is billed when it reaches its billing date.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {(invoices.data ?? []).map((row) => (
                <li key={row.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <p className="min-w-0 flex-1">
                    <span className="font-medium">{row.unit}</span>
                    <span className="text-muted-foreground">
                      {row.tenant ? `, ${row.tenant}` : ''} · instalment {row.instalment} · due{' '}
                      {formatDay(row.dueDate)}
                    </span>
                  </p>
                  <Badge
                    variant={
                      row.collection === 'PAID'
                        ? 'success'
                        : row.collection === 'VOIDED'
                          ? 'danger'
                          : 'neutral'
                    }
                  >
                    {row.collection === 'PAID'
                      ? 'Paid'
                      : row.collection === 'UNPAID'
                        ? 'Not paid yet'
                        : row.collection === 'VOIDED'
                          ? 'Voided'
                          : 'Waived'}
                  </Badge>
                  <p className="font-medium tabular-nums">{formatCurrency(row.amount)}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Each charge is also listed under{' '}
            <Link
              href="/estate/dues"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Dues
            </Link>
            .
          </p>
        </Card>
      )}

      <ConfirmDialog
        open={confirming === 'publish'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Publish and bill households?"
        description={
          p
            ? `${formatCurrency(p.total)} will be shared across ${p.unitsSharing} ${p.unitsSharing === 1 ? 'household' : 'households'} and billed as dues when each instalment falls due. Once published, the lines and shares are locked. You will be asked to confirm it is you.`
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
        description="Nothing more will be billed from it. Dues already raised stay as they are."
        confirmLabel="Close budget"
        isLoading={close.isPending}
        onConfirm={() => close.mutate()}
      />
      <ReasonDialog
        open={voiding}
        onOpenChange={setVoiding}
        title="Void this budget"
        description="Only possible while no household has paid towards it. Its unpaid dues are waived."
        reasonLabel="Why is it being voided?"
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
