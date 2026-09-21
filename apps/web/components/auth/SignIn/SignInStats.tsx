'use client';

import { motion } from 'framer-motion';

/**
 * Three things that are true of the platform. This used to show made-up member,
 * transaction-volume and satisfaction figures (in dollars, for a naira product);
 * when real usage numbers exist they can go here.
 */
const highlights = [
  { headline: 'Escrow', caption: 'Payment protection' },
  { headline: 'Verified', caption: 'Identity checks' },
  { headline: 'Free', caption: 'To get started' },
];

export const SignInStats = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
    >
      {highlights.map((item) => (
        <div key={item.headline} className="text-center">
          <div className="text-2xl font-bold text-primary">{item.headline}</div>
          <div className="text-xs text-gray-500 dark:text-white/50">{item.caption}</div>
        </div>
      ))}
    </motion.div>
  );
};
