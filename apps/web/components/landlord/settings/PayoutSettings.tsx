'use client';

import { useState, useEffect } from 'react';
import { Landmark, CheckCircle2 } from 'lucide-react';
import { SaveButton } from '@/components/ui/SaveButton';
import { landlordService } from '@/services/landlordService';

export const PayoutSettings = () => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const fetchPayoutAccount = async () => {
      const response = await landlordService.getPayoutAccount();
      if (response.success && response.data) {
        setBankName(response.data.bankName);
        setAccountNumber(response.data.accountNumber);
        setAccountName(response.data.accountName);
        setVerified(response.data.verified);
      }
    };

    fetchPayoutAccount();
  }, []);

  const handleSave = async () => {
    const response = await landlordService.updatePayoutAccount({
      bankName,
      accountNumber,
      accountName,
    });
    if (response.success && response.data) {
      setVerified(response.data.verified);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Payout Account</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Where escrow-released rent payments are sent
      </p>

      {verified && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-6">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-400">
            Bank account verified and active for payouts
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bank Name</label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Account Name</label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <SaveButton label="Update Payout Account" className="mt-6" onClick={handleSave} />
    </div>
  );
};
