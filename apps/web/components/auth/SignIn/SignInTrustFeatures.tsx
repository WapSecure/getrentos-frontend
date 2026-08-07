'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, TrendingUp } from 'lucide-react';

const trustFeatures = [
  {
    icon: Shield,
    title: 'Identity-verified listings',
    description: 'Every property and user is verified',
  },
  {
    icon: Lock,
    title: 'Escrow-protected transactions',
    description: 'Your funds are always secure',
  },
  {
    icon: CheckCircle,
    title: 'Real-time application tracking',
    description: 'Know your status instantly',
  },
  {
    icon: TrendingUp,
    title: 'Transparent trust scores',
    description: 'Build and see your reputation grow',
  },
];

export const SignInTrustFeatures = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {trustFeatures.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#c4a747]/30 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-[#c4a747]/10 flex items-center justify-center flex-shrink-0">
            <feature.icon className="w-4 h-4 text-[#c4a747]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/60">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
