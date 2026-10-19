import { BuyerTours } from '@/components/land/tours/BuyerTours';

export default function BuyerLandToursPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live video tours</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          See land without travelling. The seller walks you round on a video call, at a time shown
          in your own time zone. A tour is never a search or a survey.
        </p>
      </div>
      <BuyerTours />
    </div>
  );
}
