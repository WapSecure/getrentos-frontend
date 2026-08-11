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
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const trustFeatures = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: '256-bit encryption and SOC2 certified data centers',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
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
    description: 'AI-powered document forgery detection',
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
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background transition-all duration-300">
      {/* Background Pattern - Light mode */}
      <div className="absolute inset-0 opacity-10 lg:opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2e7d64] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-3xl" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 mb-6">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-gray-700 dark:text-white/80">
                TRUST-DRIVEN PLATFORM
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Start with trust.
              <span className="block text-primary mt-2">Build your verified profile.</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-white/70 mb-8 leading-relaxed">
              Unlock the safest property platform on the market. Every transaction is protected by
              bank-grade escrow and verified identities.
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
              className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
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
