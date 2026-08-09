'use client';

import { motion } from 'framer-motion';
import { Search, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RenterDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const RenterDashboardHeader = ({ greeting, firstName }: RenterDashboardHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {greeting}, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your rentals today.
        </p>
      </div>
      <Button href="/renter/discover" variant="primary" size="lg" className="gap-2">
        <Search className="w-4 h-4" />
        Find Property
      </Button>
    </motion.div>
  );
};
