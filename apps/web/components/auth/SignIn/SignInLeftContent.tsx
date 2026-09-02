'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SignInTrustFeatures } from './SignInTrustFeatures';
import { SignInStats } from './SignInStats';

export const SignInLeftContent = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background transition-all duration-300">
      {/* Background: soft radial glow + dot texture. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(75%_55%_at_30%_0%,rgba(0,113,227,0.12),transparent_62%)]" />
        <div className="hero-dots absolute inset-0 opacity-50" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

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

            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              The safer way
              <span className="block text-primary mt-2">to find home.</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-white/70 mb-8 leading-relaxed">
              Every listing verified. Every transaction protected. Join 120,000+ members who trust
              GetRentos.
            </p>

            <SignInTrustFeatures />
            <SignInStats />
          </motion.div>
        </div>

        {/* Bottom Trust Signals */}
        <div className="mt-12 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/40">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                SOC2 Certified
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                GDPR Compliant
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                24/7 Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
