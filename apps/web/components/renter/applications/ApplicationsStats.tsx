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
      color: 'text-info',
    },
    {
      label: 'Under Review',
      value: applications.filter((a) => a.status === 'under_review').length,
      color: 'text-warning',
    },
    {
      label: 'Approved',
      value: applications.filter((a) => a.status === 'approved').length,
      color: 'text-success',
    },
    {
      label: 'Rejected',
      value: applications.filter((a) => a.status === 'rejected').length,
      color: 'text-destructive',
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
