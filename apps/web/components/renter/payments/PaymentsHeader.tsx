'use client';

import { CreditCard, Download, Shield } from 'lucide-react';
import { Button } from '@sureground/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface PaymentsHeaderProps {
  /** Export the payment history. Absent on tabs that are not the history. */
  onExport?: () => void;
}

/** The pay action lives once, in the summary under the header, not here as well. */
export const PaymentsHeader = ({ onExport }: PaymentsHeaderProps) => {
  return (
    <div>
      <RenterPageHeader
        eyebrow=""
        icon={CreditCard}
        title="Payments"
        description="Manage rent, payment methods, receipts, and your complete payment history."
        actions={
          <>
            {onExport && (
              <Button variant="outline" className="gap-2" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Export
              </Button>
            )}
          </>
        }
      >
        <div className="flex max-w-3xl items-start gap-2 text-sm text-muted-foreground">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <p>
            Sureground Payment Protection: on a new lease, your first rent is held until you confirm
            move-in. Other payments are released to your landlord on the release date shown with
            each payment.
          </p>
        </div>
      </RenterPageHeader>
    </div>
  );
};
