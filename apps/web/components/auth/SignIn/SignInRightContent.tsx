'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Mail, Phone, Fingerprint } from 'lucide-react';
import { EmailSignIn } from './methods/EmailSignIn';
import { PhoneSignIn } from './methods/PhoneSignIn';
import { MagicLinkSignIn } from './methods/MagicLinkSignIn';
import { SignInMethod } from '@/app/(auth)/login/page';
import { ROUTES } from '@/lib/constants/auth';
import { Toast, ToastVariant } from '@/components/ui/Toast';

interface SignInRightContentProps {
  method: SignInMethod;
  setMethod: (method: SignInMethod) => void;
}

export const SignInRightContent = ({ method, setMethod }: SignInRightContentProps) => {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);

  useEffect(() => {
    if (isLocked && lockoutTimer && lockoutTimer > 0) {
      const timer = setTimeout(() => {
        setLockoutTimer(lockoutTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutTimer === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLocked(false);
      setLoginAttempts(0);
      setLockoutTimer(null);
    }
  }, [isLocked, lockoutTimer]);

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 5000);
  };

  const handleLoginAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      setIsLocked(true);
      setLockoutTimer(15 * 60);
      showToast('Too many failed attempts. Account locked for 15 minutes.', 'error');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderMethodComponent = () => {
    switch (method) {
      case 'email':
        return (
          <EmailSignIn
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            showToast={showToast}
            onLoginAttempt={handleLoginAttempt}
            isLocked={isLocked}
            lockoutTimer={lockoutTimer}
          />
        );
      case 'phone':
        return (
          <PhoneSignIn
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            showToast={showToast}
            onLoginAttempt={handleLoginAttempt}
            isLocked={isLocked}
            lockoutTimer={lockoutTimer}
          />
        );
      case 'magic-link':
        return (
          <MagicLinkSignIn
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 lg:static lg:mb-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Back</span>
        </button>

        {/* Mobile Header */}
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] rounded-2xl mb-4">
            <Shield className="w-6 h-6 text-white dark:text-[#0a1a1f]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to continue your property journey
          </p>
        </div>

        {/* Lockout Warning */}
        {isLocked && lockoutTimer && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 text-sm flex items-center gap-2">
            <span>
              Account temporarily locked. Try again in {Math.floor(lockoutTimer / 60)}:
              {(lockoutTimer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Method Selection */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-white/10 rounded-xl">
          <button
            onClick={() => setMethod('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              method === 'email'
                ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => setMethod('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              method === 'phone'
                ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            Phone
          </button>
          <button
            onClick={() => setMethod('magic-link')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              method === 'magic-link'
                ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            Magic Link
          </button>
        </div>

        {/* Dynamic Form */}
        {renderMethodComponent()}

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <a
              href={ROUTES.SIGNUP}
              className="font-medium text-[#c4a747] hover:text-[#a88d3a] transition-colors"
            >
              Create one now
            </a>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-white/5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Demo Credentials</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Email: demo@getrentos.com</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Password: demo123</p>
        </div>
      </div>
    </div>
  );
};
