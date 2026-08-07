'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

interface CompleteStepProps {
  onComplete: () => void;
}

export const CompleteStep = ({ onComplete }: CompleteStepProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 space-y-4"
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Verification Complete!
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Your identity has been verified successfully. Redirecting to your dashboard...
      </p>
    </motion.div>
  );
};
