'use client';

import { motion } from 'framer-motion';
import { Calendar, DollarSign, FileText, User, Mail, Phone, MapPin } from 'lucide-react';

interface Lease {
  id: string;
  propertyName: string;
  address: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  renewalTerms: string;
  landlord: {
    name: string;
    email: string;
    phone: string;
  };
}

interface LeaseDetailsProps {
  lease: Lease;
}

export const LeaseDetails = ({ lease }: LeaseDetailsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Lease Details</h3>
        <p className="text-xs text-muted-foreground">Full lease agreement information</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-500">Property</span>
            </div>
            <p className="text-sm font-medium text-foreground">{lease.propertyName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{lease.address}</p>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-500">Lease Period</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-500">Monthly Rent</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(lease.rentAmount)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-500">Security Deposit</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(lease.securityDeposit)}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
          <span className="text-xs text-gray-500">Renewal Terms</span>
          <p className="text-sm text-foreground mt-1">{lease.renewalTerms}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Landlord Information</h4>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                {lease.landlord.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{lease.landlord.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{lease.landlord.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{lease.landlord.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
