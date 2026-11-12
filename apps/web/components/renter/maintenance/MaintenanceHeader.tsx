'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Plus, Clock } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface MaintenanceHeaderProps {
  onReport: () => void;
  extraAction?: ReactNode;
}

export const MaintenanceHeader = ({ onReport, extraAction }: MaintenanceHeaderProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <RenterPageHeader
        eyebrow="Home care"
        icon={Wrench}
        title="Maintenance"
        description="Report an issue, follow its progress, and keep a reliable service history for your home."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={onReport}>
              Report issue
            </Button>
            {extraAction}
          </div>
        }
      >
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info-subtle">
              <Clock className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Response times</p>
              <p className="text-xs text-muted-foreground">
                Your landlord or property manager handles each request. Where they have set a
                response target, it shows on the request.
              </p>
            </div>
          </div>
        </div>
      </RenterPageHeader>
    </motion.div>
  );
};
