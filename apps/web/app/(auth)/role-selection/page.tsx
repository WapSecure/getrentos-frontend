'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { RoleCard } from '@/components/auth/RoleSelection/RoleCard';
import { MultiRoleToggle } from '@/components/auth/RoleSelection/MultiRoleToggle';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@getrentos/ui';
import { useSignup } from '@/hooks/useSignup';
import { ROLES } from '@/lib/constants/auth';

export default function RoleSelectionPage() {
  const router = useRouter();
  const {
    signupData,
    addRole,
    removeRole,
    canAddMoreRoles,
    setCanAddMoreRoles,
    createAccount,
    isLoading,
  } = useSignup();

  const handleContinue = async () => {
    if (signupData.selectedRoles.length === 0) return;
    // Every account is created immediately, with no upfront document/facial
    // verification — identity/license/ownership checks happen later, at the
    // point of use, for the specific actions that need them.
    await createAccount();
  };

  const handleBack = () => {
    router.back();
  };

  // Admin/BackOffice, Gateman, and Resident are provisioned out of band —
  // never offered as a self-serve signup option (gateman and resident are
  // both granted by an estate manager, not chosen at signup).
  const roleList = Object.values(ROLES)
    .filter((role) => role.id !== 'admin' && role.id !== 'gateman' && role.id !== 'resident')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleBack}
        className="fixed left-6 top-6 z-30 flex items-center gap-2 rounded-lg border border-border bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm transition-all hover:bg-gray-100 dark:bg-white/10 dark:hover:bg-white/20"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Back</span>
      </motion.button>

      <div className="fixed right-6 top-6 z-30">
        <ThemeToggle />
      </div>

      {/* Scrollable content: header + role grid scroll internally so the
          action bar below stays on screen. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </div>

      {/* Persistent action bar — toggle + Create Account stay on screen while
          the role grid scrolls behind them. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="relative z-20 border-t border-border/70 bg-white/85 shadow-[0_-10px_30px_-18px_rgba(20,24,31,0.2)] backdrop-blur-xl supports-backdrop-filter:bg-white/75 dark:bg-background/85"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <MultiRoleToggle enabled={canAddMoreRoles} onToggle={setCanAddMoreRoles} variant="bar" />
          <button
            onClick={handleContinue}
            disabled={signupData.selectedRoles.length === 0 || isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-5 w-5 rounded-full border-2 border-background border-t-transparent"
              />
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
