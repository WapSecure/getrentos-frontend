import { PageHeader } from '@sureground/ui';
import { RenterReviews } from '@/components/renter/dashboard/RenterReviews';
import { RenterReviewsAboutYou } from '@/components/renter/reviews/RenterReviewsAboutYou';

export default function RenterReviewsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reputation"
        title="Reviews"
        description="Rate the homes you have rented, and see what landlords say about you"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <RenterReviews />
        <RenterReviewsAboutYou />
      </div>
    </>
  );
}
