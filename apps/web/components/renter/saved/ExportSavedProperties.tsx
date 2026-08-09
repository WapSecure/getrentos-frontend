'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, X, Check } from 'lucide-react';
import { Property } from '@/types/renter';

interface ExportSavedPropertiesProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
}

export const ExportSavedProperties = ({
  isOpen,
  onClose,
  properties,
}: ExportSavedPropertiesProps) => {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [completed, setCompleted] = useState(false);

  const formatPrice = (price: number, period: string) => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(price)}${period === 'month' ? '/mo' : period === 'year' ? '/yr' : '/wk'}`;
  };

  const exportToCSV = async () => {
    setExporting('csv');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const headers = [
      'Title',
      'Location',
      'Price',
      'Bedrooms',
      'Bathrooms',
      'Size',
      'Rating',
      'Verified',
    ];
    const rows = properties.map((p) => [
      p.title,
      p.location,
      formatPrice(p.price, p.period),
      p.bedrooms,
      p.bathrooms,
      p.size,
      p.rating,
      p.verified ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-properties-${new Date().toISOString().split('T')[0]}.csv`;
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
                <h3 className="font-semibold text-foreground">Export Saved Properties</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {properties.length} properties to export
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button
                onClick={exportToCSV}
                disabled={exporting !== null}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Export as CSV</p>
                    <p className="text-xs text-gray-500">Download as spreadsheet for analysis</p>
                  </div>
                </div>
                {exporting === 'csv' ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : exporting === null && completed ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Download className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <button
                onClick={exportToPDF}
                disabled={exporting !== null}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Export as PDF</p>
                    <p className="text-xs text-gray-500">Download as printable document</p>
                  </div>
                </div>
                {exporting === 'pdf' ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : exporting === null && completed ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Download className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
