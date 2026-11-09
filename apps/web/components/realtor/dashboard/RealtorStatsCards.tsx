'use client';

import { StatCard } from '@sureground/ui';
import { Users, Megaphone, UserPlus, CalendarClock, Handshake, Wallet } from 'lucide-react';

interface RealtorStatsCardsProps {
  activeClients: number;
  activeListings: number;
  activeLeads: number;
  upcomingViewings: number;
  pendingOffers: number;
  /** null when the realtor isn't on Pro: commissions are a Pro feature. */
  commissionYtd: number | null;
}

export const RealtorStatsCards = ({
  activeClients,
  activeListings,
  activeLeads,
  upcomingViewings,
  pendingOffers,
  commissionYtd,
}: RealtorStatsCardsProps) => {
  const stats = [
    {
      icon: Users,
      label: 'Active clients',
      value: activeClients,
      subtitle: 'Owners & landlords',
      accent: 'blue',
      delay: 0,
    },
    {
      icon: Megaphone,
      label: 'Active listings',
      value: activeListings,
      subtitle: 'Published on your behalf',
      accent: 'orange',
      delay: 0.05,
    },
    {
      icon: UserPlus,
      label: 'Active leads',
      value: activeLeads,
      subtitle: 'In your pipeline',
      accent: 'purple',
      delay: 0.1,
    },
    {
      icon: CalendarClock,
      label: 'Upcoming viewings',
      value: upcomingViewings,
      subtitle: 'Scheduled tours',
      accent: 'primary',
      delay: 0.15,
    },
    {
      icon: Handshake,
      label: 'Pending offers',
      value: pendingOffers,
      subtitle: 'Awaiting response',
      accent: 'green',
      delay: 0.2,
    },
    {
      icon: Wallet,
      label: 'Commission YTD',
      value: commissionYtd ?? 'Pro',
      subtitle: commissionYtd === null ? 'Upgrade to unlock' : 'Year to date',
      accent: 'emerald',
      delay: 0.25,
      isCurrency: true,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
