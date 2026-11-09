'use client';

import {
  CalendarClock,
  CheckCircle2,
  FolderOpen,
  Handshake,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { StatCard, type StatCardAccent } from '@sureground/ui';

interface BuyerStatsCardsProps {
  savedProperties: number;
  upcomingViewings: number;
  activeOffers: number;
  activeTransactions: number;
  documentsUploaded: number;
  completedPurchases: number;
}

export const BuyerStatsCards = (props: BuyerStatsCardsProps) => {
  const stats: Array<{
    icon: typeof Heart;
    label: string;
    value: number;
    subtitle: string;
    accent: StatCardAccent;
  }> = [
    {
      icon: Heart,
      label: 'Saved properties',
      value: props.savedProperties,
      subtitle: 'In your shortlist',
      accent: 'blue',
    },
    {
      icon: CalendarClock,
      label: 'Upcoming viewings',
      value: props.upcomingViewings,
      subtitle: 'Scheduled tours',
      accent: 'orange',
    },
    {
      icon: Handshake,
      label: 'Active offers',
      value: props.activeOffers,
      subtitle: 'Awaiting a response',
      accent: 'primary',
    },
    {
      icon: ShieldCheck,
      label: 'Active purchases',
      value: props.activeTransactions,
      subtitle: 'Protected transactions',
      accent: 'green',
    },
    {
      icon: FolderOpen,
      label: 'Documents',
      value: props.documentsUploaded,
      subtitle: 'Uploaded to your vault',
      accent: 'blue',
    },
    {
      icon: CheckCircle2,
      label: 'Completed purchases',
      value: props.completedPurchases,
      subtitle: 'Lifetime',
      accent: 'green',
    },
  ];

  return (
    <section
      aria-label="Purchase overview"
      className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6"
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} compact />
      ))}
    </section>
  );
};
