import { BuyerInspections } from '@/components/shared/inspections/BuyerInspections';
import { ArrowRight } from '@sureground/icons';
import { Button, PageHeader } from '@sureground/ui';
import { findPropertyHref } from '@/lib/constants/visitRoutes';

export default function BuyerLandInspectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Buying"
        title="Independent inspections"
        description="An accredited inspector visits land you are considering and reports with geotagged, timestamped photos. Sureground checks each report before you see it."
        actions={
          <Button
            href={findPropertyHref('land')}
            icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            iconPosition="right"
          >
            Find a property to inspect
          </Button>
        }
      />
      <BuyerInspections scope="land" />
    </div>
  );
}
