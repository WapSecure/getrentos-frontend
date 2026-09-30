'use client';

import { motion } from 'framer-motion';
import { Download, Mail, CalendarDays, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@getrentos/ui';
import { useState } from 'react';
import { renterService } from '@/services/renterService';
import type { RenewalOffer } from '@/types/lease';

interface Lease {
  id: string;
  propertyName: string;
  address: string;
  status: 'active' | 'expiring' | 'expired';
  startDate: string;
  endDate: string;
}

interface LeaseHeaderProps {
  lease: Lease;
  renewalOffer?: RenewalOffer | null;
}

export const LeaseHeader = ({ lease, renewalOffer }: LeaseHeaderProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const result = await renterService.downloadLeasePdf();
      if (!result.success) setDownloadError(result.message ?? 'The lease could not be downloaded.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusConfig = () => {
    switch (lease.status) {
      case 'active':
        return {
          label: 'Active',
          variant: 'success' as BadgeVariant,
          icon: CheckCircle,
        };
      case 'expiring':
        return {
          label: 'Expiring Soon',
          variant: 'warning' as BadgeVariant,
          icon: AlertCircle,
        };
      case 'expired':
        return {
          label: 'Expired',
          variant: 'danger' as BadgeVariant,
          icon: AlertCircle,
        };
      default:
        return { label: 'Unknown', variant: 'neutral' as BadgeVariant, icon: AlertCircle };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-7 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Tenancy record
            </span>
            <Badge variant={statusConfig.variant} icon={<StatusIcon className="h-3 w-3" />}>
              {statusConfig.label}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {lease.propertyName}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            {lease.address}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            size="sm"
            disabled={isDownloading}
            onClick={() => void handleDownload()}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {isDownloading ? 'Downloading…' : 'Download lease'}
          </Button>
          <Button href="/renter/messages" variant="primary" className="gap-2" size="sm">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact property owner
          </Button>
        </div>
      </div>
      {downloadError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {downloadError}
        </p>
      ) : null}

      <div className="relative mt-6 rounded-2xl border border-border/70 bg-secondary/40 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">Lease period</span>
          </div>
          <span className="text-muted-foreground">
            {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
          </span>
          {lease.status === 'active' && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {Math.ceil(
                (new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )}{' '}
              days remaining
            </span>
          )}
          {lease.status === 'expiring' && renewalOffer && (
            <span className="rounded-full bg-warning-subtle px-2.5 py-1 text-xs font-semibold text-warning">
              Renewal offer available
            </span>
          )}
        </div>
      </div>
    </motion.header>
  );
};
