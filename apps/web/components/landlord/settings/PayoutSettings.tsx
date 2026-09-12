'use client';

import { useState, useEffect } from 'react';
import { Landmark, CheckCircle2 } from 'lucide-react';
import { SaveButton } from '@getrentos/ui';
import { landlordService } from '@/services/landlordService';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';

export const PayoutSettings = () => {
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [savedBankName, setSavedBankName] = useState('');
  const [savedAccountNumber, setSavedAccountNumber] = useState('');
  const [savedAccountName, setSavedAccountName] = useState('');
  const [verified, setVerified] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);

  useEffect(() => {
    const fetchPayoutAccount = async () => {
      const response = await landlordService.getPayoutAccount();
      if (response.success && response.data) {
        setSavedBankName(response.data.bankName);
        setSavedAccountNumber(response.data.accountNumber);
        setSavedAccountName(response.data.accountName);
        setVerified(response.data.verified);
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
        Where escrow-released rent payments are sent — transfers run through Paystack.
      </p>

      {savedAccountNumber && (
        <div className="rounded-lg border border-border p-3 mb-6">
          <p className="text-sm font-medium text-foreground">
            {savedBankName} · {savedAccountNumber} · {savedAccountName}
          </p>
          {verified ? (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400">
                Bank account verified and active for payouts
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Not yet verified — save it again to resolve it against your bank.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            To change it, enter new details below and save.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bank Code</label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              placeholder="e.g. 058 for GTBank"
              maxLength={6}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="0123456789"
            maxLength={10}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
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
