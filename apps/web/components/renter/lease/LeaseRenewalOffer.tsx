'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { RenewalOffer } from '@/types/lease';

interface Lease {
  id: string;
  propertyName: string;
  rentAmount: number;
  endDate: string;
}

interface LeaseRenewalOfferProps {
  renewalOffer: RenewalOffer;
  lease: Lease;
}

export const LeaseRenewalOffer = ({ renewalOffer, lease }: LeaseRenewalOfferProps) => {
  const [response, setResponse] = useState<'accepted' | 'declined' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleResponse = async (action: 'accept' | 'decline') => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setResponse(action === 'accept' ? 'accepted' : 'declined');
    setIsLoading(false);
  };

  if (response === 'accepted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-green-200 dark:border-green-800 overflow-hidden"
      >
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800 dark:text-green-300">Renewal Accepted</h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You&apos;ve accepted the renewal offer for {lease.propertyName}. Your new lease will
            begin on {formatDate(renewalOffer.newEndDate)}.
          </p>
          <Button variant="outline" className="mt-3 w-full gap-2">
            <Mail className="w-4 h-4" />
            Contact Landlord
          </Button>
        </div>
      </motion.div>
    );
  }

  if (response === 'declined') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Renewal Declined</h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You&apos;ve declined the renewal offer. Your current lease will expire on{' '}
            {formatDate(lease.endDate)}.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                You&apos;ll need to move out by {formatDate(lease.endDate)} or discuss alternative
                arrangements.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-[#c4a747]/30 overflow-hidden"
    >
      <div className="p-4 bg-gradient-to-r from-[#c4a747]/10 to-transparent border-b border-[#c4a747]/20">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Renewal Offer</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Your landlord has sent a renewal offer
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#c4a747]" />
              <span className="text-xs text-gray-500">Current Rent</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(lease.rentAmount)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#c4a747]" />
              <span className="text-xs text-gray-500">New Rent</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(renewalOffer.newRentAmount)}
            </p>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
              New Term: {formatDate(renewalOffer.newEndDate)}
            </span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">{renewalOffer.terms}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => handleResponse('accept')}
            isLoading={isLoading}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleResponse('decline')}
            isLoading={isLoading}
          >
            Decline
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
