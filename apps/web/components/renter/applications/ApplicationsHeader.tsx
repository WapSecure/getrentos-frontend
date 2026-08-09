'use client';

import { motion } from 'framer-motion';
import { FileText, TrendingUp, Clock, CheckCircle, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Application } from '@/types/renter';

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your rental applications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onExport} className="gap-2" size="sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button href="/renter/discover" variant="primary" className="gap-2" size="sm">
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-card rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-foreground">Total</span>
          </div>
          <p className="text-xl font-bold text-foreground mt-1">{total}</p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">Pending</span>
          </div>
          <p className="text-xl font-bold text-foreground mt-1">{pending}</p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-foreground">Approved</span>
          </div>
          <p className="text-xl font-bold text-foreground mt-1">{approved}</p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Success Rate</span>
          </div>
          <p className="text-xl font-bold text-primary mt-1">
            {total > 0 ? `${Math.round((approved / total) * 100)}%` : '0%'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
