'use client';

import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@getrentos/ui';
import { ForgotPasswordLeftContent } from '@/components/auth/ForgotPassword/ForgotPasswordLeftContent';
import { ForgotPasswordForm } from '@/components/auth/ForgotPassword/ForgotPasswordForm';
import { useToast, type ToastVariant } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const showToast = (message: string, variant: ToastVariant) => {
    toast.show(message, variant);
  };

  const handleSuccess = () => {
    showToast('Password reset successfully! Please sign in.', 'success');
    setTimeout(() => router.push(ROUTES.LOGIN), 2000);
  };

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      <ForgotPasswordLeftContent />
      <ForgotPasswordForm onSuccess={handleSuccess} showToast={showToast} />
    </div>
  );
}
