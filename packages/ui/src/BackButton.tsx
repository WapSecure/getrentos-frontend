'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from '@sureground/icons';

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
      className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm hover:bg-secondary transition-all"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 text-foreground" />
      <span className="text-sm text-foreground">Back</span>
    </motion.button>
  );
};
