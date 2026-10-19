import { HostTours } from '@/components/land/tours/HostTours';

export default function OwnerLandToursPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Video tour requests</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Buyers who cannot visit ask you to walk them round the land on a video call. Offer times
          in daylight, join on time, and record what you showed.
        </p>
      </div>
      <HostTours />
    </div>
  );
}
