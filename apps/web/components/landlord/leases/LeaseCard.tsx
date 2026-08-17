'use client';

import { motion } from 'framer-motion';
import { FileCheck, Download, PenLine, RefreshCcw, Send } from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { leaseStatusBadges } from '@/lib/statusBadge';
import { landlordService } from '@/services/landlordService';
import type { Lease } from '@/types/landlord';

const daysUntil = (dateString: string) => {
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

interface LeaseCardProps {
  lease: Lease;
  delay?: number;
  onSendLease: (id: string) => void;
  onRequestRenewal: (lease: Lease) => void;
  onSignLease: (lease: Lease) => void;
}

export const LeaseCard = ({
  lease,
  delay = 0,
  onSendLease,
  onRequestRenewal,
  onSignLease,
}: LeaseCardProps) => {
  const status = leaseStatusBadges[lease.status];
  const remainingDays = daysUntil(lease.leaseEnd);
  const isExpiringSoon = lease.status === 'signed' && remainingDays > 0 && remainingDays <= 60;

  const handleDownload = () => {
    void landlordService.downloadLeasePdf(lease.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{lease.tenantName}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {lease.propertyName} • {lease.unitName}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-gray-400">Lease Period</p>
          <p className="text-sm font-medium text-foreground">
            {formatDate(lease.leaseStart)} – {formatDate(lease.leaseEnd)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Monthly Rent</p>
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(lease.rentAmount, { compact: true })}
          </p>
        </div>
      </div>

      {isExpiringSoon && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2.5 py-1.5">
          Expires in {remainingDays} day{remainingDays === 1 ? '' : 's'}
        </p>
      )}

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        {lease.status === 'draft' && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            className="gap-1.5"
            onClick={() => onSendLease(lease.id)}
          >
            <Send className="w-3.5 h-3.5" />
            Send Lease
          </Button>
        )}
        {lease.status === 'sent' && (
          <Button
            variant={lease.landlordSigned ? 'outline' : 'primary'}
            size="sm"
            fullWidth
            disabled={lease.landlordSigned}
            className="gap-1.5"
            onClick={() => onSignLease(lease)}
          >
            <PenLine className="w-3.5 h-3.5" />
            {lease.landlordSigned ? 'Waiting on tenant' : 'Sign Lease'}
          </Button>
        )}
        {lease.status === 'signed' && (
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="gap-1.5"
              onClick={handleDownload}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="gap-1.5"
              onClick={() => onRequestRenewal(lease)}
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Renew
            </Button>
          </>
        )}
        {lease.status === 'expired' && (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="gap-1.5"
            onClick={() => onRequestRenewal(lease)}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Create New Lease
          </Button>
        )}
      </div>
    </motion.div>
  );
};
