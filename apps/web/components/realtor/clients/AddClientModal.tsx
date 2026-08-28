'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserPlus, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Field, Input } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CheckState = 'idle' | 'checking' | 'eligible' | 'ineligible' | 'notfound' | 'error';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
  /** The raw invite-mutation error, so a verification 403 can render an actionable link. */
  submitError?: unknown;
}

export const AddClientModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitError = null,
}: AddClientModalProps) => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [checkedEmail, setCheckedEmail] = useState('');
  const [checkedName, setCheckedName] = useState<string | null>(null);

  const check = useMutation({
    mutationFn: (value: string) => unwrap(realtorService.checkClientEmail(value)),
    onSuccess: (result) => {
      setCheckedEmail(email);
      if (!result.exists) setCheckState('notfound');
      else if (result.isEligible) {
        setCheckState('eligible');
        setCheckedName(result.name);
      } else {
        setCheckState('ineligible');
      }
    },
    onError: () => setCheckState('error'),
  });

  const handleClose = () => {
    setEmail('');
    setLocalError(null);
    setCheckState('idle');
    setCheckedEmail('');
    setCheckedName(null);
    onClose();
  };

  const validateFormat = (value: string): string | null => {
    if (!value) return 'Enter the client’s email address.';
    if (!EMAIL_PATTERN.test(value)) {
      return 'Enter a valid email address, e.g. client@example.com.';
    }
    return null;
  };

  const runCheck = () => {
    const value = email.trim();
    const err = validateFormat(value);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    setCheckState('checking');
    check.mutate(value);
  };

  const emailChanged = email.trim() !== checkedEmail;
  const verifiedEligible = checkState === 'eligible' && !emailChanged;

  const checkError =
    checkState === 'ineligible'
      ? 'This account exists but is not registered as an owner or landlord.'
      : checkState === 'notfound'
        ? 'No GetRentos account was found for that email. Ask the client to create an account first.'
        : checkState === 'error'
          ? 'We couldn’t verify that email. Please try again.'
          : null;

  const shownError = localError ?? checkError ?? error;

  const handlePrimary = () => {
    if (!verifiedEligible) {
      runCheck();
      return;
    }
    onSubmit(email.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Add Client</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add an owner or landlord by their GetRentos account email
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <VerificationRequiredNotice
                error={submitError}
                href={`${ROUTES.REALTOR_SETTINGS}?tab=verification`}
              />
              <Field
                label="Email"
                htmlFor="realtor-client-email"
                required
                error={shownError ?? undefined}
              >
                <Input
                  id="realtor-client-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="client@example.com"
                  leadingIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => {
                    const next = e.target.value;
                    setEmail(next);
                    if (localError) setLocalError(null);
                    if (next.trim() !== checkedEmail) setCheckState('idle');
                  }}
                  onBlur={() => {
                    if (email.trim() !== checkedEmail && email.trim()) runCheck();
                  }}
                  disabled={isSubmitting || check.isPending}
                />
              </Field>

              {checkState === 'checking' ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Checking account…
                </div>
              ) : verifiedEligible ? (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 px-3 py-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  <div className="text-xs">
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Verified as an owner or landlord
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {checkedName || email} is ready to receive an invitation.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter the client’s email and we’ll verify their account before sending an
                  invitation. They must be registered as an owner or landlord on GetRentos.
                </p>
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting || check.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="gap-1.5"
                onClick={handlePrimary}
                isLoading={isSubmitting || check.isPending}
                disabled={!email.trim()}
              >
                {verifiedEligible ? (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Send Invitation
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verify & Send Invitation
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
