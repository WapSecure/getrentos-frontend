'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2 } from '@sureground/icons';
import { Alert, Button, Card, SaveButton, useToast } from '@sureground/ui';
import { landlordService } from '@/services/landlordService';
import {
  VerificationRequiredNotice,
  isVerificationGateError,
} from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';
import {
  PAYOUT_CHANGE_COOLDOWN_HINT,
  PayoutHoldNotice,
} from '@/components/shared/payouts/PayoutHoldNotice';
import { BankAccountFields } from '@/components/shared/payouts/BankAccountFields';
import { PayoutDestinationSettings } from '@/components/shared/payouts/PayoutDestinationSettings';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  lookupAllowsSave,
  payoutAccountLabel,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  withStepUpSummary,
  type AccountLookup,
} from '@sureground/shared';

export const PayoutSettings = () => {
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  const [savedBankName, setSavedBankName] = useState('');
  const [savedAccountNumber, setSavedAccountNumber] = useState('');
  const [savedAccountName, setSavedAccountName] = useState('');
  const [verified, setVerified] = useState(false);
  const [holdUntil, setHoldUntil] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloads, setReloads] = useState(0);
  const toast = useToast();

  useEffect(() => {
    const fetchPayoutAccount = async () => {
      const response = await landlordService.getPayoutAccount();
      // No account yet comes back as success without data: only a failed call is a load error.
      setLoadFailed(!response.success);
      if (response.success && response.data) {
        setSavedBankName(response.data.bankName);
        setSavedAccountNumber(response.data.accountNumber);
        setSavedAccountName(response.data.accountName);
        setVerified(response.data.verified);
        setHoldUntil(response.data.payoutHoldUntil ?? null);
      }
    };

    fetchPayoutAccount();
  }, [reloads]);

  const canSave = lookupAllowsSave(lookup);

  const handleSave = async (): Promise<boolean> => {
    if (!canSave) return false;
    setSubmitError(null);
    const response = await withStepUpSummary(
      payoutAccountStepUpSummary({
        bankName: lookup.bankName,
        accountNumber,
        accountName: lookup.accountName,
      }),
      () => landlordService.updatePayoutAccount({ bankCode, accountNumber })
    );
    if (response.success && response.data) {
      setSavedBankName(response.data.bankName);
      setSavedAccountNumber(response.data.accountNumber);
      setSavedAccountName(response.data.accountName);
      setVerified(response.data.verified);
      setHoldUntil(response.data.payoutHoldUntil ?? null);
      setBankCode('');
      setAccountNumber('');
      toast.success(`Rent now pays out to ${response.data.accountName || 'your new account'}.`);
      return true;
    }
    setSubmitError(response);
    return false;
  };
  const saveFailedMessage =
    submitError && !isVerificationGateError(submitError)
      ? ((submitError as { error?: string }).error ??
        'Your payout account wasn’t saved. Please try again.')
      : null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Payout account</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Where rent released by Sureground Payment Protection is sent: transfers run through
        Paystack.
      </p>

      {loadFailed && (
        <Alert
          variant="danger"
          className="mb-6"
          action={
            <Button variant="outline" size="sm" onClick={() => setReloads((n) => n + 1)}>
              Try again
            </Button>
          }
        >
          We couldn’t load your payout account, so we can’t show where rent is paid out to.
        </Alert>
      )}

      {savedAccountNumber && (
        <Card className="p-3 mb-6">
          <p className="text-sm font-medium text-foreground">
            {payoutAccountLabel({ bankName: savedBankName, accountNumber: savedAccountNumber })} ·{' '}
            {savedAccountName}
          </p>
          {verified ? (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <p className="text-xs text-success">
                {holdUntil
                  ? 'Bank account verified'
                  : 'Bank account verified and active for payouts'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Not yet verified: save it again to resolve it against your bank.
            </p>
          )}
          <PayoutHoldNotice holdUntil={holdUntil} />
          <p className="mt-2 text-xs text-muted-foreground">
            To change it, enter new details below and save. {PAYOUT_CHANGE_COOLDOWN_HINT}
          </p>
        </Card>
      )}

      <div className="space-y-4">
        <BankAccountFields
          idPrefix="landlord-payout"
          bankCode={bankCode}
          onBankCode={setBankCode}
          accountNumber={accountNumber}
          onAccountNumber={setAccountNumber}
          onLookup={setLookup}
        />
      </div>

      <div className="mt-6 space-y-3">
        <VerificationRequiredNotice
          error={submitError}
          href={ROUTES.LANDLORD_SETTINGS}
          verificationHref={ROUTES.LANDLORD_VERIFICATION}
        />
        {saveFailedMessage && <Alert variant="danger">{saveFailedMessage}</Alert>}
        <SaveButton
          label={saveAccountLabel(
            lookup,
            savedAccountNumber ? 'Update payout account' : 'Save payout account'
          )}
          onClick={handleSave}
          disabled={!canSave}
        />
      </div>

      <PayoutDestinationSettings />
    </div>
  );
};
