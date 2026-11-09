'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation } from '@tanstack/react-query';
import { Download, ClipboardList, AlertTriangle, FileBarChart } from 'lucide-react';
import {
  Button,
  DataTable,
  DatePicker,
  EmptyState,
  Field,
  TableSkeleton,
  useToast,
} from '@sureground/ui';
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
  const toast = useToast();

  const { data: rentRoll, isLoading: loadingRoll } = useQuery({
    queryKey: ['landlord', 'reports', 'rent-roll'],
    queryFn: () => unwrap(reportService.rentRoll()),
  });

  const { data: pnl, isLoading: loadingPnl } = useQuery({
    queryKey: ['landlord', 'reports', 'pnl', from, to],
    queryFn: () => unwrap(reportService.pnl({ from, to })),
    placeholderData: keepPreviousData,
  });

  const download = useMutation({
    mutationFn: (fn: () => Promise<{ success: boolean; message?: string }>) => fn(),
    onSuccess: (res) => {
      if (!res.success) toast.error(res.message || 'Download failed.');
    },
    onError: (e: Error) => toast.error(e.message || 'Download failed.'),
  });
  const runDownload = (fn: () => Promise<{ success: boolean; message?: string }>) =>
    download.mutate(fn);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
          <TableSkeleton rows={4} columns={5} />
        ) : (rentRoll ?? []).length === 0 ? (
          <EmptyState icon={ClipboardList} title="No units yet." size="compact" />
        ) : (
          <DataTable
            caption="Rent roll"
            data={rentRoll ?? []}
            getRowKey={(_r, index) => String(index)}
            columns={[
              {
                key: 'property',
                header: 'Property',
                className: 'text-foreground',
                render: (r) => r.propertyTitle,
              },
              {
                key: 'unit',
                header: 'Unit',
                className: 'text-muted-foreground',
                render: (r) => r.unitName,
              },
              {
                key: 'tenant',
                header: 'Tenant',
                className: 'text-muted-foreground',
                render: (r) =>
                  r.occupied ? r.tenantName || 'Tenant' : <span className="italic">Vacant</span>,
              },
              {
                key: 'rent',
                header: 'Rent',
                className: 'text-foreground',
                render: (r) =>
                  r.rentAmount != null
                    ? `${formatNaira(r.rentAmount)}${PERIOD_LABELS[r.rentPeriod ?? ''] ?? ''}`
                    : '—',
              },
              {
                key: 'outstanding',
                header: 'Outstanding',
                render: (r) =>
                  r.outstanding > 0 ? (
                    <span className="font-medium text-warning">{formatNaira(r.outstanding)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  ),
              },
            ]}
          />
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Income &amp; expenses</h2>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="From" className="w-36">
              <DatePicker value={from} onChange={setFrom} max={to} />
            </Field>
            <Field label="To" className="w-36">
              <DatePicker value={to} onChange={setTo} min={from} />
            </Field>
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
          <TableSkeleton rows={4} columns={4} />
        ) : (
          <DataTable
            caption="Income and expenses by property"
            data={pnl?.rows ?? []}
            getRowKey={(r) => r.propertyId}
            emptyState={
              <EmptyState
                icon={FileBarChart}
                title="No income or expenses in this period."
                size="compact"
              />
            }
            totals={
              pnl
                ? {
                    property: 'Total',
                    income: formatNaira(pnl.totals.income),
                    expenses: formatNaira(pnl.totals.expenses),
                    net: formatNaira(pnl.totals.net),
                  }
                : undefined
            }
            columns={[
              {
                key: 'property',
                header: 'Property',
                className: 'text-foreground',
                render: (r) => r.propertyTitle,
              },
              {
                key: 'income',
                header: 'Income',
                numeric: true,
                className: 'text-foreground',
                render: (r) => formatNaira(r.income),
              },
              {
                key: 'expenses',
                header: 'Expenses',
                numeric: true,
                className: 'text-foreground',
                render: (r) => formatNaira(r.expenses),
              },
              {
                key: 'net',
                header: 'Net',
                numeric: true,
                render: (r) => (
                  <span
                    className={`font-medium ${r.net >= 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {formatNaira(r.net)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </section>

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
    </div>
  );
}
