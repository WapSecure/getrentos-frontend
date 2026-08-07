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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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

      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-[#c4a747]/10 to-transparent border border-[#c4a747]/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#c4a747]/20">
            <Shield className="w-5 h-5 text-[#c4a747]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              All payments are escrow-protected
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your funds are held securely until conditions are met
            </p>
          </div>
          <Lock className="w-4 h-4 text-[#c4a747] ml-auto" />
        </div>
      </div>
    </motion.div>
  );
};
