'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@getrentos/ui';
import { ForgotPasswordLeftContent } from '@/components/auth/ForgotPassword/ForgotPasswordLeftContent';
import { ForgotPasswordForm } from '@/components/auth/ForgotPassword/ForgotPasswordForm';
import { Toast, ToastVariant } from '@getrentos/ui';
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
    <div className="relative flex min-h-screen bg-background">
      {/* Ambient canvas: soft radial glows (form side stays clean + airy). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_100%_0%,rgba(0,113,227,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_0%_100%,rgba(0,113,227,0.05),transparent_60%)]" />
      </div>
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <ForgotPasswordLeftContent />
      <ForgotPasswordForm onSuccess={handleSuccess} showToast={showToast} />
    </div>
  );
}
