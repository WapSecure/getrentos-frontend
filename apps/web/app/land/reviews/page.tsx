import Link from 'next/link';
import { ReviewSeatList } from '@/components/land/reviews/ReviewSeatList';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';

export default function LandReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My land reviews</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Cases GetRentos has engaged you on. Decide each check assigned to you, then file your
          report.
        </p>
        <Link
          href={LAND_BUYER_ROUTES.ACCREDITATION}
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          Your accreditation
        </Link>
      </div>
      <ReviewSeatList />
    </div>
  );
}
