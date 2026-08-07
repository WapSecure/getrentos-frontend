'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {greeting}, {firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s how your portfolio is performing today.
        </p>
      </div>
      <Button href="/landlord/properties" variant="primary" size="lg" className="gap-2">
        <Plus className="w-4 h-4" />
        Add Property
      </Button>
    </motion.div>
  );
};
