import { RepresentativesManager } from '@/components/land/representatives/RepresentativesManager';
import { PageHeader } from '@getrentos/ui';

export default function BuyerLandRepresentativesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Your representatives"
        description="Buying land from abroad? Appoint people you trust in Nigeria to follow your purchases, attend site visits and approve payments with you. Video and representatives never replace official searches."
      />
      <RepresentativesManager />
    </div>
  );
}
