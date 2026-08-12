'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { renterService } from '@/services/renterService';

export const DataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [completed, setCompleted] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const res = await renterService.exportData();
    if (res.success && res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `getrentos-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
    setCompleted(true);
    setTimeout(() => setCompleted(false), 3000);
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
          disabled={isExporting}
          isLoading={isExporting}
          className="gap-2"
        >
          {completed ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {completed ? 'Exported!' : isExporting ? 'Exporting...' : 'Export Data'}
        </Button>
      </div>
    </div>
  );
};
