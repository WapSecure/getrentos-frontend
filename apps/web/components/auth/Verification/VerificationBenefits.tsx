'use client';

import { motion } from 'framer-motion';
import { Shield, UserCheck, Lock, TrendingUp, Building2, Users } from 'lucide-react';

const benefits = [
  {
    icon: Shield,
    title: 'Enhanced Security',
    description: 'Protect your account and transactions from fraud',
  },
  { icon: UserCheck, title: 'Trust Badge', description: 'Get a verified badge on your profile' },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Access full escrow protection for transactions',
  },
  {
    icon: TrendingUp,
    title: 'Higher Limits',
    description: 'Increase your transaction and listing limits',
  },
  {
    icon: Building2,
    title: 'Property Verification',
    description: 'List properties with verified status',
  },
  { icon: Users, title: 'Multi-Role Support', description: 'Add additional roles to your account' },
];

export const VerificationBenefits = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {benefits.map((benefit, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#c4a747]/30 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-[#c4a747]/10 flex items-center justify-center flex-shrink-0">
            <benefit.icon className="w-4 h-4 text-[#c4a747]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {benefit.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/60">{benefit.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
