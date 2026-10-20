'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { Property } from '@/types/renter';
import { downloadCsv, escapeHtml, printHtml } from '@/lib/export';

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
  const [exporting, setExporting] = useState<'csv' | 'print' | null>(null);

  const formatPrice = (price: number, period: string) => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(price)}${period === 'month' ? '/mo' : period === 'year' ? '/yr' : '/wk'}`;
  };

  const finishExport = () => {
    setExporting(null);
    onClose();
  };

  const exportToCSV = () => {
    setExporting('csv');

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

    downloadCsv(`saved-properties-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    finishExport();
  };

  const openPrintView = () => {
    setExporting('print');
    const rows = properties
      .map(
        (property) =>
          `<tr><td>${escapeHtml(property.title)}</td><td>${escapeHtml(property.location)}</td><td>${escapeHtml(formatPrice(property.price, property.period))}</td><td>${property.bedrooms}</td><td>${property.bathrooms}</td><td>${property.size}</td><td>${property.verified ? 'Yes' : 'No'}</td></tr>`
      )
      .join('');
    printHtml(
      'Saved Properties',
      `<h1>Saved Properties</h1><p class="meta">Exported on ${new Date().toLocaleDateString()} · ${properties.length} propert${properties.length === 1 ? 'y' : 'ies'}</p><table><thead><tr><th>Property</th><th>Location</th><th>Price</th><th>Beds</th><th>Baths</th><th>Size</th><th>Verified</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No saved properties</td></tr>'}</tbody></table>`
    );
    finishExport();
  };

  const option = (
    kind: 'csv' | 'print',
    onClick: () => void,
    icon: React.ReactNode,
    title: string,
    description: string
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={exporting !== null}
      aria-busy={exporting === kind}
      className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0 text-left">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Download className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle className="pr-8 font-semibold text-foreground">
          Export Saved Properties
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          {properties.length} properties on this page to export
        </DialogDescription>

        <div className="mt-4 space-y-3">
          {option(
            'csv',
            exportToCSV,
            <div className="p-2 rounded-lg bg-success-subtle">
              <FileSpreadsheet className="w-5 h-5 text-success" aria-hidden="true" />
            </div>,
            'Export as CSV',
            'Download as spreadsheet for analysis'
          )}
          {option(
            'print',
            openPrintView,
            <div className="p-2 rounded-lg bg-destructive-subtle">
              <FileText className="w-5 h-5 text-destructive" aria-hidden="true" />
            </div>,
            'Print or save as PDF',
            'Open the browser print dialog'
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
