import { RepresentingDesk } from '@/components/land/representatives/RepresentingDesk';
import { PageHeader } from '@getrentos/ui';

export default function LandRepresentingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buyers I represent"
        description="People buying land who asked you to act for them. You can only do what each one allowed."
      />
      <RepresentingDesk />
    </div>
  );
}
