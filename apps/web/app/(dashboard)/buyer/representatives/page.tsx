import { RepresentativesManager } from '@/components/shared/representatives/RepresentativesManager';
import { PageHeader } from '@sureground/ui';

export default function BuyerRepresentativesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Buying"
        title="Your representatives"
        description="Buying from abroad? Appoint people you trust in Nigeria to follow your purchases, attend visits and approve the release of a deposit with you. Video and representatives never replace official searches."
      />
      <RepresentativesManager />
    </div>
  );
}
