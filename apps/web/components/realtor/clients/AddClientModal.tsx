'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UserPlus, Mail, CheckCircle2 } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import {
  VerificationRequiredNotice,
  isVerificationGateError,
} from '@/components/shared/verification/VerificationRequiredNotice';
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-0 sm:max-w-sm sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Add Client</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Add an owner or landlord by their GetRentos account email
          </DialogDescription>
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
            <p role="status" className="text-xs text-muted-foreground">
              Checking account…
            </p>
          ) : verifiedEligible && !isVerificationGateError(submitError) ? (
            <Alert variant="success" title="Verified as an owner or landlord">
              {checkedName || email} is ready to receive an invitation.
            </Alert>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the client’s email and we’ll verify their account before sending an invitation.
              They must be registered as an owner or landlord on GetRentos.
            </p>
          )}
        </div>

        <div className="p-4 border-t border-border flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting || check.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={
              verifiedEligible ? (
                <UserPlus className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )
            }
            onClick={handlePrimary}
            isLoading={isSubmitting || check.isPending}
            disabled={!email.trim()}
          >
            {verifiedEligible ? 'Send Invitation' : 'Verify & Send Invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
