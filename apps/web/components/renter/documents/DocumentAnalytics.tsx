'use client';

import { BarChart3, TrendingUp, FileText, Database, PieChart } from 'lucide-react';

interface Document {
  id: string;
  type: string;
  category: string;
  size: string;
  uploadedAt: string;
  status: string;
}

interface DocumentAnalyticsProps {
  documents: Document[];
}

export const DocumentAnalytics = ({ documents }: DocumentAnalyticsProps) => {
  const totalSize = '12.8 MB';
  const usedSpace = '4.2 MB';
  const freeSpace = '8.6 MB';

  const typeDistribution = documents.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1;
    return acc;
  }, {});

  const getMostUsedType = (): string => {
    const entries = Object.entries(typeDistribution);
    if (entries.length === 0) return 'No documents';
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  const averageSize =
    documents.length > 0 ? (parseFloat(usedSpace) / documents.length).toFixed(1) + ' MB' : '0 MB';

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Document Analytics</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Storage & usage insights</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3 text-primary" />
              <span className="text-xs text-gray-500">Used Space</span>
            </div>
            <p className="text-sm font-bold text-foreground">{usedSpace}</p>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '33%' }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{freeSpace} free</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-primary" />
              <span className="text-xs text-gray-500">Documents</span>
            </div>
            <p className="text-sm font-bold text-foreground">{documents.length}</p>
            <p className="text-xs text-gray-500">Avg size: {averageSize}</p>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-1">
            <PieChart className="w-3 h-3 text-primary" />
            <span className="text-xs text-gray-500">Type Distribution</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(typeDistribution).map(([type, count]) => (
              <span
                key={type}
                className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                Most Common Type
              </p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                {getMostUsedType()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
