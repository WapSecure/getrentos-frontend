'use client';

import { motion } from 'framer-motion';
import { Wrench, Plus, Clock } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface MaintenanceHeaderProps {
  onReport: () => void;
}

export const MaintenanceHeader = ({ onReport }: MaintenanceHeaderProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <RenterPageHeader
        eyebrow="Home care"
        icon={Wrench}
        title="Maintenance"
        description="Report an issue, follow its progress, and keep a reliable service history for your home."
        actions={
          <Button variant="primary" className="gap-2" size="sm" onClick={onReport}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Report issue
          </Button>
        }
      >
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">SLA Response Promise</p>
              <p className="text-xs text-muted-foreground">
                Urgent issues responded within 2 hours • Standard issues within 24 hours
              </p>
            </div>
          </div>
        </div>
      </RenterPageHeader>
    </motion.div>
  );
};
