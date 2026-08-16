'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { RoleCard } from '@/components/auth/RoleSelection/RoleCard';
import { MultiRoleToggle } from '@/components/auth/RoleSelection/MultiRoleToggle';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@getrentos/ui';
import { useSignup } from '@/hooks/useSignup';
import { ROLES, ROUTES } from '@/lib/constants/auth';

export default function RoleSelectionPage() {
  const router = useRouter();
  const {
    signupData,
    addRole,
    removeRole,
    canAddMoreRoles,
    setCanAddMoreRoles,
    createAccount,
    needsVerification,
    isLoading,
  } = useSignup();

  const handleContinue = async () => {
    if (signupData.selectedRoles.length === 0) return;
    // Roles that require identity verification run the wizard BEFORE the
    // account is created — the auto face-match status is known up front.
    if (needsVerification) {
      router.push(ROUTES.VERIFICATION);
      return;
    }
    await createAccount();
  };

  const handleBack = () => {
    router.back();
  };

  // Admin/BackOffice is internal-staff-only and provisioned out of band —
  // never offered as a self-serve signup option.
  const roleList = Object.values(ROLES)
    .filter((role) => role.id !== 'admin')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleBack}
        className="fixed top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-border hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Back</span>
      </motion.button>

      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose your role(s)</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select how you&apos;ll use GetRentos to get a personalized experience
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            You can add more roles later with supporting documents
          </p>
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {roleList.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <RoleCard
                role={role}
                isSelected={signupData.selectedRoles.includes(role.id)}
                onSelect={() => addRole(role.id)}
                onDeselect={() => removeRole(role.id)}
                disabled={
                  !canAddMoreRoles &&
                  signupData.selectedRoles.length >= 1 &&
                  !signupData.selectedRoles.includes(role.id)
                }
              />
            </motion.div>
          ))}
        </div>

        {/* Multi-Role Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="max-w-md mx-auto mb-8"
        >
          <MultiRoleToggle enabled={canAddMoreRoles} onToggle={setCanAddMoreRoles} />
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="max-w-md mx-auto"
        >
          <button
            onClick={handleContinue}
            disabled={signupData.selectedRoles.length === 0 || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-background border-t-transparent rounded-full"
              />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
