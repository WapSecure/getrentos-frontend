import { HostTours } from '@/components/shared/tours/HostTours';
import { OwnerSellingNav } from '@/components/shared/navigation/WorkflowNavs';
import { Button, PageHeader } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

export default function OwnerToursPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Selling"
        title="Video tour requests"
        description="Buyers who cannot visit ask you to show them round on a video call. Offer times in daylight, join on time, and note what you showed."
        actions={
          <Button href={ROUTES.OWNER_LISTINGS} variant="outline">
            Your listings
          </Button>
        }
      />
      <OwnerSellingNav />
      <HostTours scope="all" />
    </div>
  );
}
