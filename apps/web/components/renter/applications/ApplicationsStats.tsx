'use client';

import { motion } from 'framer-motion';
import { Application } from '@/types/renter';

interface ApplicationsStatsProps {
  applications: Application[];
}

export const ApplicationsStats = ({ applications }: ApplicationsStatsProps) => {
  const stats = [
    {
      label: 'Total Applications',
      value: applications.length,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Under Review',
      value: applications.filter((a) => a.status === 'under_review').length,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Approved',
      value: applications.filter((a) => a.status === 'approved').length,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Rejected',
      value: applications.filter((a) => a.status === 'rejected').length,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <section
      aria-label="Application overview"
      className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
        >
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
        </motion.div>
      ))}
    </section>
  );
};
