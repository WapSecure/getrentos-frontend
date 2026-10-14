'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Pause, Play, Plus, Receipt, Trash2, X } from 'lucide-react';
import { Button, CurrencyInput, Input } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { landlordService } from '@/services/landlordService';
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

  const error = [save.error, togglePause.error, issueNow.error].find(Boolean) as Error | undefined;
  const s = schedule.data;
  const busy = save.isPending || togglePause.isPending || issueNow.isPending;

  return (
    <AnimatePresence>
      {lease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Rent schedule</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lease.tenantName}: {lease.propertyName} • {lease.unitName}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {schedule.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : schedule.isError ? (
                <p className="text-sm text-destructive">{(schedule.error as Error).message}</p>
              ) : (
                <>
                  {s ? (
                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <CalendarClock className="w-4 h-4 text-primary" />
                          {CYCLE_LABEL[s.cycle]} billing
                        </span>
                        <span
                          className={`text-xs rounded-full px-2 py-0.5 ${
                            s.status === 'ACTIVE'
                              ? 'bg-success-subtle text-success'
                              : 'bg-warning-subtle text-warning'
                          }`}
                        >
                          {s.status === 'ACTIVE'
                            ? 'Active'
                            : s.status === 'PAUSED'
                              ? 'Paused'
                              : 'Ended'}
                        </span>
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

                  {s?.status !== 'ENDED' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Rent per period (₦)
                          </label>
                          <CurrencyInput
                            prefix="₦"
                            value={amount}
                            onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Days before due
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={90}
                            value={leadDays}
                            placeholder="Default"
                            onChange={(e) => setLeadDays(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            Billed with the rent
                          </span>
                          <button
                            type="button"
                            disabled={items.length >= 10}
                            onClick={() =>
                              setItems([
                                ...items,
                                { category: 'SERVICE_CHARGE', label: 'Service charge', amount: 0 },
                              ])
                            }
                            className="text-xs text-primary flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add extra
                          </button>
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
                                <select
                                  aria-label="Kind"
                                  value={item.category}
                                  onChange={(e) =>
                                    setItems(
                                      items.map((it, i) =>
                                        i === idx
                                          ? {
                                              ...it,
                                              category: e.target
                                                .value as RentScheduleItem['category'],
                                            }
                                          : it
                                      )
                                    )
                                  }
                                  className="h-10 w-full min-w-0 rounded-lg border border-border bg-background pl-2 pr-6 text-sm cursor-pointer"
                                >
                                  <option value="SERVICE_CHARGE">Service charge</option>
                                  <option value="LEVY">Levy</option>
                                </select>
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
                                        items.map((it, i) =>
                                          i === idx ? { ...it, amount: v } : it
                                        )
                                      )
                                    }
                                  />
                                </div>
                                <button
                                  type="button"
                                  aria-label="Remove"
                                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                  className="p-2 rounded-lg hover:bg-secondary cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}

                  {notice && <p className="text-xs text-success">{notice}</p>}
                  {error && (
                    <p role="alert" className="text-xs text-destructive">
                      {error.message}
                    </p>
                  )}
                </>
              )}
            </div>

            {!schedule.isLoading && !schedule.isError && s?.status !== 'ENDED' && (
              <div className="p-4 border-t border-border flex flex-wrap gap-2">
                {s && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={busy}
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
                      disabled={busy || s.status !== 'ACTIVE'}
                      onClick={() => issueNow.mutate()}
                    >
                      <Receipt className="w-3.5 h-3.5" /> Raise next invoice now
                    </Button>
                  </>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  className="ml-auto"
                  disabled={
                    busy || !Number(amount) || items.some((i) => !i.label.trim() || !i.amount)
                  }
                  onClick={() => {
                    setNotice(null);
                    save.mutate();
                  }}
                >
                  {s ? 'Save changes' : 'Start schedule'}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
