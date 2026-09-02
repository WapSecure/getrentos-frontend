'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ROUTES } from '@/lib/constants/auth';

interface RenterDashboardHeaderProps {
  greeting: 'morning' | 'afternoon' | 'evening';
  firstName: string;
}

export const RenterDashboardHeader = ({ greeting, firstName }: RenterDashboardHeaderProps) => {
  const { t } = useLanguage();
  const greetingText = t(`dashboard.greeting_${greeting}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <span className="mb-2.5 inline-flex items-center rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          Renter dashboard
        </span>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          {greetingText}, {firstName}!
        </h1>
        <p className="mt-1.5 text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>
      <Button
        href={ROUTES.RENTER_DISCOVER}
        variant="primary"
        size="lg"
        className="shrink-0 gap-2 shadow-sm"
      >
        <Search className="h-4 w-4" />
        {t('dashboard.find_property')}
      </Button>
    </motion.div>
  );
};
