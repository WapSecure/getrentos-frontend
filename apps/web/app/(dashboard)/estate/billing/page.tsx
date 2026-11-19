'use client';

import { Button, Card } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { BillingPage } from '@/components/shared/subscription/BillingPage';
import { useEstatePlan } from '@/hooks/useEstatePlan';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { EstateProCard } from '@/components/estate/billing/EstateProCard';

export default function EstateBillingPage() {
  const { estate } = useSelectedEstate();
  const { tier } = useEstatePlan();

  return (
    <BillingPage
      persona="estate"
      description="See what's included on Free and what Pro unlocks for running your estate."
      planLabel={estate ? `${estate.name}'s plan` : "This estate's plan"}
      planTier={tier}
      planNote="Estate features follow this estate's own Estate Pro, or the plan of the person who set it up."
    >
      {estate && <EstateProCard estateId={estate.id} />}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-foreground">Enterprise for estates</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Adds the security suite: patrol rounds, dwell analytics, contractor passes, expected
          visitor lists and visitor ID checks, for several estates if you run more than one. It is
          priced per estate after a short call.
        </p>
        <Button variant="outline" className="mt-4" href={`${ROUTES.PRICING}#enterprise`}>
          Talk to us about Enterprise
        </Button>
      </Card>
    </BillingPage>
  );
}
