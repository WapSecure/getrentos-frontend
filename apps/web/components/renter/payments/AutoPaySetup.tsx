'use client';

import { Repeat } from 'lucide-react';
import { Badge, Card } from '@getrentos/ui';

/**
 * AutoPay is not offered yet: there is no saved-card schedule behind it, so this
 * card must not let a renter "activate" anything. It says so plainly and points
 * to the way rent is actually paid today.
 */
export const AutoPaySetup = () => (
  <Card>
    <div className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="font-semibold text-foreground">AutoPay</h3>
        </div>
        <Badge variant="neutral">Not available yet</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Automatic rent payments aren&apos;t available yet, so nothing will be charged for you. Pay
        each charge from your payment list when it&apos;s due.
      </p>
    </div>
  </Card>
);
