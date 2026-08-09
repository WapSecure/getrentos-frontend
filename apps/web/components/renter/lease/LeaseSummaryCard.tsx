'use client';

import { motion } from 'framer-motion';
import { Home, Calendar, DollarSign, FileText, MapPin, Building2 } from 'lucide-react';

interface Lease {
  id: string;
  propertyName: string;
  address: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  status: 'active' | 'expiring' | 'expired';
  landlord: {
    name: string;
    email: string;
    phone: string;
  };
}

interface LeaseSummaryCardProps {
  lease: Lease;
}

export const LeaseSummaryCard = ({ lease }: LeaseSummaryCardProps) => {
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

  const getStatusColor = () => {
    switch (lease.status) {
      case 'active':
        return 'bg-green-500';
      case 'expiring':
        return 'bg-yellow-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="relative">
        {/* Status Bar */}
        <div className={`h-1 ${getStatusColor()}`} />

        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{lease.propertyName}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">{lease.address}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">
                {formatCurrency(lease.rentAmount)}/mo
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{getDaysRemaining()} days left</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-gray-500">Lease Start</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(lease.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lease End</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(lease.endDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Security Deposit</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(lease.securityDeposit)}
              </p>
            </div>
          </div>

          {/* Landlord Info Mini */}
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white text-xs font-semibold">
              {lease.landlord.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{lease.landlord.name}</p>
              <p className="text-xs text-gray-500">{lease.landlord.email}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
