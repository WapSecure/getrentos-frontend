'use client';

import { motion } from 'framer-motion';
import { FileText, TrendingUp, Clock, CheckCircle, Download, Plus } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Application } from '@/types/renter';
import { ROUTES } from '@/lib/constants/auth';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface ApplicationsHeaderProps {
  applications: Application[];
  onExport: () => void;
}

export const ApplicationsHeader = ({ applications, onExport }: ApplicationsHeaderProps) => {
  const total = applications.length;
  const pending = applications.filter(
    (a) => a.status === 'pending' || a.status === 'under_review'
  ).length;
  const approved = applications.filter((a) => a.status === 'approved').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <RenterPageHeader
        eyebrow="Rental journey"
        icon={FileText}
        title="My applications"
        description="Track every application, review its progress, and keep your next steps organised."
        actions={
          <>
            <Button variant="outline" onClick={onExport} className="gap-2" size="sm">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>
            <Button href={ROUTES.RENTER_DISCOVER} variant="primary" className="gap-2" size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New application
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground">Total</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">{total}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-foreground">Pending</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">{pending}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">Approved</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">{approved}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Success Rate</span>
            </div>
            <p className="text-xl font-bold text-primary mt-1">
              {total > 0 ? `${Math.round((approved / total) * 100)}%` : '0%'}
            </p>
          </div>
        </div>
      </RenterPageHeader>
    </motion.div>
  );
};
