'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowRight,
  Phone,
  FileText,
  CreditCard,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TrustScoreRing } from '@/components/renter/shared/TrustScoreRing';

interface VerificationItem {
  label: string;
  verified: boolean;
  icon: React.ElementType;
}

const verificationItems: VerificationItem[] = [
  { label: 'Identity Verified', verified: true, icon: Shield },
  { label: 'Phone Verified', verified: true, icon: Phone },
  { label: 'Email Verified', verified: true, icon: CheckCircle },
  { label: 'Background Check', verified: false, icon: FileText },
  { label: 'Credit Report', verified: false, icon: CreditCard },
  { label: 'References Added', verified: false, icon: Users },
];

export const RenterTrustScoreCard = () => {
  const trustScore = 78;
  const verifiedCount = verificationItems.filter((item) => item.verified).length;
  const totalCount = verificationItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Trust Score</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Build trust to unlock more features
        </p>
      </div>

      <div className="p-4">
        {/* Trust Score Ring */}
        <div className="flex flex-col items-center mb-4">
          <TrustScoreRing score={trustScore} size={120} strokeWidth={8} />
          <div className="text-center mt-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Excellent Trust Score
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Higher scores get better opportunities
            </p>
          </div>
        </div>

        {/* Verification Items */}
        <div className="space-y-3 mb-4">
          {verificationItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1 rounded ${item.verified ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                  <item.icon
                    className={`w-3 h-3 ${item.verified ? 'text-green-600' : 'text-gray-400'}`}
                  />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
              {item.verified ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Pending</span>
                  <XCircle className="w-3 h-3 text-gray-400" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Verification Progress</span>
            <span>
              {verifiedCount}/{totalCount} completed
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(verifiedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="h-full bg-[#c4a747] rounded-full"
            />
          </div>
        </div>

        {/* Action Button */}
        <Button href="/renter/verification" variant="primary" fullWidth className="gap-2">
          <TrendingUp className="w-4 h-4" />
          Improve Your Trust Score
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};
