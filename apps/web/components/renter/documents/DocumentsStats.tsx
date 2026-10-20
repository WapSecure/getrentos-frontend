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
      color: 'text-info',
      bg: 'bg-info-subtle',
    },
    {
      icon: FileCheck,
      label: 'Active',
      value: summary.active,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      icon: Clock,
      label: 'Expiring Soon',
      value: summary.expiring,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
    },
    {
      icon: AlertCircle,
      label: 'Expired',
      value: summary.expired,
      color: 'text-destructive',
      bg: 'bg-destructive-subtle',
    },
    {
      icon: Star,
      label: 'Favorites',
      value: summary.favorites,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
    },
    {
      icon: Share2,
      label: 'Shared',
      value: summary.shared,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Database,
      label: 'Storage Used',
      value: formatBytes(summary.storageUsedBytes),
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <section
      aria-label="Document overview"
      className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className={`rounded-lg p-2 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} aria-hidden="true" />
            </span>
            <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
          </div>
          <p className="mt-3 text-xl font-bold tracking-tight text-foreground">{stat.value}</p>
        </div>
      ))}
    </section>
  );
};
