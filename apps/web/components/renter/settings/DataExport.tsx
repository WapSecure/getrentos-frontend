'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileText, FileSpreadsheet, Check } from 'lucide-react';
import { Alert, Button, RadioGroup } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { downloadCsv, printHtml, escapeHtml } from '@/lib/export';

type ExportType = 'print' | 'csv';

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
  const [exportType, setExportType] = useState<ExportType>('print');
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    onError: (error: Error) =>
      setErrorMessage(error.message || 'Your data could not be exported. Please try again.'),
  });

  const handleExport = () => {
    setErrorMessage(null);
    exportMutation.mutate();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Data Export</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Export your personal data and activity history
      </p>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-border">
          <h3 className="font-medium text-foreground mb-2">Export Format</h3>
          <RadioGroup
            value={exportType}
            onValueChange={setExportType}
            variant="card"
            columns={2}
            options={[
              {
                value: 'print',
                label: 'Print or save as PDF',
                icon: <FileText className="w-5 h-5" />,
              },
              { value: 'csv', label: 'CSV', icon: <FileSpreadsheet className="w-5 h-5" /> },
            ]}
          />
        </div>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Alert variant="warning" title="What's included">
          <ul className="text-xs mt-1 space-y-0.5 list-disc list-inside">
            <li>Profile information</li>
            <li>Application history</li>
            <li>Payment history</li>
            <li>Maintenance requests</li>
            <li>Messages</li>
            <li>Lease agreements</li>
          </ul>
        </Alert>

        <Button
          variant="primary"
          fullWidth
          onClick={handleExport}
          isLoading={exportMutation.isPending}
          loadingText="Exporting..."
          icon={completed ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        >
          {completed ? 'Exported!' : 'Export Data'}
        </Button>
      </div>
    </div>
  );
};
