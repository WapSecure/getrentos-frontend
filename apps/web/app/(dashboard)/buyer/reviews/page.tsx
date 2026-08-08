'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, PenLine } from 'lucide-react';
import { BuyerNavbar } from '@/components/buyer/navigation/BuyerNavbar';
import { BuyerSidebar } from '@/components/buyer/dashboard/BuyerSidebar';
import { Button } from '@/components/ui/Button';
import { getInitials, formatDate } from '@/lib/format';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

interface GivenReview {
  id: string;
  ownerName: string;
  propertyTitle: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const mockReviews: GivenReview[] = [
  {
    id: 'rev_001',
    ownerName: 'Tobi Fashola',
    propertyTitle: 'Surulere Family Duplex',
    rating: 5,
    comment:
      'Smooth transaction from start to finish. Honest pricing and quick to respond to every question.',
    createdAt: '2026-06-18T00:00:00.000Z',
  },
];

const StarRow = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'} ${i < rating ? 'fill-[#c4a747] text-[#c4a747]' : 'text-gray-200 dark:text-gray-700'}`}
      />
    ))}
  </div>
);

export default function BuyerReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<GivenReview[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'buyer') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setReviews(mockReviews);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <BuyerNavbar user={user} />

      <div className="flex">
        <BuyerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Reviews you&apos;ve left for property owners
              </p>
            </div>

            <div className="mb-6 bg-[#c4a747]/5 border border-[#c4a747]/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#c4a747]/10">
                  <PenLine className="w-5 h-5 text-[#c4a747]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Recently completed a purchase?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave a review to help other buyers on GetRentos.
                  </p>
                </div>
              </div>
              <Button href="/buyer/transactions" variant="outline" size="sm">
                View Transactions
              </Button>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <Star className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  You haven&apos;t left any reviews yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-xs flex-shrink-0">
                          {getInitials(review.ownerName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {review.ownerName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {review.propertyTitle}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <StarRow rating={review.rating} />
                        <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
