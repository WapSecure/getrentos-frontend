'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MessageCircle, Handshake, Clock } from 'lucide-react';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { getInitials, formatDate } from '@/lib/format';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

interface ClientReview {
  id: string;
  reviewerName: string;
  reviewerRole: 'Client' | 'Buyer' | 'Renter';
  listingTitle: string;
  rating: number;
  communication: number;
  negotiation: number;
  responsiveness: number;
  comment: string;
  createdAt: string;
}

const mockReviews: ClientReview[] = [
  {
    id: 'rev_001',
    reviewerName: 'Adaeze Okafor',
    reviewerRole: 'Client',
    listingTitle: 'Ocean View Towers',
    rating: 5,
    communication: 5,
    negotiation: 5,
    responsiveness: 5,
    comment: 'Excellent realtor — marketed the property well and kept me updated at every step.',
    createdAt: '2026-07-05T00:00:00.000Z',
  },
  {
    id: 'rev_002',
    reviewerName: 'Tobi Fashola',
    reviewerRole: 'Buyer',
    listingTitle: 'Surulere Family Duplex',
    rating: 4,
    communication: 5,
    negotiation: 4,
    responsiveness: 4,
    comment: 'Helped negotiate a fair price and made the closing process smooth.',
    createdAt: '2026-06-20T00:00:00.000Z',
  },
];

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? 'fill-[#c4a747] text-[#c4a747]' : 'text-gray-200 dark:text-gray-700'}`}
      />
    ))}
  </div>
);

export default function RealtorReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ClientReview[]>([]);

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
        if (parsedUser.role && parsedUser.role !== 'realtor') {
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

  const avg = (
    key: keyof Pick<ClientReview, 'rating' | 'communication' | 'negotiation' | 'responsiveness'>
  ) => (reviews.length ? reviews.reduce((sum, r) => sum + r[key], 0) / reviews.length : 0);

  const overallRating = avg('rating');
  const categories = [
    { label: 'Communication', icon: MessageCircle, value: avg('communication') },
    { label: 'Negotiation Skill', icon: Handshake, value: avg('negotiation') },
    { label: 'Responsiveness', icon: Clock, value: avg('responsiveness') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RealtorNavbar user={user} />

      <div className="flex">
        <RealtorSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reviews & Reputation
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                See how clients and leads rate their experience with you
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-6 flex flex-col items-center justify-center text-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {overallRating.toFixed(1)}
                </p>
                <StarRow rating={Math.round(overallRating)} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="lg:col-span-2 bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
                {categories.map((category) => (
                  <div key={category.label} className="flex items-center gap-3">
                    <category.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 w-36 flex-shrink-0">
                      {category.label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#c4a747]"
                        style={{ width: `${(category.value / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                      {category.value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-xs flex-shrink-0">
                        {getInitials(review.reviewerName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {review.reviewerName}{' '}
                          <span className="text-xs text-gray-400 font-normal">
                            · {review.reviewerRole}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {review.listingTitle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <StarRow rating={review.rating} />
                      <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
