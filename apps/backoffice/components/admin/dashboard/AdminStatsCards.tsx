'use client';

import { Gavel, Landmark, Lock, ShieldAlert, ShieldCheck, Users } from '@sureground/icons';
import { StatGroup } from '@sureground/ui';
import { formatCurrency, ROUTES } from '@sureground/shared';
import { useAdminCan } from '@/hooks/useAdminCan';

interface AdminStatsCardsProps {
  totalUsers: number;
  pendingVerifications: number;
  openDisputes: number;
  fraudAlerts: number;
  activeEscrowTransactions: number;
  platformGmv: number;
}

export const AdminStatsCards = ({
  totalUsers,
  pendingVerifications,
  openDisputes,
  fraudAlerts,
  activeEscrowTransactions,
  platformGmv,
}: AdminStatsCardsProps) => {
  // Every role sees the totals; a figure links only to a page the sidebar would show that role.
  const canViewUsers = useAdminCan('users.view');
  const canViewEscrow = useAdminCan('escrow.view');
  const canReviewVerifications = useAdminCan('verifications.review');
  const canReviewDisputes = useAdminCan('disputes.review');
  const canReviewFraud = useAdminCan('fraud.review');

  return (
    <div className="space-y-4">
      <StatGroup
        title="Platform"
        items={[
          {
            label: 'Platform GMV',
            value: formatCurrency(platformGmv, { compact: true }),
            subtitle: 'Lifetime · sales, rent & stays',
            icon: Landmark,
          },
          {
            label: 'Active escrow',
            value: activeEscrowTransactions,
            subtitle: 'In progress',
            icon: Lock,
            href: canViewEscrow ? ROUTES.ADMIN_ESCROW : undefined,
          },
          {
            label: 'Total users',
            value: totalUsers,
            subtitle: 'Across all roles',
            icon: Users,
            href: canViewUsers ? ROUTES.ADMIN_USERS : undefined,
          },
        ]}
      />
      <StatGroup
        title="Review queues"
        items={[
          {
            label: 'Pending verifications',
            value: pendingVerifications,
            subtitle: 'Awaiting review',
            icon: ShieldCheck,
            attention: pendingVerifications > 0,
            href: canReviewVerifications ? ROUTES.ADMIN_VERIFICATIONS : undefined,
          },
          {
            label: 'Open disputes',
            value: openDisputes,
            subtitle: 'Needs resolution',
            icon: Gavel,
            attention: openDisputes > 0,
            href: canReviewDisputes ? ROUTES.ADMIN_DISPUTES : undefined,
          },
          {
            label: 'Fraud alerts',
            value: fraudAlerts,
            subtitle: 'Open: flagged or under investigation',
            icon: ShieldAlert,
            attention: fraudAlerts > 0,
            href: canReviewFraud ? ROUTES.ADMIN_FRAUD : undefined,
          },
        ]}
      />
    </div>
  );
};
