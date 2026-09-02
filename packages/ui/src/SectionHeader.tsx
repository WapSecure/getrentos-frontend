'use client';

import { motion } from 'framer-motion';

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  className?: string;
}

export const SectionHeader = ({
  badge,
  title,
  description,
  className = '',
}: SectionHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`text-center mb-12 ${className}`}
    >
      {badge && (
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-accent-foreground">
          {badge}
        </div>
      )}
      <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </motion.div>
  );
};
