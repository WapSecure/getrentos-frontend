'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  DatePicker,
  EmptyState,
  PageErrorState,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';

import {
  adminManagedPnlService,
  adminManagedService,
  type ManagedCost,
  type ManagedCostCategory,
  type PnlFigures,
  type PnlGroupBy,
} from '@/services/adminManagedService';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';

const CATEGORY_LABEL: Record<ManagedCostCategory, string> = {
  FIELD_VISIT: 'Field visit',
  STAFF_TIME: 'Staff time',
  TRANSPORT: 'Transport',
  LEGAL: 'Legal',
  MARKETING: 'Marketing',
  VENDOR_OVERSIGHT: 'Vendor oversight',
  OTHER: 'Other',
};

const GROUP_LABEL: Record<PnlGroupBy, string> = {
  property: 'Property',
  manager: 'Portfolio manager',
  tier: 'Package',
  region: 'Region',
};

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

/** The last 18 months as YYYY-MM, newest first, in Lagos time. */
const recentMonths = () => {
  const now = new Date(Date.now() + 3_600_000);
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < 18; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    });
  }
  return out;
};

const money = (n: number) => (n < 0 ? `−${formatCurrency(-n)}` : formatCurrency(n));

const MarginCell = ({ f }: { f: PnlFigures }) => (
  <span className={f.margin < 0 ? 'text-destructive' : 'text-foreground'}>
    {money(f.margin)}
    {f.marginPct !== null && <span className="ml-1 text-muted-foreground">({f.marginPct}%)</span>}
  </span>
);

const Tile = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
  </Card>
);

const RecordCost = ({ canOperate, onSaved }: { canOperate: boolean; onSaved: () => void }) => {
  const engagements = useQuery({
    queryKey: ['admin', 'managed-pnl', 'engagements'],
    queryFn: () => unwrap(adminManagedService.listActive()),
  });
  const [mandateId, setMandateId] = useState('');
  const [category, setCategory] = useState<ManagedCostCategory>('FIELD_VISIT');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        adminManagedPnlService.recordCost({
          mandateId,
          category,
          amount,
          incurredOn: `${date}T12:00:00+01:00`,
          note: note.trim(),
        })
      ),
    onSuccess: () => {
      setError(null);
      setAmount(0);
      setNote('');
      onSaved();
    },
    onError: (err: Error) => setError(err.message || 'Could not record the cost.'),
  });

  if (!canOperate) return null;
  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-semibold text-foreground">Record a direct cost</h2>
        <p className="text-sm text-muted-foreground">
          What delivering an engagement cost GetRentos from its own funds: a field trip, staff time,
          legal work. A mistake is voided, never edited.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          ariaLabel="Engagement"
          value={mandateId}
          onValueChange={setMandateId}
          options={[
            { value: '', label: 'Choose an engagement…' },
            ...(engagements.data ?? []).map((m) => ({
              value: m.id,
              label: m.propertyTitle ?? 'Property',
            })),
          ]}
        />
        <Select
          ariaLabel="Category"
          value={category}
          onValueChange={(v) => setCategory(v as ManagedCostCategory)}
          options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <CurrencyInput prefix="₦" value={amount || ''} onValueChange={setAmount} />
        <DatePicker value={date} onChange={setDate} max={new Date().toISOString().slice(0, 10)} />
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What it was for"
        className={inputClass}
      />
      <Button
        isLoading={save.isPending}
        disabled={!mandateId || amount <= 0 || !date || note.trim().length < 5}
        onClick={() => save.mutate()}
      >
        Record cost
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Card>
  );
};

const CostRow = ({
  cost,
  canOperate,
  onChanged,
}: {
  cost: ManagedCost;
  canOperate: boolean;
  onChanged: () => void;
}) => {
  const [reason, setReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voidCost = useMutation({
    mutationFn: () => unwrap(adminManagedPnlService.voidCost(cost.id, reason.trim())),
    onSuccess: () => {
      setError(null);
      setVoiding(false);
      onChanged();
    },
    onError: (err: Error) => setError(err.message || 'Could not void it.'),
  });
  return (
    <li className="py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            className={`text-sm ${cost.voidedAt ? 'text-muted-foreground line-through' : 'text-foreground'}`}
          >
            {cost.propertyTitle} · {CATEGORY_LABEL[cost.category]} · {cost.note}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(cost.incurredOn)}
            {cost.voidedAt && <> · voided: {cost.voidReason}</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-foreground">
            {formatCurrency(cost.amount)}
          </span>
          {cost.voidedAt ? (
            <Badge variant="neutral">Voided</Badge>
          ) : (
            canOperate && (
              <button
                type="button"
                onClick={() => setVoiding((v) => !v)}
                className="text-sm text-muted-foreground hover:text-destructive"
              >
                Void
              </button>
            )
          )}
        </div>
      </div>
      {voiding && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why it is wrong"
            className={`${inputClass} sm:w-80`}
          />
          <Button
            variant="danger"
            isLoading={voidCost.isPending}
            disabled={reason.trim().length < 5}
            onClick={() => voidCost.mutate()}
          >
            Void cost
          </Button>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </li>
  );
};

export default function ManagedPnlPage() {
  const user = useAdminUser();
  const canOperate = hasAdminPermission(user?.roles, 'managed.operate');
  const queryClient = useQueryClient();
  const months = useMemo(() => recentMonths(), []);
  const [from, setFrom] = useState(months[2].value);
  const [to, setTo] = useState(months[0].value);
  const [groupBy, setGroupBy] = useState<PnlGroupBy>('property');

  const report = useQuery({
    queryKey: ['admin', 'managed-pnl', 'report', from, to, groupBy],
    queryFn: () => unwrap(adminManagedPnlService.report(from, to, groupBy)),
    enabled: from <= to,
  });
  const costs = useQuery({
    queryKey: ['admin', 'managed-pnl', 'costs', from, to],
    queryFn: () => unwrap(adminManagedPnlService.costs(from, to)),
    enabled: from <= to,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-pnl'] });

  const pnl = report.data;
  const t = pnl?.totals;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <TrendingUp className="h-6 w-6 text-primary" aria-hidden />
          Managed P&amp;L
        </h1>
        <p className="mt-1 text-muted-foreground">
          GetRentos Managed&rsquo;s contribution margin: its own fees, less delivery partners&rsquo;
          share and direct costs. Read from the journal&rsquo;s Managed-tagged lines, so it is kept
          apart from platform revenue. Fees count when the owner&rsquo;s statement pays out.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block sm:w-56">
          <span className="text-sm text-muted-foreground">From</span>
          <div className="mt-1">
            <Select ariaLabel="From month" value={from} onValueChange={setFrom} options={months} />
          </div>
        </label>
        <label className="block sm:w-56">
          <span className="text-sm text-muted-foreground">To</span>
          <div className="mt-1">
            <Select ariaLabel="To month" value={to} onValueChange={setTo} options={months} />
          </div>
        </label>
      </div>
      {from > to && (
        <p className="text-sm text-destructive">The first month must not be after the last.</p>
      )}

      {report.isError ? (
        <PageErrorState
          title="Could not load the P&L"
          description={(report.error as Error).message}
          onRetry={() => void report.refetch()}
        />
      ) : report.isLoading || !pnl || !t ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile
              label="Fee revenue"
              value={money(t.revenue)}
              note={`${t.engagements} engagement${t.engagements === 1 ? '' : 's'}`}
            />
            <Tile
              label="Partner share"
              value={money(t.partnerShare)}
              note="Paid to delivery partners"
            />
            <Tile label="Direct costs" value={money(t.directCosts)} note="Recorded by ops" />
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Contribution margin</p>
              <p
                className={`mt-1 text-3xl font-semibold ${t.margin < 0 ? 'text-destructive' : 'text-foreground'}`}
              >
                {money(t.margin)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.marginPct === null ? 'No revenue in this range' : `${t.marginPct}% of revenue`}
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-foreground">
                By {GROUP_LABEL[groupBy].toLowerCase()}
              </h2>
              <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as PnlGroupBy)}>
                <TabsList>
                  {(Object.keys(GROUP_LABEL) as PnlGroupBy[]).map((g) => (
                    <TabsTrigger key={g} value={g}>
                      {GROUP_LABEL[g]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            {pnl.rows.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Nothing booked in this range"
                description="Managed revenue appears when an owner's statement pays out; costs when they are recorded."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">{GROUP_LABEL[groupBy]}</th>
                      <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                      <th className="py-2 pr-3 text-right font-medium">Partner share</th>
                      <th className="py-2 pr-3 text-right font-medium">Direct costs</th>
                      <th className="py-2 text-right font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {pnl.rows.map((r) => (
                      <tr key={r.key} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3">
                          <span className="text-foreground">{r.label}</span>
                          {r.detail && (
                            <span className="block text-xs text-muted-foreground">{r.detail}</span>
                          )}
                          {groupBy !== 'property' && (
                            <span className="block text-xs text-muted-foreground">
                              {r.engagements} engagement{r.engagements === 1 ? '' : 's'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right text-foreground">{money(r.revenue)}</td>
                        <td className="py-2 pr-3 text-right text-foreground">
                          {money(r.partnerShare)}
                        </td>
                        <td className="py-2 pr-3 text-right text-foreground">
                          {money(r.directCosts)}
                        </td>
                        <td className="py-2 text-right">
                          <MarginCell f={r} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {pnl.months.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold text-foreground">By month</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Month</th>
                      <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                      <th className="py-2 pr-3 text-right font-medium">Costs</th>
                      <th className="py-2 text-right font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {pnl.months.map((m) => (
                      <tr key={m.period} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3 text-foreground">
                          {months.find((x) => x.value === m.period)?.label ?? m.period}
                        </td>
                        <td className="py-2 pr-3 text-right text-foreground">{money(m.revenue)}</td>
                        <td className="py-2 pr-3 text-right text-foreground">
                          {money(m.partnerShare + m.directCosts)}
                        </td>
                        <td className="py-2 text-right">
                          <MarginCell f={m} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <RecordCost canOperate={canOperate} onSaved={refresh} />

      <Card className="p-5">
        <h2 className="font-semibold text-foreground">Direct costs in this range</h2>
        {(costs.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None recorded.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(costs.data ?? []).map((cost) => (
              <CostRow key={cost.id} cost={cost} canOperate={canOperate} onChanged={refresh} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
