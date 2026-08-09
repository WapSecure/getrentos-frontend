'use client';

import { motion } from 'framer-motion';
import { Home, Calendar, DollarSign, FileText } from 'lucide-react';

interface Lease {
  id: string;
  propertyName: string;
  address: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
}

interface LeaseStatsProps {
  lease: Lease;
}

export const LeaseStats = ({ lease }: LeaseStatsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = () => {
    const end = new Date(lease.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const stats = [
    {
      icon: Home,
      label: 'Property',
      value: lease.propertyName,
    },
    {
      icon: Calendar,
      label: 'Days Remaining',
      value: getDaysRemaining(),
      suffix: ' days',
    },
    {
      icon: DollarSign,
      label: 'Monthly Rent',
      value: formatCurrency(lease.rentAmount),
    },
    {
      icon: FileText,
      label: 'Security Deposit',
      value: formatCurrency(lease.securityDeposit),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-base font-semibold text-foreground">
            {stat.value}
            {stat.suffix || ''}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
