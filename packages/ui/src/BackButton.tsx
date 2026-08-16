'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackPath?: string;
}

export const BackButton = ({ fallbackPath = '/' }: BackButtonProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return (
    <motion.button
      onClick={handleBack}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
      <span className="text-sm text-gray-700 dark:text-gray-300">Back</span>
    </motion.button>
  );
};
