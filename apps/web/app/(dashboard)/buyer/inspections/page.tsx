import { BuyerInspections } from '@/components/shared/inspections/BuyerInspections';
import { ArrowRight } from '@sureground/icons';
import { Button, PageHeader } from '@sureground/ui';
import { findPropertyHref } from '@/lib/constants/visitRoutes';

export default function BuyerInspectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Independent inspections"
        description="An accredited inspector visits a home or land you are considering and reports with geotagged, timestamped photos. Sureground checks each report before you see it."
        actions={
          <Button
            href={findPropertyHref('all')}
            icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            iconPosition="right"
          >
            Find a property to inspect
          </Button>
        }
      />
      <BuyerInspections scope="all" />
    </div>
  );
}
