'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Pause, Play, Plus, ReceiptText, Trash2 } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  CardSkeleton,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  IconButton,
  Input,
  NumberInput,
  Select,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { landlordService } from '@/services/landlordService';
import { CreditRefundHistory } from '@/components/shared/CreditRefundHistory';
import type { Lease, RentSchedule, RentScheduleItem } from '@/types/landlord';

interface RentScheduleModalProps {
  lease: Lease | null;
  onClose: () => void;
}

const CYCLE_LABEL: Record<RentSchedule['cycle'], string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Yearly',
};

const STATUS_COPY: Record<RentSchedule['status'], string> = {
  ACTIVE: 'Invoices are raised automatically.',
  PAUSED: 'Paused: no invoices are raised until you resume.',
  ENDED: 'Every period of this lease has been billed.',
};

/**
 * Recurring rent for a signed lease: what the next invoice will be, when it is
 * raised, and the extras billed with it. Edits apply to invoices not yet raised.
 */
export const RentScheduleModal = ({ lease, onClose }: RentScheduleModalProps) => {
  const queryClient = useQueryClient();
  const leaseId = lease?.id ?? '';
  const key = ['landlord', 'rent-schedule', leaseId];

  const schedule = useQuery({
    queryKey: key,
    enabled: Boolean(lease),
    retry: false,
    queryFn: async () => {
      const res = await landlordService.getRentSchedule(leaseId);
      if (res.success) return res.data!;
      if (res.status === 404) return null;
      throw new Error(res.message || 'The rent schedule could not be loaded.');
    },
  });

  const account = useQuery({
    queryKey: ['landlord', 'rent-account', leaseId],
    enabled: Boolean(lease),
    queryFn: async () => {
      const res = await landlordService.getRentAccount(leaseId);
      if (!res.success) throw new Error(res.message || 'Payments could not be loaded.');
      return res.data!;
    },
  });

  // Two-step: the first click asks, the second refunds.
  const [confirmRefund, setConfirmRefund] = useState(false);
  const refundCredit = useMutation({
    mutationFn: async () => {
      const res = await landlordService.refundTenantCredit(leaseId);
      if (!res.success) throw new Error(res.message || 'The refund could not be made.');
      return res.data!;
    },
    onSuccess: (r) => {
      setConfirmRefund(false);
      setNotice(
        r.status === 'REFUNDED'
          ? `${formatCurrency(r.refundedAmount)} refunded to the tenant, back the way they paid.`
          : r.refundedAmount > 0
            ? `${formatCurrency(r.refundedAmount)} refunded; the rest could not be and stays as credit.`
            : 'The refund could not be made; the credit is unchanged. GetRentos finance sees failed refunds and follows up.'
      );
      account.refetch();
    },
  });

  const [amount, setAmount] = useState('');
  const [leadDays, setLeadDays] = useState('');
  const [items, setItems] = useState<RentScheduleItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Reset the form whenever the server's copy changes (load, save, issue).
  const [syncedFrom, setSyncedFrom] = useState<RentSchedule | null | undefined>(undefined);
  if (schedule.data !== syncedFrom) {
    const s = schedule.data;
    setSyncedFrom(s);
    setAmount(String(s?.amount ?? lease?.rentAmount ?? ''));
    setLeadDays(s ? String(s.leadDays) : '');
    setItems(
      s?.items.map(({ category, label, amount: a }) => ({ category, label, amount: a })) ?? []
    );
  }

  const refresh = (data: RentSchedule | null) => {
    queryClient.setQueryData(key, data);
    queryClient.invalidateQueries({ queryKey: ['landlord', 'payments'] });
  };

  const run =
    <T,>(fn: () => Promise<{ success: boolean; data?: T; message?: string }>) =>
    async () => {
      const res = await fn();
      if (!res.success) throw new Error(res.message || 'That did not work. Please try again.');
      return res.data as T;
    };

  const validItems = items.filter((i) => i.label.trim() && i.amount > 0);
  const input = {
    amount: Number(amount) || undefined,
    leadDays: leadDays === '' ? undefined : Number(leadDays),
    items: validItems,
  };

  const save = useMutation({
    mutationFn: run(() =>
      schedule.data
        ? landlordService.updateRentSchedule(leaseId, input)
        : landlordService.startRentSchedule(leaseId, input)
    ),
    onSuccess: (data) => {
      refresh(data as RentSchedule);
      setNotice(
        schedule.data ? 'Saved. Invoices not yet raised will use these terms.' : 'Schedule started.'
      );
    },
  });

  const togglePause = useMutation({
    mutationFn: run(() =>
      landlordService.setRentSchedulePaused(leaseId, schedule.data?.status === 'ACTIVE')
    ),
    onSuccess: (data) => refresh(data as RentSchedule),
  });

  const issueNow = useMutation({
    mutationFn: run(() => landlordService.issueNextRentInvoice(leaseId)),
    onSuccess: async (data) => {
      const issued = data as { amount: number; dueDate: string };
      setNotice(
        `Invoice for ${formatCurrency(issued.amount)} raised, due ${formatDate(issued.dueDate)}.`
      );
      await schedule.refetch();
      queryClient.invalidateQueries({ queryKey: ['landlord', 'payments'] });
    },
  });

  const error = [save.error, togglePause.error, issueNow.error, refundCredit.error].find(
    Boolean
  ) as Error | undefined;
  const s = schedule.data;
  const busy = save.isPending || togglePause.isPending || issueNow.isPending;

  return (
    <Dialog open={!!lease} onOpenChange={(next) => !next && onClose()}>
      {lease && (
        <DialogContent padded={false} className="sm:max-w-lg">
          <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3">
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-foreground">Rent schedule</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {lease.tenantName}: {lease.propertyName} • {lease.unitName}
              </DialogDescription>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {schedule.isLoading ? (
              <CardSkeleton lines={3} />
            ) : schedule.isError && !schedule.data ? (
              <Alert variant="danger">{(schedule.error as Error).message}</Alert>
            ) : (
              <>
                {s ? (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4 text-primary" />
                        {CYCLE_LABEL[s.cycle]} billing
                      </span>
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {s.status === 'ACTIVE'
                          ? 'Active'
                          : s.status === 'PAUSED'
                            ? 'Paused'
                            : 'Ended'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{STATUS_COPY[s.status]}</p>
                    {s.status !== 'ENDED' && (
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Next invoice</dt>
                          <dd className="font-medium text-foreground">
                            {formatCurrency(s.nextInvoiceTotal)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Due</dt>
                          <dd className="font-medium text-foreground">
                            {formatDate(s.nextDueDate)}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-xs text-muted-foreground">Raised on</dt>
                          <dd className="text-foreground">
                            {new Date(s.nextIssueDate) <= new Date()
                              ? 'Next hourly run (the window is open)'
                              : formatDate(s.nextIssueDate)}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground rounded-lg bg-secondary/50 p-3">
                    This lease has no rent schedule. Start one and GetRentos raises each
                    period&apos;s invoice for you, before it falls due, until the lease ends.
                  </p>
                )}

                {account.data &&
                  (account.data.creditBalance > 0 || account.data.receipts.length > 0) && (
                    <div className="rounded-lg border border-border p-3 text-sm space-y-1.5">
                      <p className="font-medium text-foreground">Payments received</p>
                      {account.data.creditBalance > 0 && (
                        <div className="text-xs text-success space-y-1.5">
                          <p>
                            Tenant credit {formatCurrency(account.data.creditBalance)}: it pays the
                            next invoice automatically.
                          </p>
                          {confirmRefund ? (
                            <div className="rounded-md bg-secondary/60 p-2 text-muted-foreground">
                              <p>
                                Anything the tenant owes is paid from the credit first; the rest
                                goes back to the card or account they paid with.
                              </p>
                              <div className="mt-1.5 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  isLoading={refundCredit.isPending}
                                  loadingText="Refunding…"
                                  onClick={() => refundCredit.mutate()}
                                >
                                  Yes, refund it
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmRefund(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setNotice(null);
                                setConfirmRefund(true);
                              }}
                            >
                              Refund credit to tenant
                            </Button>
                          )}
                        </div>
                      )}
                      <ul className="space-y-1">
                        {account.data.receipts.slice(0, 4).map((r) => (
                          <li key={r.id} className="flex justify-between gap-2 text-xs">
                            <span className="text-muted-foreground">
                              {formatDate(r.receivedAt)}
                              {r.toCredit > 0 ? ` · ${formatCurrency(r.toCredit)} to credit` : ''}
                            </span>
                            <span className="text-foreground tabular-nums">
                              {formatCurrency(r.amount)}
                            </span>
                          </li>
                        ))}
                        {(account.data.creditApplied ?? []).slice(0, 3).map((c) => (
                          <li
                            key={`${c.rentPaymentId}-${c.appliedAt}`}
                            className="flex justify-between gap-2 text-xs"
                          >
                            <span className="text-muted-foreground">
                              Credit used on rent due {formatDate(c.dueDate)}
                            </span>
                            <span className="text-success tabular-nums">
                              {formatCurrency(c.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <CreditRefundHistory refunds={account.data.refunds} />
                    </div>
                  )}

                {s?.status !== 'ENDED' && (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Rent per period">
                        <CurrencyInput
                          prefix="₦"
                          value={amount}
                          onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
                        />
                      </Field>
                      <Field label="Days before due" hint="Up to 90 days.">
                        <NumberInput
                          maxLength={2}
                          value={leadDays}
                          placeholder="Default"
                          // The API accepts up to 90 days of notice.
                          onValueChange={(v) => setLeadDays(v && Number(v) > 90 ? '90' : v)}
                        />
                      </Field>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          Billed with the rent
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-primary"
                          disabled={items.length >= 10}
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() =>
                            setItems([
                              ...items,
                              { category: 'SERVICE_CHARGE', label: 'Service charge', amount: 0 },
                            ])
                          }
                        >
                          Add extra
                        </Button>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Nothing extra. Add a service charge or levy to bill it on every invoice.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {items.map((item, idx) => (
                            <li
                              key={idx}
                              className="grid grid-cols-[8.75rem_minmax(0,1fr)_7.5rem_auto] items-center gap-2"
                            >
                              <Select
                                ariaLabel="Kind"
                                value={item.category}
                                searchable={false}
                                options={[
                                  { value: 'SERVICE_CHARGE', label: 'Service charge' },
                                  { value: 'LEVY', label: 'Levy' },
                                ]}
                                onValueChange={(value) =>
                                  setItems(
                                    items.map((it, i) =>
                                      i === idx
                                        ? {
                                            ...it,
                                            category: value as RentScheduleItem['category'],
                                          }
                                        : it
                                    )
                                  )
                                }
                              />
                              <Input
                                aria-label="Label"
                                value={item.label}
                                maxLength={80}
                                onChange={(e) =>
                                  setItems(
                                    items.map((it, i) =>
                                      i === idx ? { ...it, label: e.target.value } : it
                                    )
                                  )
                                }
                              />
                              <div className="min-w-0">
                                <CurrencyInput
                                  prefix="₦"
                                  value={item.amount ? String(item.amount) : ''}
                                  onValueChange={(v) =>
                                    setItems(
                                      items.map((it, i) => (i === idx ? { ...it, amount: v } : it))
                                    )
                                  }
                                />
                              </div>
                              <IconButton
                                label="Remove"
                                icon={<Trash2 />}
                                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}

                {notice && <Alert variant="success">{notice}</Alert>}
                {error && <Alert variant="danger">{error.message}</Alert>}
              </>
            )}
          </div>

          {!schedule.isLoading && !(schedule.isError && !s) && s?.status !== 'ENDED' && (
            <div className="p-4 border-t border-border flex flex-wrap gap-2">
              {s && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={busy && !togglePause.isPending}
                    isLoading={togglePause.isPending}
                    onClick={() => togglePause.mutate()}
                  >
                    {s.status === 'ACTIVE' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={(busy && !issueNow.isPending) || s.status !== 'ACTIVE'}
                    isLoading={issueNow.isPending}
                    onClick={() => issueNow.mutate()}
                  >
                    <ReceiptText className="w-3.5 h-3.5" /> Raise next invoice now
                  </Button>
                </>
              )}
              <Button
                variant="primary"
                size="sm"
                className="ml-auto"
                disabled={
                  (busy && !save.isPending) ||
                  !Number(amount) ||
                  items.some((i) => !i.label.trim() || !i.amount)
                }
                isLoading={save.isPending}
                onClick={() => {
                  setNotice(null);
                  save.mutate();
                }}
              >
                {s ? 'Save changes' : 'Start schedule'}
              </Button>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
};
