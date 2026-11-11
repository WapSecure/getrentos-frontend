import { HostTours } from '@/components/shared/tours/HostTours';
import { OwnerSellingNav } from '@/components/shared/navigation/WorkflowNavs';
import { PageHeader } from '@sureground/ui';

export default function OwnerToursPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Video tour requests"
        description="Buyers who cannot visit ask you to show them round on a video call. Offer times in daylight, join on time, and note what you showed."
      />
      <OwnerSellingNav />
      <HostTours scope="all" />
    </div>
  );
}
