'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LeaseRenewal {
  property: string;
  currentEndDate: string;
  renewalOfferDate: string;
  newRentAmount: number;
  currentRentAmount: number;
  increasePercentage: number;
  status: 'pending' | 'reviewed' | 'accepted' | 'declined';
}

const renewalData: LeaseRenewal = {
  property: 'Modern Downtown Loft',
  currentEndDate: '2025-03-01',
  renewalOfferDate: '2025-01-15',
  newRentAmount: 210000,
  currentRentAmount: 200000,
  increasePercentage: 5,
  status: 'pending',
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const RenterLeaseRenewal = () => {
  const router = useRouter();
  const daysUntilOffer = Math.ceil(
    (new Date(renewalData.renewalOfferDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lease Renewal</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your lease is coming up for renewal
        </p>
      </div>

      <div className="p-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Renewal Offer Coming Soon
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Your landlord will send a renewal offer in {daysUntilOffer} days
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Property</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {renewalData.property}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-white/10">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Lease Ends</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(renewalData.currentEndDate)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-white/10">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Rent</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                renewalData.currentRentAmount
              )}
              /mo
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-white/10">
            <span className="text-sm text-gray-600 dark:text-gray-400">Expected Increase</span>
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              {renewalData.increasePercentage}% (
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                renewalData.newRentAmount - renewalData.currentRentAmount
              )}
              )
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          className="gap-2"
          onClick={() => router.push('/renter/lease')}
        >
          <FileText className="w-4 h-4" />
          Review Lease Terms
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};
