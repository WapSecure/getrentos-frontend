'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SignInTrustFeatures } from './SignInTrustFeatures';
import { SignInStats } from './SignInStats';

export const SignInLeftContent = () => {
  return (
    <aside className="relative hidden border-r border-border bg-muted/30 transition-all duration-300 lg:flex lg:w-1/2">
      <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
        {/* Logo - Now clickable */}
        <div className="mb-12">
          <Logo size="lg" />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
              <Sparkles className="h-3 w-3" />
              Welcome back
            </div>

            <h2 className="mb-5 text-4xl font-bold tracking-tight text-foreground xl:text-5xl">
              The safer way
              <span className="block text-primary mt-2">to find home.</span>
            </h2>

            <p className="mb-8 max-w-xl text-lg leading-8 text-muted-foreground">
              Discover verified opportunities, protected payments, and a clearer property journey in
              one trusted workspace.
            </p>

            <SignInTrustFeatures />
            <SignInStats />
          </motion.div>
        </div>

        {/* Bottom Trust Signals */}
        <div className="mt-12 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                Secure by design
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                Identity verification
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                24/7 Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
