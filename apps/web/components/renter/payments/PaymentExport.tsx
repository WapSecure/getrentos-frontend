'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Check } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  RadioGroup,
  Select,
} from '@getrentos/ui';
import { downloadCsv, printHtml, escapeHtml } from '@/lib/export';

interface Payment {
  id: string;
  propertyName: string;
  amount: number;
  date: string;
  status: string;
  method: string;
}

interface PaymentExportProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
}

export const PaymentExport = ({ isOpen, onClose, payments }: PaymentExportProps) => {
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [completed, setCompleted] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'last3' | 'last6' | 'last12'>('all');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  const exportToCSV = () => {
    setExporting('csv');

    const filteredPayments = getFilteredPayments();
    const headers = ['Property', 'Amount', 'Date', 'Status', 'Method'];
    const rows = filteredPayments.map((p) => [
      p.propertyName,
      formatCurrency(p.amount),
      new Date(p.date).toLocaleDateString(),
      p.status,
      p.method,
    ]);

    downloadCsv(`payments-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);

    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
      setExporting(null);
    }, 1000);
  };

  const exportToPDF = () => {
    setExporting('pdf');

    const filteredPayments = getFilteredPayments();
    const rows = filteredPayments
      .map(
        (p) =>
          `<tr><td>${escapeHtml(p.propertyName)}</td><td>${escapeHtml(
            formatCurrency(p.amount)
          )}</td><td>${escapeHtml(new Date(p.date).toLocaleDateString())}</td><td>${escapeHtml(
            p.status
          )}</td><td>${escapeHtml(p.method)}</td></tr>`
      )
      .join('');

    printHtml(
      'Payments Export',
      `<h1>Payments Export</h1><p class="meta">Exported on ${new Date().toLocaleDateString()} · ${filteredPayments.length} payment${filteredPayments.length === 1 ? '' : 's'} · Total ${escapeHtml(
        formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))
      )}</p><table><thead><tr><th>Property</th><th>Amount</th><th>Date</th><th>Status</th><th>Method</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No payments</td></tr>'}</tbody></table>`
    );

    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
      setExporting(null);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Export Payments</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {payments.length} payments available to export
          </DialogDescription>
        </div>

        <div className="p-4 space-y-4">
          <Field label="Date Range">
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as 'all' | 'last3' | 'last6' | 'last12')}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'last3', label: 'Last 3 Months' },
                { value: 'last6', label: 'Last 6 Months' },
                { value: 'last12', label: 'Last 12 Months' },
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

          {/* Payment Summary */}
          <div className="p-3 rounded-lg bg-secondary">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Payments</span>
              <span className="font-medium text-foreground">{getFilteredPayments().length}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-medium text-primary">
                {formatCurrency(getFilteredPayments().reduce((sum, p) => sum + p.amount, 0))}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={format === 'pdf' ? exportToPDF : exportToCSV}
            disabled={exporting !== null}
            isLoading={exporting !== null && !completed}
            loadingText="Exporting..."
            icon={completed ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          >
            {completed ? 'Exported!' : 'Export Payments'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
