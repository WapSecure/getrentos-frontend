import { BuyerTours } from '@/components/shared/tours/BuyerTours';
import { PageHeader } from '@sureground/ui';

export default function BuyerToursPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Video tours"
        description="See a home or land without travelling. The seller walks you round on a video call, at a time shown in your own time zone. A tour is never a search, a survey or an inspection."
      />
      <BuyerTours scope="all" />
    </div>
  );
}
