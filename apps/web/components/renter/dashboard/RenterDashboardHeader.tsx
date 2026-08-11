'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {greetingText}, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
      </div>
      <Button href={ROUTES.RENTER_DISCOVER} variant="primary" size="lg" className="gap-2">
        <Search className="w-4 h-4" />
        {t('dashboard.find_property')}
      </Button>
    </motion.div>
  );
};
