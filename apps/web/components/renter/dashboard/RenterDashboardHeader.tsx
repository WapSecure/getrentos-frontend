'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ROUTES } from '@/lib/constants/auth';
import { RenterPageHeader } from '../shared/RenterPageHeader';

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
    >
      <RenterPageHeader
        eyebrow="Renter dashboard"
        title={`${greetingText}, ${firstName}!`}
        description={t('dashboard.subtitle')}
        actions={
          <Button
            href={ROUTES.RENTER_DISCOVER}
            variant="primary"
            size="lg"
            className="shrink-0 gap-2 shadow-sm"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.find_property')}
          </Button>
        }
      />
    </motion.div>
  );
};
