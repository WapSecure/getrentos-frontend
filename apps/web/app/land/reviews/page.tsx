import Link from 'next/link';
import { ReviewSeatList } from '@/components/land/reviews/ReviewSeatList';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { PageHeader } from '@sureground/ui';

export default function LandReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My land reviews"
        description="Cases Sureground has engaged you on. Decide each check assigned to you, then file your report."
        meta={
          <Link
            href={LAND_BUYER_ROUTES.ACCREDITATION}
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Your accreditation
          </Link>
        }
      />
      <ReviewSeatList />
    </div>
  );
}
