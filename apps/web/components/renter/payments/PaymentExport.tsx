'use client';

import { LegacySelect } from '@/components/ui/LegacySelect';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, X, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

  const exportToCSV = async () => {
    setExporting('csv');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const filteredPayments = getFilteredPayments();
    const headers = ['Property', 'Amount', 'Date', 'Status', 'Method'];
    const rows = filteredPayments.map((p) => [
      p.propertyName,
      formatCurrency(p.amount),
      new Date(p.date).toLocaleDateString(),
      p.status,
      p.method,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
      setExporting(null);
    }, 1500);
  };

  const exportToPDF = async () => {
    setExporting('pdf');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
      setExporting(null);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Export Payments</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {payments.length} payments available to export
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Date Range</label>
                <LegacySelect
                  value={dateRange}
                  onChange={(e) =>
                    setDateRange(e.target.value as 'all' | 'last3' | 'last6' | 'last12')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Time</option>
                  <option value="last3">Last 3 Months</option>
                  <option value="last6">Last 6 Months</option>
                  <option value="last12">Last 12 Months</option>
                </LegacySelect>
              </div>

              {/* Export Options */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat('pdf')}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      format === 'pdf'
                        ? 'border-primary bg-accent'
                        : 'border-border hover:border-gray-300'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium">PDF</span>
                  </button>
                  <button
                    onClick={() => setFormat('csv')}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      format === 'csv'
                        ? 'border-primary bg-accent'
                        : 'border-border hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium">CSV</span>
                  </button>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Payments</span>
                  <span className="font-medium text-foreground">
                    {getFilteredPayments().length}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Total Amount</span>
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
                className="gap-2"
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : completed ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? 'Exporting...' : completed ? 'Exported!' : 'Export Payments'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
