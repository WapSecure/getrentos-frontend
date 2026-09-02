'use client';

import { motion } from 'framer-motion';
import { Button } from '@getrentos/ui';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

export const CTA = () => {
  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-accent/60 to-transparent p-10 shadow-lg backdrop-blur md:p-16 dark:from-primary/15 dark:via-accent/10"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground md:text-5xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mb-9 mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Join thousands of users who trust GetRentos for their real estate needs
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href={ROUTES.SIGNUP} size="lg" className="group">
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button href="#features" variant="secondary" size="lg">
              Learn more
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
