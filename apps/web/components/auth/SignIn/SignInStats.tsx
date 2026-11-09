'use client';

import { motion } from 'framer-motion';

const highlights = [
  { headline: 'Protected', caption: 'Sureground holds your payment' },
  { headline: 'Verified', caption: 'Identity checks' },
  { headline: 'Free', caption: 'To get started' },
];

export const SignInStats = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-4"
    >
      {highlights.map((item) => (
        <div key={item.headline} className="text-center">
          <div className="text-2xl font-bold text-primary">{item.headline}</div>
          <div className="mt-1 text-xs text-muted-foreground">{item.caption}</div>
        </div>
      ))}
    </motion.div>
  );
};
