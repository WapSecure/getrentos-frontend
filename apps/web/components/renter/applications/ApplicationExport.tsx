'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, X, Check } from 'lucide-react';
import { Application } from '@/types/renter';
import { downloadCsv, printHtml, escapeHtml } from '@/lib/export';

interface ApplicationExportProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
}

export const ApplicationExport = ({ isOpen, onClose, applications }: ApplicationExportProps) => {
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [completed, setCompleted] = useState(false);

  const exportToCSV = () => {
    setExporting('csv');

    const headers = [
      'Property',
      'Address',
      'Status',
      'Applied Date',
      'Price',
      'Bedrooms',
      'Bathrooms',
      'Size',
    ];
    const rows = applications.map((a) => [
      a.title,
      a.address,
      a.status,
      a.applicationDate,
      a.price,
      a.bedrooms,
      a.bathrooms,
      a.size,
    ]);

    downloadCsv(`applications-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);

    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
      setExporting(null);
    }, 1000);
  };

  const exportToPDF = () => {
    setExporting('pdf');

    const rows = applications
      .map(
        (a) =>
          `<tr><td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.address)}</td><td>${escapeHtml(
            a.status
          )}</td><td>${escapeHtml(a.applicationDate)}</td><td>${a.price.toLocaleString()}</td><td>${
            a.bedrooms
          }</td><td>${a.bathrooms}</td><td>${a.size}</td></tr>`
      )
      .join('');

    printHtml(
      'Applications Export',
      `<h1>Applications Export</h1><p class="meta">Exported on ${new Date().toLocaleDateString()} · ${applications.length} application${applications.length === 1 ? '' : 's'}</p><table><thead><tr><th>Property</th><th>Address</th><th>Status</th><th>Applied</th><th>Price</th><th>Beds</th><th>Baths</th><th>Size</th></tr></thead><tbody>${rows || '<tr><td colspan="8">No applications</td></tr>'}</tbody></table>`
    );

    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
      setExporting(null);
    }, 1000);
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
                <h3 className="font-semibold text-foreground">Export Applications</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {applications.length} applications to export
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
                    <p className="text-xs text-gray-500">Download as spreadsheet</p>
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
                    <p className="text-xs text-gray-500">Download as document</p>
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
