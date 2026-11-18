'use client';

import { Button, Card } from '@sureground/ui';
import { BillingPage } from '@/components/shared/subscription/BillingPage';
import { useEstatePlan } from '@/hooks/useEstatePlan';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';

const SALES_EMAIL = 'hello@getsureground.io';

export default function EstateBillingPage() {
  const { estate } = useSelectedEstate();
  const { tier } = useEstatePlan();

  return (
    <BillingPage
      persona="estate"
      description="See what's included on Free and what Pro unlocks for running your estate."
      planLabel={estate ? `${estate.name}'s plan` : "This estate's plan"}
      planTier={tier}
      planNote="Estate features follow the plan of the person who set up the estate."
    >
      <Card className="p-6">
        <h2 className="text-base font-semibold text-foreground">Enterprise for estates</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Adds the security suite: patrol rounds, dwell analytics, contractor passes, expected
          visitor lists and visitor ID checks, for several estates if you run more than one. It is
          priced per estate after a short call.
        </p>
        <p className="mt-3 text-sm text-foreground">
          Email <span className="select-all font-medium">{SALES_EMAIL}</span> to arrange it.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          href={`mailto:${SALES_EMAIL}?subject=Enterprise%20for%20our%20estate`}
        >
          Email us about Enterprise
        </Button>
      </Card>
    </BillingPage>
  );
}
