import { HostTours } from '@/components/land/tours/HostTours';
import { PageHeader } from '@getrentos/ui';

export default function OwnerLandToursPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Video tour requests"
        description="Buyers who cannot visit ask you to walk them round the land on a video call. Offer times in daylight, join on time, and record what you showed."
      />
      <HostTours />
    </div>
  );
}
