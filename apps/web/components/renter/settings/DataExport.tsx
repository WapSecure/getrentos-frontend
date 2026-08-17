'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileText, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { downloadCsv, printHtml, escapeHtml } from '@/lib/export';

type ExportType = 'pdf' | 'csv';

const buildSectionsHtml = (data: Record<string, unknown>): string =>
  Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const rows = value
          .map(
            (item, index) =>
              `<tr><td>${index + 1}</td><td><pre>${escapeHtml(
                JSON.stringify(item, null, 2)
              )}</pre></td></tr>`
          )
          .join('');
        return `<h2>${escapeHtml(key)}</h2>${value.length ? `<table><thead><tr><th>#</th><th>Record</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>None</p>'}`;
      }
      return `<h2>${escapeHtml(key)}</h2><p><pre>${escapeHtml(
        JSON.stringify(value, null, 2)
      )}</pre></p>`;
    })
    .join('');

export const DataExport = () => {
  const [exportType, setExportType] = useState<ExportType>('pdf');
  const [completed, setCompleted] = useState(false);

  const exportMutation = useMutation({
    mutationFn: () => unwrap(renterService.exportData()),
    onSuccess: (data) => {
      const date = new Date().toISOString().slice(0, 10);
      if (exportType === 'csv') {
        const rows: unknown[][] = [];
        for (const [section, value] of Object.entries(data ?? {})) {
          if (Array.isArray(value)) {
            value.forEach((item) => rows.push([section, JSON.stringify(item)]));
          } else if (value && typeof value === 'object') {
            rows.push([section, JSON.stringify(value)]);
          } else {
            rows.push([section, String(value)]);
          }
        }
        downloadCsv(`getrentos-data-export-${date}.csv`, ['Section', 'Data'], rows);
      } else {
        printHtml(
          'GetRentos Data Export',
          `<h1>GetRentos Data Export</h1><p class="meta">Exported on ${new Date().toLocaleDateString()}</p>${buildSectionsHtml(data ?? {})}`
        );
      }
      setCompleted(true);
      setTimeout(() => setCompleted(false), 3000);
    },
  });

  const handleExport = () => exportMutation.mutate();

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Data Export</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Export your personal data and activity history
      </p>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-border">
          <h3 className="font-medium text-foreground mb-2">Export Format</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setExportType('pdf')}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                exportType === 'pdf'
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-xs text-muted-foreground">PDF</p>
            </button>
            <button
              onClick={() => setExportType('csv')}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                exportType === 'csv'
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-xs text-muted-foreground">CSV</p>
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                What&apos;s included
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-1 space-y-0.5 list-disc list-inside">
                <li>Profile information</li>
                <li>Application history</li>
                <li>Payment history</li>
                <li>Maintenance requests</li>
                <li>Messages</li>
                <li>Lease agreements</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleExport}
          disabled={exportMutation.isPending}
          isLoading={exportMutation.isPending}
          className="gap-2"
        >
          {completed ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {completed ? 'Exported!' : exportMutation.isPending ? 'Exporting...' : 'Export Data'}
        </Button>
      </div>
    </div>
  );
};
