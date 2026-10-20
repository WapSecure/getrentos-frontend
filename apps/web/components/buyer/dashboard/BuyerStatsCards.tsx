'use client';

import { motion } from 'framer-motion';
import {
  Heart,
  CalendarClock,
  Handshake,
  ShieldCheck,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtitle?: string;
  color: string;
  delay: number;
}

const colorClasses = {
  blue: { bg: 'bg-info-subtle', icon: 'text-info' },
  orange: {
    bg: 'bg-warning-subtle',
    icon: 'text-warning',
  },
  purple: {
    bg: 'bg-secondary',
    icon: 'text-foreground',
  },
  gold: { bg: 'bg-accent', icon: 'text-primary' },
  emerald: {
    bg: 'bg-success-subtle',
    icon: 'text-success',
  },
  green: { bg: 'bg-success-subtle', icon: 'text-success' },
} as const;

const StatCard = ({ icon: Icon, label, value, subtitle, color, delay }: StatCardProps) => {
  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative p-4">
        <div
          className={`inline-flex p-2.5 rounded-xl ${colors.bg} transition-all duration-300 group-hover:scale-110 mb-3`}
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

interface BuyerStatsCardsProps {
  savedProperties: number;
  upcomingViewings: number;
  activeOffers: number;
  activeTransactions: number;
  documentsUploaded: number;
  completedPurchases: number;
}

export const BuyerStatsCards = ({
  savedProperties,
  upcomingViewings,
  activeOffers,
  activeTransactions,
  documentsUploaded,
  completedPurchases,
}: BuyerStatsCardsProps) => {
  const stats = [
    {
      icon: Heart,
      label: 'Saved Properties',
      value: savedProperties,
      subtitle: 'In your shortlist',
      color: 'blue',
      delay: 0,
    },
    {
      icon: CalendarClock,
      label: 'Upcoming Viewings',
      value: upcomingViewings,
      subtitle: 'Scheduled tours',
      color: 'orange',
      delay: 0.05,
    },
    {
      icon: Handshake,
      label: 'Active Offers',
      value: activeOffers,
      subtitle: 'Awaiting response',
      color: 'gold',
      delay: 0.1,
    },
    {
      icon: ShieldCheck,
      label: 'Held by GetRentos',
      value: activeTransactions,
      subtitle: 'Active transactions',
      color: 'purple',
      delay: 0.15,
    },
    {
      icon: FolderOpen,
      label: 'Documents',
      value: documentsUploaded,
      subtitle: 'Uploaded to vault',
      color: 'emerald',
      delay: 0.2,
    },
    {
      icon: CheckCircle2,
      label: 'Completed Purchases',
      value: completedPurchases,
      subtitle: 'Lifetime',
      color: 'green',
      delay: 0.25,
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
