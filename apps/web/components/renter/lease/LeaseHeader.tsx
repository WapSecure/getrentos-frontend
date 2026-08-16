'use client';

import { motion } from 'framer-motion';
import { FileText, Download, Mail, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';
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
  const getStatusConfig = () => {
    switch (lease.status) {
      case 'active':
        return {
          label: 'Active',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: CheckCircle,
        };
      case 'expiring':
        return {
          label: 'Expiring Soon',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: AlertCircle,
        };
      case 'expired':
        return {
          label: 'Expired',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          icon: AlertCircle,
        };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">My Lease</h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            {lease.propertyName} • {lease.address}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" size="sm">
            <Download className="w-4 h-4" />
            Download Lease
          </Button>
          <Button variant="primary" className="gap-2" size="sm">
            <Mail className="w-4 h-4" />
            Contact Landlord
          </Button>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">Lease Period</span>
          </div>
          <span className="text-muted-foreground">
            {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
          </span>
          {lease.status === 'active' && (
            <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              {Math.ceil(
                (new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )}{' '}
              days remaining
            </span>
          )}
          {lease.status === 'expiring' && renewalOffer && (
            <span className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">
              Renewal offer available
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
