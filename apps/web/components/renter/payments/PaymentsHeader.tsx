'use client';

import { CreditCard, Plus, Download, Shield } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface PaymentsHeaderProps {
  onExport: () => void;
  /** Open the pay dialog for the oldest open charge. Absent when nothing is owed. */
  onPayOldest?: () => void;
}

export const PaymentsHeader = ({ onExport, onPayOldest }: PaymentsHeaderProps) => {
  return (
    <div>
      <RenterPageHeader
        eyebrow=""
        icon={CreditCard}
        title="Payments"
        description="Manage rent, payment methods, receipts, and your complete payment history."
        actions={
          <>
            <Button variant="outline" className="gap-2" size="sm" onClick={onExport}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>
            {onPayOldest && (
              <Button variant="primary" className="gap-2" size="sm" onClick={onPayOldest}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Pay oldest charge
              </Button>
            )}
          </>
        }
      >
        <div className="flex max-w-3xl items-start gap-2 text-sm text-muted-foreground">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <p>
            Rent paid through GetRentos is held until you confirm move-in, then released according
            to the payment-protection terms.
          </p>
        </div>
      </RenterPageHeader>
    </div>
  );
};
