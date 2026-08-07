'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedParticles } from '@/components/ui/AnimatedParticles';
import { ForgotPasswordLeftContent } from '@/components/auth/ForgotPassword/ForgotPasswordLeftContent';
import { ForgotPasswordForm } from '@/components/auth/ForgotPassword/ForgotPasswordForm';
import { Toast, ToastVariant } from '@/components/ui/Toast';
import { ROUTES } from '@/lib/constants/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSuccess = () => {
    showToast('Password reset successfully! Please sign in.', 'success');
    setTimeout(() => router.push(ROUTES.LOGIN), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a1a1f] dark:to-[#0d2a2f] flex relative">
      <AnimatedParticles />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <ForgotPasswordLeftContent />
      <ForgotPasswordForm onSuccess={handleSuccess} showToast={showToast} />
    </div>
  );
}
