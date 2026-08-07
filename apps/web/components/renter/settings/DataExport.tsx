'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const DataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [completed, setCompleted] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setCompleted(true);
      setTimeout(() => setCompleted(false), 3000);
    }, 2000);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Export</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Export your personal data and activity history
      </p>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Export Format</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setExportType('pdf')}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                exportType === 'pdf'
                  ? 'border-[#c4a747] bg-[#c4a747]/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-xs text-gray-600 dark:text-gray-400">PDF</p>
            </button>
            <button
              onClick={() => setExportType('csv')}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                exportType === 'csv'
                  ? 'border-[#c4a747] bg-[#c4a747]/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-xs text-gray-600 dark:text-gray-400">CSV</p>
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
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
