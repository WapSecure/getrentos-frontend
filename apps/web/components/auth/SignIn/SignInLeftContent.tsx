'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SignInTrustFeatures } from './SignInTrustFeatures';
import { SignInStats } from './SignInStats';

export const SignInLeftContent = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0a1a1f] dark:to-[#1a2a2f] transition-all duration-300">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 lg:opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#c4a747] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2e7d64] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-[#c4a747]/20 to-transparent rounded-full blur-3xl" />
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
              <Sparkles className="w-3 h-3 text-[#c4a747]" />
              <span className="text-xs font-medium text-gray-700 dark:text-white/80">
                WELCOME BACK
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              The safer way
              <span className="block text-[#c4a747] mt-2">to find home.</span>
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
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/40">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#c4a747]" />
                SOC2 Certified
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#c4a747]" />
                GDPR Compliant
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#c4a747]" />
                24/7 Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
