'use client';

import { motion } from 'framer-motion';

export const ProcessingStep = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-8 space-y-4"
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">Processing</h3>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Please wait while we verify your documents...
      </p>
    </motion.div>
  );
};
