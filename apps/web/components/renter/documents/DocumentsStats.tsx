'use client';

import { FileText, FileCheck, Clock, AlertCircle, Database, Star, Share2 } from 'lucide-react';

interface DocumentsStatsProps {
  summary?: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
    favorites: number;
    shared: number;
    storageUsedBytes: number;
  };
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentsStats = ({ summary }: DocumentsStatsProps) => {
  if (!summary) return null;

  const stats = [
    {
      icon: FileText,
      label: 'Total Documents',
      value: summary.total,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: FileCheck,
      label: 'Active',
      value: summary.active,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Clock,
      label: 'Expiring Soon',
      value: summary.expiring,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: AlertCircle,
      label: 'Expired',
      value: summary.expired,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: Star,
      label: 'Favorites',
      value: summary.favorites,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      icon: Share2,
      label: 'Shared',
      value: summary.shared,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: Database,
      label: 'Storage Used',
      value: formatBytes(summary.storageUsedBytes),
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className={`${stat.bg} rounded-xl p-3 border border-border`}>
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
          </div>
          <p className={`text-base font-bold ${stat.color} mt-1`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
