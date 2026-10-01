'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Fingerprint,
  FileCheck,
  Building2,
  Users,
  CheckCircle,
  BadgeCheck,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const trustFeatures = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Sensitive account data is protected by secure controls',
  },
  {
    icon: Lock,
    title: 'Payment Protection',
    description: 'Your funds are held securely until conditions are met',
  },
  {
    icon: Fingerprint,
    title: 'Identity Verification',
    description: 'Biometric and government ID verification',
  },
  {
    icon: FileCheck,
    title: 'Document Authentication',
    description: 'Document checks that flag possible forgery',
  },
  {
    icon: Building2,
    title: 'Property Verification',
    description: 'Title deed and ownership verification',
  },
  {
    icon: Users,
    title: 'Multi-Role Support',
    description: 'Manage multiple roles with one account',
  },
];

export const SignupLeftContent = () => {
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
              <BadgeCheck className="h-3 w-3" />
              Trust-driven platform
            </div>

            <h2 className="mb-5 text-4xl font-bold tracking-tight text-foreground xl:text-5xl">
              Start with trust.
              <span className="block text-primary mt-2">Build your verified profile.</span>
            </h2>

            <p className="mb-8 max-w-xl text-lg leading-8 text-muted-foreground">
              One secure profile gives you access to verified property opportunities, protected
              payments, and the tools for every role you manage.
            </p>

            {/* Trust Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {trustFeatures.slice(0, 4).map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-border hover:border-primary/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-white/60">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust Score Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Your Trust Score</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-primary" />
                  <span className="text-xs text-gray-500 dark:text-white/60">Starts at 0</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '0%' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-white/50 mt-2">
                Complete verifications to increase your trust score and unlock premium features
              </p>
            </motion.div>
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
