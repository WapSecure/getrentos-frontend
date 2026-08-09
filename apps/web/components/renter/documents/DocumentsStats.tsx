'use client';

import { FileText, FileCheck, Clock, AlertCircle, Database, Star, Share2 } from 'lucide-react';

interface Document {
  id: string;
  type: string;
  status: 'active' | 'expiring' | 'expired';
  isFavorite: boolean;
  sharedWith?: string[];
}

interface DocumentsStatsProps {
  documents: Document[];
}

export const DocumentsStats = ({ documents }: DocumentsStatsProps) => {
  const total = documents.length;
  const active = documents.filter((d) => d.status === 'active').length;
  const expiring = documents.filter((d) => d.status === 'expiring').length;
  const expired = documents.filter((d) => d.status === 'expired').length;
  const favorites = documents.filter((d) => d.isFavorite).length;
  const shared = documents.filter((d) => d.sharedWith && d.sharedWith.length > 0).length;

  const totalSize = '12.8 MB';
  const usedSpace = '4.2 MB';
  const freeSpace = '8.6 MB';

  const stats = [
    {
      icon: FileText,
      label: 'Total Documents',
      value: total,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: FileCheck,
      label: 'Active',
      value: active,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Clock,
      label: 'Expiring Soon',
      value: expiring,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: AlertCircle,
      label: 'Expired',
      value: expired,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: Star,
      label: 'Favorites',
      value: favorites,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      icon: Share2,
      label: 'Shared',
      value: shared,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: Database,
      label: 'Storage',
      value: `${usedSpace} / ${totalSize}`,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
      {stats.map((stat, index) => (
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
