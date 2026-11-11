import { ArrowRight } from '@sureground/icons';
import { BuyerTours } from '@/components/shared/tours/BuyerTours';
import { findPropertyHref } from '@/lib/constants/visitRoutes';
import { Button, PageHeader } from '@sureground/ui';

export default function BuyerLandToursPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Live video tours"
        description="See land without travelling. The seller walks you round on a video call, at a time shown in your own time zone. A tour is never a search or a survey."
        actions={
          <Button
            href={findPropertyHref('land')}
            icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            iconPosition="right"
          >
            Book a video tour
          </Button>
        }
      />
      <BuyerTours scope="land" />
    </div>
  );
}
