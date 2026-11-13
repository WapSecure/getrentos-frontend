'use client';

import { Search } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ROUTES } from '@/lib/constants/auth';
import { DashboardHeader } from '@/components/shared/dashboard/DashboardHeader';

interface RenterDashboardHeaderProps {
  greeting: 'morning' | 'afternoon' | 'evening';
  firstName: string;
}

export const RenterDashboardHeader = ({ greeting, firstName }: RenterDashboardHeaderProps) => {
  const { t } = useLanguage();
  const greetingText = t(`dashboard.greeting_${greeting}`);

  return (
    <DashboardHeader
      title={`${greetingText}, ${firstName}`}
      description={t('dashboard.subtitle')}
      action={
        <Button href={ROUTES.RENTER_DISCOVER} variant="primary" size="lg" icon={<Search />}>
          {t('dashboard.find_property')}
        </Button>
      }
    />
  );
};
