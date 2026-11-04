'use client';

import { ShieldCheck } from 'lucide-react';
import { Button, PageHeader } from '@getrentos/ui';
import { ROUTES } from '@getrentos/shared';
import { useAdminCan } from '@/hooks/useAdminCan';

interface AdminDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const AdminDashboardHeader = ({ greeting, firstName }: AdminDashboardHeaderProps) => {
  const canReviewVerifications = useAdminCan('verifications.review');
  return (
    <PageHeader
      title={`${greeting}, ${firstName}`}
      description="Review platform activity, risk queues, and client-money operations."
      actions={
        canReviewVerifications ? (
          <Button
            href={ROUTES.ADMIN_VERIFICATIONS}
            variant="primary"
            size="lg"
            icon={<ShieldCheck />}
          >
            Review verifications
          </Button>
        ) : undefined
      }
    />
  );
};
