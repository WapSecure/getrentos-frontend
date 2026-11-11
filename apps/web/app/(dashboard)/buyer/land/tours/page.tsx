import { BuyerTours } from '@/components/shared/tours/BuyerTours';
import { PageHeader } from '@sureground/ui';

export default function BuyerLandToursPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Live video tours"
        description="See land without travelling. The seller walks you round on a video call, at a time shown in your own time zone. A tour is never a search or a survey."
      />
      <BuyerTours scope="land" />
    </div>
  );
}
