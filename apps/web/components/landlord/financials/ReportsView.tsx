'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, ClipboardList, AlertTriangle, FileBarChart } from 'lucide-react';
import { Button, DatePicker, PageLoadingState, Toast, type ToastVariant } from '@getrentos/ui';
import { reportService } from '@/services/reportService';
import { unwrap } from '@/lib/apiHelpers';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const PERIOD_LABELS: Record<string, string> = { MONTHLY: '/mo', ANNUAL: '/yr', QUARTERLY: '/qtr' };

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

export function ReportsView() {
  const [from, setFrom] = useState(monthsAgo(12));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: rentRoll, isLoading: loadingRoll } = useQuery({
    queryKey: ['landlord', 'reports', 'rent-roll'],
    queryFn: () => unwrap(reportService.rentRoll()),
  });

  const { data: pnl, isLoading: loadingPnl } = useQuery({
    queryKey: ['landlord', 'reports', 'pnl', from, to],
    queryFn: () => unwrap(reportService.pnl({ from, to })),
  });

  const download = useMutation({
    mutationFn: (fn: () => Promise<{ success: boolean; message?: string }>) => fn(),
    onSuccess: (res) => {
      if (!res.success) setToast({ message: res.message || 'Download failed.', variant: 'error' });
    },
    onError: (e: Error) => setToast({ message: e.message || 'Download failed.', variant: 'error' }),
  });
  const runDownload = (fn: () => Promise<{ success: boolean; message?: string }>) =>
    download.mutate(fn);

  return (
    <div className="space-y-8">
      {/* Rent roll */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Rent roll</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => runDownload(reportService.downloadRentRollCsv)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        {loadingRoll ? (
          <PageLoadingState />
        ) : (rentRoll ?? []).length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No units yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Property</th>
                  <th className="p-3 font-medium">Unit</th>
                  <th className="p-3 font-medium">Tenant</th>
                  <th className="p-3 font-medium">Rent</th>
                  <th className="p-3 font-medium">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {(rentRoll ?? []).map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="p-3 text-foreground">{r.propertyTitle}</td>
                    <td className="p-3 text-muted-foreground">{r.unitName}</td>
                    <td className="p-3 text-muted-foreground">
                      {r.occupied ? (
                        r.tenantName || 'Tenant'
                      ) : (
                        <span className="italic">Vacant</span>
                      )}
                    </td>
                    <td className="p-3 text-foreground">
                      {r.rentAmount != null
                        ? `${formatNaira(r.rentAmount)}${PERIOD_LABELS[r.rentPeriod ?? ''] ?? ''}`
                        : '—'}
                    </td>
                    <td className="p-3">
                      {r.outstanding > 0 ? (
                        <span className="font-medium text-warning">
                          {formatNaira(r.outstanding)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Income & expenses (P&L) */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Income &amp; expenses</h2>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-36">
              <label className="text-xs text-muted-foreground">From</label>
              <DatePicker value={from} onChange={setFrom} max={to} />
            </div>
            <div className="w-36">
              <label className="text-xs text-muted-foreground">To</label>
              <DatePicker value={to} onChange={setTo} min={from} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => runDownload(() => reportService.downloadPnlCsv({ from, to }))}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        {loadingPnl ? (
          <PageLoadingState />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Property</th>
                  <th className="p-3 text-right font-medium">Income</th>
                  <th className="p-3 text-right font-medium">Expenses</th>
                  <th className="p-3 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {(pnl?.rows ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      No income or expenses in this period.
                    </td>
                  </tr>
                ) : (
                  (pnl?.rows ?? []).map((r) => (
                    <tr key={r.propertyId} className="border-b border-border/50">
                      <td className="p-3 text-foreground">{r.propertyTitle}</td>
                      <td className="p-3 text-right text-foreground">{formatNaira(r.income)}</td>
                      <td className="p-3 text-right text-foreground">{formatNaira(r.expenses)}</td>
                      <td
                        className={`p-3 text-right font-medium ${r.net >= 0 ? 'text-success' : 'text-destructive'}`}
                      >
                        {formatNaira(r.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {pnl && pnl.rows.length > 0 && (
                <tfoot>
                  <tr className="border-t border-border font-semibold">
                    <td className="p-3 text-foreground">Total</td>
                    <td className="p-3 text-right text-foreground">
                      {formatNaira(pnl.totals.income)}
                    </td>
                    <td className="p-3 text-right text-foreground">
                      {formatNaira(pnl.totals.expenses)}
                    </td>
                    <td className="p-3 text-right text-foreground">
                      {formatNaira(pnl.totals.net)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>

      {/* Other exports */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">More exports</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => runDownload(reportService.downloadArrearsCsv)}
          >
            <AlertTriangle className="h-4 w-4" />
            Arrears (CSV)
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => runDownload(reportService.downloadStatementsCsv)}
          >
            <FileBarChart className="h-4 w-4" />
            Statement history (CSV)
          </Button>
        </div>
      </section>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
