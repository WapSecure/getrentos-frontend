'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';

export const CTA = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary/10 to-transparent rounded-2xl p-8 md:p-12 border border-primary/20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust GetRentos for their real estate needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/auth/signup" size="lg">
              Create your account
              <ArrowRight className="w-4 h-4" />
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
