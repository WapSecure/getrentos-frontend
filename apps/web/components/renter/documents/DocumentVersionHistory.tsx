'use client';

import { useState } from 'react';
import { Clock, Download, FileText, Check, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Version {
  id: string;
  version: number;
  date: string;
  size: string;
  user: string;
  comment?: string;
  isCurrent: boolean;
}

interface DocumentVersionHistoryProps {
  versions: Version[];
  documentName: string;
  onRestore: (versionId: string) => void;
  onDownload: (versionId: string) => void;
}

export const DocumentVersionHistory = ({
  versions,
  documentName,
  onRestore,
  onDownload,
}: DocumentVersionHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDownload = (versionId: string) => {
    onDownload(versionId);
  };

  const handleRestore = (versionId: string) => {
    onRestore(versionId);
  };

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div
        onClick={handleToggleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#c4a747]" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">Version History</h3>
            <p className="text-xs text-gray-500">{versions.length} versions</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="divide-y divide-gray-200 dark:divide-white/10">
          {versions.map((version) => (
            <div
              key={version.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${version.isCurrent ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-white/10'}`}
                  >
                    <FileText
                      className={`w-4 h-4 ${version.isCurrent ? 'text-green-600' : 'text-gray-500'}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        v{version.version}
                      </span>
                      {version.isCurrent && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(version.date)} • {version.size} • by {version.user}
                    </p>
                    {version.comment && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                        &quot;{version.comment}&quot;
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(version.id)}
                    className="p-1.5 h-auto"
                    title="Download version"
                  >
                    <Download className="w-3 h-3 text-gray-500" />
                  </Button>
                  {!version.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(version.id)}
                      className="p-1.5 h-auto text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Restore this version"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
