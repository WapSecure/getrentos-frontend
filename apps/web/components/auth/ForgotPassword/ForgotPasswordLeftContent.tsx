'use client';

import { motion } from 'framer-motion';
import { Key, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export const ForgotPasswordLeftContent = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0a1a1f] dark:to-[#1a2a2f] transition-all duration-300">
      <div className="absolute inset-0 opacity-10 lg:opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#c4a747] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2e7d64] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
        {/* Logo - Now clickable */}
        <div className="mb-12">
          <Logo size="lg" />
        </div>

        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 mb-6">
              <Sparkles className="w-3 h-3 text-[#c4a747]" />
              <span className="text-xs font-medium text-gray-700 dark:text-white/80">
                FORGOT PASSWORD
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Don&apos;t worry,
              <span className="block text-[#c4a747] mt-2">we&apos;ve got your back.</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-white/70 mb-8 leading-relaxed">
              Enter your email or phone number and we&apos;ll send you a verification code to reset
              your password.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-white/5">
                <Key className="w-5 h-5 text-[#c4a747]" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Secure Reset Process
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    Multi-step verification ensures security
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-white/5">
                <Lock className="w-5 h-5 text-[#c4a747]" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Create Strong Password
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    Use a unique password you haven&apos;t used before
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-white/40">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-[#c4a747]" /> Secure
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-[#c4a747]" /> Encrypted
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-[#c4a747]" /> 24/7 Support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
