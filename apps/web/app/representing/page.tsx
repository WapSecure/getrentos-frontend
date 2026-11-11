import { RepresentingDesk } from '@/components/shared/representatives/RepresentingDesk';
import { PageHeader } from '@sureground/ui';

export default function RepresentingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buyers I represent"
        description="People buying property who asked you to act for them. You can only do what each one allowed."
      />
      <RepresentingDesk />
    </div>
  );
}
