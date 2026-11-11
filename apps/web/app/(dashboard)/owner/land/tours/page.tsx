import { HostTours } from '@/components/shared/tours/HostTours';
import { Button, PageHeader } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

export default function OwnerLandToursPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Video tour requests"
        description="Buyers who cannot visit ask you to walk them round the land on a video call. Offer times in daylight, join on time, and record what you showed."
        actions={
          <Button href={ROUTES.OWNER_LAND} variant="outline">
            Your land
          </Button>
        }
      />
      <HostTours scope="land" />
    </div>
  );
}
