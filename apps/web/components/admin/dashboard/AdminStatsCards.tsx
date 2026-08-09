import { Users, ShieldCheck, Gavel, AlertTriangle, Landmark, TrendingUp } from 'lucide-react';
import { StatCard, type StatCardAccent } from '@/components/ui/StatCard';

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
    delay: number;
    isCurrency?: boolean;
  }> = [
    {
      icon: Users,
      label: 'Total Users',
      value: totalUsers,
      subtitle: 'Across all roles',
      accent: 'blue',
      delay: 0,
    },
    {
      icon: ShieldCheck,
      label: 'Pending Verifications',
      value: pendingVerifications,
      subtitle: 'Awaiting review',
      accent: 'primary',
      delay: 0.05,
    },
    {
      icon: Gavel,
      label: 'Open Disputes',
      value: openDisputes,
      subtitle: 'Needs resolution',
      accent: 'orange',
      delay: 0.1,
    },
    {
      icon: AlertTriangle,
      label: 'Fraud Alerts',
      value: fraudAlerts,
      subtitle: 'Flagged for review',
      accent: 'red',
      delay: 0.15,
    },
    {
      icon: Landmark,
      label: 'Active Escrow',
      value: activeEscrowTransactions,
      subtitle: 'In progress',
      accent: 'purple',
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      label: 'Platform GMV',
      value: platformGmv,
      subtitle: 'Lifetime',
      accent: 'emerald',
      delay: 0.25,
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
