import { Users, ShieldCheck, Gavel, AlertTriangle, Landmark, TrendingUp } from 'lucide-react';
import { StatCard, type StatCardAccent } from '@getrentos/ui';

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
  const stats: Array<{
    icon: typeof Users;
    label: string;
    value: number;
    subtitle: string;
    accent: StatCardAccent;
    isCurrency?: boolean;
  }> = [
    {
      icon: Users,
      label: 'Total users',
      value: totalUsers,
      subtitle: 'Across all roles',
      accent: 'blue',
    },
    {
      icon: ShieldCheck,
      label: 'Pending verifications',
      value: pendingVerifications,
      subtitle: 'Awaiting review',
      accent: 'primary',
    },
    {
      icon: Gavel,
      label: 'Open disputes',
      value: openDisputes,
      subtitle: 'Needs resolution',
      accent: 'orange',
    },
    {
      icon: AlertTriangle,
      label: 'Fraud alerts',
      value: fraudAlerts,
      subtitle: 'Flagged for review',
      accent: 'red',
    },
    {
      icon: Landmark,
      label: 'Active escrow',
      value: activeEscrowTransactions,
      subtitle: 'In progress',
      accent: 'purple',
    },
    {
      icon: TrendingUp,
      label: 'Platform GMV',
      value: platformGmv,
      subtitle: 'Lifetime · sales, rent & stays',
      accent: 'emerald',
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
