'use client';

import { motion } from 'framer-motion';
import { CreditCard, Plus, Download, Shield, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaymentsHeaderProps {
  onExport: () => void;
}

export const PaymentsHeader = ({ onExport }: PaymentsHeaderProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your rent payments and view payment history
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" size="sm" onClick={onExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="primary" className="gap-2" size="sm">
            <Plus className="w-4 h-4" />
            Make Payment
          </Button>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-linear-to-r from-primary/10 to-transparent border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">All payments are escrow-protected</p>
            <p className="text-xs text-muted-foreground">
              Your funds are held securely until conditions are met
            </p>
          </div>
          <Lock className="w-4 h-4 text-primary ml-auto" />
        </div>
      </div>
    </motion.div>
  );
};
