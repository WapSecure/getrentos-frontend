import { ReviewSeatList } from '@/components/land/reviews/ReviewSeatList';

export default function LandReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My land reviews</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Cases GetRentos has engaged you on. Decide each check assigned to you, then file your
          report.
        </p>
      </div>
      <ReviewSeatList />
    </div>
  );
}
