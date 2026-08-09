'use client';

import { useState } from 'react';
import { Star, MessageCircle, Home, Clock } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/format';

interface TenantReview {
  id: string;
  tenantName: string;
  propertyName: string;
  rating: number;
  communication: number;
  propertyCondition: number;
  responsiveness: number;
  comment: string;
  createdAt: string;
}

const mockReviews: TenantReview[] = [
  {
    id: 'rev_001',
    tenantName: 'Ifeoma Bello',
    propertyName: 'Palm Court Residences',
    rating: 5,
    communication: 5,
    propertyCondition: 5,
    responsiveness: 4,
    comment: 'Very responsive landlord, always fixes issues quickly and communicates clearly.',
    createdAt: '2026-07-20T00:00:00.000Z',
  },
  {
    id: 'rev_002',
    tenantName: 'Ngozi Eze',
    propertyName: 'Modern Downtown Loft',
    rating: 5,
    communication: 5,
    propertyCondition: 4,
    responsiveness: 5,
    comment: 'Great experience overall. The property was well maintained when I moved in.',
    createdAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'rev_003',
    tenantName: 'Tunde Bakare',
    propertyName: 'Sunrise Apartments',
    rating: 4,
    communication: 4,
    propertyCondition: 4,
    responsiveness: 3,
    comment: 'Good landlord, though maintenance requests sometimes take a couple of days.',
    createdAt: '2026-05-02T00:00:00.000Z',
  },
];

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? 'fill-primary text-primary' : 'text-gray-200 dark:text-gray-700'}`}
      />
    ))}
  </div>
);

export default function LandlordReviewsPage() {
  const [reviews, setReviews] = useState<TenantReview[]>(mockReviews);

  const avg = (
    key: keyof Pick<
      TenantReview,
      'rating' | 'communication' | 'propertyCondition' | 'responsiveness'
    >
  ) => (reviews.length ? reviews.reduce((sum, r) => sum + r[key], 0) / reviews.length : 0);

  const overallRating = avg('rating');
  const categories = [
    { label: 'Communication', icon: MessageCircle, value: avg('communication') },
    { label: 'Property Condition', icon: Home, value: avg('propertyCondition') },
    { label: 'Responsiveness', icon: Clock, value: avg('responsiveness') },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews & Reputation</h1>
        <p className="text-muted-foreground mt-1">See how tenants rate their experience with you</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-bold text-foreground">{overallRating.toFixed(1)}</p>
          <StarRow rating={Math.round(overallRating)} />
          <p className="text-xs text-muted-foreground mt-2">
            Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 space-y-4">
          {categories.map((category) => (
            <div key={category.label} className="flex items-center gap-3">
              <category.icon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-muted-foreground w-36 shrink-0">{category.label}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(category.value / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground w-8 text-right">
                {category.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                  {getInitials(review.tenantName)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{review.tenantName}</p>
                  <p className="text-xs text-muted-foreground">{review.propertyName}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <StarRow rating={review.rating} />
                <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>
          </div>
        ))}
      </div>
    </>
  );
}
