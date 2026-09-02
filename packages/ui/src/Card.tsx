'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@getrentos/shared';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  /** Set for dense dashboard/admin contexts: skips the scroll-in + hover-lift animation meant for marketing pages. */
  static?: boolean;
}

export const Card = ({
  children,
  className = '',
  hover = true,
  delay = 0,
  static: isStatic = false,
}: CardProps) => {
  const baseClassName = cn(
    'overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm transition-all duration-300',
    className
  );
  if (isStatic) {
    return <div className={baseClassName}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.22, 0.61, 0.36, 1],
      }}
      whileHover={
        hover
          ? {
              y: -4,
              scale: 1.01,
              transition: { duration: 0.2 },
              boxShadow: '0 24px 48px -12px rgba(20,24,31,0.14)',
            }
          : {}
      }
      className={baseClassName}
    >
      {children}
    </motion.div>
  );
};
