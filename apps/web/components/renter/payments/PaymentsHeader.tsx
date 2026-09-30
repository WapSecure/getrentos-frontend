'use client';

import { motion } from 'framer-motion';
import { CreditCard, Plus, Download, Shield, Lock } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface PaymentsHeaderProps {
  onExport: () => void;
  onPayOutstanding?: () => void;
}

export const PaymentsHeader = ({ onExport, onPayOutstanding }: PaymentsHeaderProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <RenterPageHeader
        eyebrow="Rent and billing"
        icon={CreditCard}
        title="Payments"
        description="Manage rent, payment methods, receipts, and your complete payment history."
        actions={
          <>
            <Button variant="outline" className="gap-2" size="sm" onClick={onExport}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>
            {onPayOutstanding && (
              <Button variant="primary" className="gap-2" size="sm" onClick={onPayOutstanding}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Pay outstanding
              </Button>
            )}
          </>
        }
      >
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                All payments are escrow-protected
              </p>
              <p className="text-xs text-muted-foreground">
                Your funds are held securely until conditions are met
              </p>
            </div>
            <Lock className="w-4 h-4 text-primary ml-auto" />
          </div>
        </div>
      </RenterPageHeader>
    </motion.div>
  );
};
