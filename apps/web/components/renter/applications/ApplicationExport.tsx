'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent padded={false}>
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Export Applications</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {applications.length} applications to export
          </DialogDescription>
        </div>

        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={exportToCSV}
            disabled={exporting !== null}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-subtle">
                <FileSpreadsheet className="w-5 h-5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Export as CSV</p>
                <p className="text-xs text-muted-foreground">Download as spreadsheet</p>
              </div>
            </div>
            {exporting === 'csv' ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : exporting === null && completed ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <Download className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          <button
            type="button"
            onClick={exportToPDF}
            disabled={exporting !== null}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive-subtle">
                <FileText className="w-5 h-5 text-destructive" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Export as PDF</p>
                <p className="text-xs text-muted-foreground">Download as document</p>
              </div>
            </div>
            {exporting === 'pdf' ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : exporting === null && completed ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <Download className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
