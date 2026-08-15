'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

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
    'overflow-hidden rounded-2xl border border-border/90 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300',
    className
  );
  if (isStatic) {
    return <div className={baseClassName}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={
        hover
          ? {
              y: -8,
              scale: 1.02,
              transition: { duration: 0.2 },
              boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)',
            }
          : {}
      }
      className={baseClassName}
    >
      {children}
    </motion.div>
  );
};
