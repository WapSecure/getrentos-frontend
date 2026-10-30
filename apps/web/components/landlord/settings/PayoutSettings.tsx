'use client';

import { useState, useEffect } from 'react';
import { Landmark, CheckCircle2 } from 'lucide-react';
import { Card, Field, NumberInput, SaveButton } from '@getrentos/ui';
import { landlordService } from '@/services/landlordService';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';
import {
  PAYOUT_CHANGE_COOLDOWN_HINT,
  PayoutHoldNotice,
} from '@/components/shared/payouts/PayoutHoldNotice';

export const PayoutSettings = () => {
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [savedBankName, setSavedBankName] = useState('');
  const [savedAccountNumber, setSavedAccountNumber] = useState('');
  const [savedAccountName, setSavedAccountName] = useState('');
  const [verified, setVerified] = useState(false);
  const [holdUntil, setHoldUntil] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);

  useEffect(() => {
    const fetchPayoutAccount = async () => {
      const response = await landlordService.getPayoutAccount();
      if (response.success && response.data) {
        setSavedBankName(response.data.bankName);
        setSavedAccountNumber(response.data.accountNumber);
        setSavedAccountName(response.data.accountName);
        setVerified(response.data.verified);
        setHoldUntil(response.data.payoutHoldUntil ?? null);
      }
    };

    fetchPayoutAccount();
  }, []);

  const canSave = bankCode.trim().length >= 3 && accountNumber.trim().length === 10;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitError(null);
    const response = await landlordService.updatePayoutAccount({ bankCode, accountNumber });
    if (response.success && response.data) {
      setSavedBankName(response.data.bankName);
      setSavedAccountNumber(response.data.accountNumber);
      setSavedAccountName(response.data.accountName);
      setVerified(response.data.verified);
      setHoldUntil(response.data.payoutHoldUntil ?? null);
      setBankCode('');
      setAccountNumber('');
    } else {
      setSubmitError(response);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Payout Account</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Where rent released by GetRentos Payment Protection is sent: transfers run through Paystack.
      </p>

      {savedAccountNumber && (
        <Card className="p-3 mb-6">
          <p className="text-sm font-medium text-foreground">
            {savedBankName} · {savedAccountNumber} · {savedAccountName}
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
        <Field label="Bank Code">
          <NumberInput
            value={bankCode}
            onValueChange={setBankCode}
            placeholder="e.g. 058 for GTBank"
            maxLength={6}
            leadingIcon={<Landmark className="w-4 h-4" />}
          />
        </Field>
        <Field label="Account Number">
          <NumberInput
            value={accountNumber}
            onValueChange={setAccountNumber}
            placeholder="0123456789"
            maxLength={10}
          />
        </Field>
      </div>

      <div className="mt-6 space-y-3">
        <VerificationRequiredNotice
          error={submitError}
          href={ROUTES.LANDLORD_SETTINGS}
          verificationHref={ROUTES.LANDLORD_VERIFICATION}
        />
        <SaveButton label="Update Payout Account" onClick={handleSave} />
      </div>
    </div>
  );
};
