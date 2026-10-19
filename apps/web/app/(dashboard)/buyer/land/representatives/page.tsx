import { RepresentativesManager } from '@/components/land/representatives/RepresentativesManager';

export default function BuyerLandRepresentativesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your representatives</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Buying land from abroad? Appoint people you trust in Nigeria to follow your purchases,
          attend site visits and approve payments with you. Video and representatives never replace
          official searches.
        </p>
      </div>
      <RepresentativesManager />
    </div>
  );
}
