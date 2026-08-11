'use client';

import { motion } from 'framer-motion';

export const SignInStats = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
    >
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">120K+</div>
        <div className="text-xs text-gray-500 dark:text-white/50">Active Members</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">$500M+</div>
        <div className="text-xs text-gray-500 dark:text-white/50">Protected Transactions</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">99.9%</div>
        <div className="text-xs text-gray-500 dark:text-white/50">Satisfaction Rate</div>
      </div>
    </motion.div>
  );
};
