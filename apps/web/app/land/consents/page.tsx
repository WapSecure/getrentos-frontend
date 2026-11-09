import { ConsentRequestList } from '@/components/land/authority/ConsentRequestList';
import { PageHeader } from '@sureground/ui';

export default function LandConsentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Land sale consents"
        description="Sellers who named you as someone whose consent their land sale needs. Consent only if you agree to the sale. If you object, the sale is paused and Sureground looks into it."
      />
      <ConsentRequestList />
    </div>
  );
}
