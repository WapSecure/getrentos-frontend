'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Check } from '@sureground/icons';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  RadioGroup,
  Select,
} from '@sureground/ui';
import { downloadCsv, printHtml, escapeHtml } from '@/lib/export';
import { formatCurrency, formatLagosDate } from '@/lib/format';
import { paymentStatusBadges } from '@/lib/statusBadge';

interface Payment {
  id: string;
  propertyName: string;
  description?: string;
  amount: number;
  date: string;
  dueDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
}

interface PaymentExportProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
  isLoading?: boolean;
  /** Set when the full history could not be loaded, so nothing partial is exported. */
  error?: string | null;
}

const statusLabel = (status: Payment['status']) => paymentStatusBadges[status]?.label ?? status;
const rowDate = (p: Payment) =>
  formatLagosDate(p.status === 'paid' ? p.date : (p.dueDate ?? p.date));

export const PaymentExport = ({
  isOpen,
  onClose,
  payments,
  isLoading = false,
  error = null,
}: PaymentExportProps) => {
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [completed, setCompleted] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'last3' | 'last6' | 'last12'>('all');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');

  const getFilteredPayments = () => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (dateRange) {
      case 'last3':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'last6':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case 'last12':
        cutoffDate.setMonth(now.getMonth() - 12);
        break;
      default:
        return payments;
    }

    return payments.filter((p) => new Date(p.date) >= cutoffDate);
  };

  const filtered = getFilteredPayments();
  const paidTotal = filtered
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const finish = () => {
    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
      setExporting(null);
    }, 1000);
  };

  const exportToCSV = () => {
    setExporting('csv');
    const headers = ['Property', 'Charge', 'Amount', 'Date', 'Status'];
    const rows = filtered.map((p) => [
      p.propertyName,
      p.description ?? '',
      formatCurrency(p.amount),
      rowDate(p),
      statusLabel(p.status),
    ]);
    downloadCsv(`payments-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    finish();
  };

  const exportToPDF = () => {
    setExporting('pdf');
    const rows = filtered
      .map(
        (p) =>
          `<tr><td>${escapeHtml(p.propertyName)}</td><td>${escapeHtml(p.description ?? '')}</td><td>${escapeHtml(
            formatCurrency(p.amount)
          )}</td><td>${escapeHtml(rowDate(p))}</td><td>${escapeHtml(statusLabel(p.status))}</td></tr>`
      )
      .join('');

    printHtml(
      'Payments export',
      `<h1>Payments export</h1><p class="meta">Exported on ${escapeHtml(
        formatLagosDate(new Date().toISOString())
      )} · ${filtered.length} payment${filtered.length === 1 ? '' : 's'} · Paid ${escapeHtml(
        formatCurrency(paidTotal)
      )}</p><table><thead><tr><th>Property</th><th>Charge</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No payments</td></tr>'}</tbody></table>`
    );
    finish();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Export payments</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {isLoading
              ? 'Loading your full payment history…'
              : `${payments.length} payments in your history`}
          </DialogDescription>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <Alert variant="danger" title="Your history did not load">
              {error}
            </Alert>
          )}
          <Field label="Date range">
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as 'all' | 'last3' | 'last6' | 'last12')}
              options={[
                { value: 'all', label: 'All time' },
                { value: 'last3', label: 'Last 3 months' },
                { value: 'last6', label: 'Last 6 months' },
                { value: 'last12', label: 'Last 12 months' },
              ]}
            />
          </Field>

          <Field label="Format">
            <RadioGroup
              variant="card"
              columns={2}
              value={format}
              onValueChange={setFormat}
              options={[
                {
                  value: 'pdf',
                  label: 'PDF',
                  icon: <FileText className="w-5 h-5 text-muted-foreground" />,
                },
                {
                  value: 'csv',
                  label: 'CSV',
                  icon: <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />,
                },
              ]}
            />
          </Field>

          <div className="p-3 rounded-lg bg-secondary">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payments</span>
              <span className="font-medium text-foreground">{filtered.length}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Paid in this range</span>
              <span className="font-medium text-primary">{formatCurrency(paidTotal)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={format === 'pdf' ? exportToPDF : exportToCSV}
            disabled={exporting !== null || isLoading || Boolean(error)}
            isLoading={(exporting !== null && !completed) || isLoading}
            loadingText={isLoading ? 'Loading…' : 'Exporting...'}
            icon={completed ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          >
            {completed ? 'Exported!' : 'Export payments'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
