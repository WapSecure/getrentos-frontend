'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UserPlus, Mail, CheckCircle2 } from '@sureground/icons';
import { isNoAccountMessage, readContactInput } from '@sureground/shared';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import {
  VerificationRequiredNotice,
  isVerificationGateError,
} from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';
import { InviteToSignUp } from '@/components/shared/representatives/InviteToSignUp';

type CheckState = 'idle' | 'checking' | 'eligible' | 'ineligible' | 'notfound' | 'error';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The client's phone number or email, as typed. */
  onSubmit: (contact: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
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
      setCheckedEmail(email.trim());
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
    const input = readContactInput(value);
    if (input.kind === 'empty') return 'Enter the client’s phone number or email.';
    return input.kind === 'invalid' ? input.message : null;
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
      : checkState === 'error'
        ? 'We couldn’t check that phone number or email. Please try again.'
        : null;
  const noAccount = (checkState === 'notfound' && !emailChanged) || isNoAccountMessage(error);

  const shownError = localError ?? checkError ?? (isNoAccountMessage(error) ? null : error);

  const handlePrimary = () => {
    if (!verifiedEligible) {
      runCheck();
      return;
    }
    onSubmit(email.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size={noAccount ? 'lg' : 'md'} className="p-0 sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Add client</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Add an owner or landlord by the phone number or email on their Sureground account
          </DialogDescription>
        </div>

        <div className="p-4 space-y-4">
          <VerificationRequiredNotice error={submitError} href={ROUTES.REALTOR_VERIFICATION} />
          <Field
            label="Phone number or email"
            htmlFor="realtor-client-email"
            required
            error={shownError ?? undefined}
          >
            <Input
              id="realtor-client-email"
              type="text"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="0803 123 4567 or client@example.com"
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
          ) : noAccount ? (
            <InviteToSignUp
              message="Nobody on Sureground uses that phone number or email yet. Send them the signup link; they should sign up as an owner or landlord."
              reason="represent your properties"
              footnote="Once they have signed up, add them here with the same phone number or email."
            />
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the client’s phone number or email and we’ll check their account before sending
              an invitation. They must be registered as an owner or landlord on Sureground, and they
              get the invitation in their app.
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
            {verifiedEligible ? 'Send invitation' : 'Verify & send invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
