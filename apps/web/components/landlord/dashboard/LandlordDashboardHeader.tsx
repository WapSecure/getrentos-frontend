'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

interface LandlordDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const LandlordDashboardHeader = ({ greeting, firstName }: LandlordDashboardHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <span className="mb-2.5 inline-flex items-center rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          Landlord dashboard
        </span>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          {greeting}, {firstName}!
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Here&apos;s how your portfolio is performing today.
        </p>
      </div>
      <Button
        href={ROUTES.LANDLORD_PROPERTIES}
        variant="primary"
        size="lg"
        className="shrink-0 gap-2 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Add Property
      </Button>
    </motion.div>
  );
};
