import { apiFetch } from './client';
import type { Paginated } from './properties';

export const REVIEW_CATEGORIES = ['LANDLORD', 'PROPERTY'] as const;
export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export const REVIEW_CATEGORY_LABEL: Record<ReviewCategory, string> = {
  LANDLORD: 'Landlord',
  PROPERTY: 'Property',
};

/** A tenancy that has ended and is still open for the renter to review. */
export interface PendingReview {
  id: string;
  leaseId: string;
  category: ReviewCategory;
  propertyId?: string;
  property?: string;
  landlord?: string;
  moveOutDate: string;
  /** Lowercase mirror of `category`, as the API sends it. */
  type: 'landlord' | 'property';
}

export interface Review {
  id: string;
  rating: number;
  category: string;
  comment?: string;
  reviewerName?: string;
  propertyTitle?: string;
  createdAt: string;
}

export interface SubmitReviewInput {
  leaseId: string;
  category: ReviewCategory;
  rating: number;
  comment?: string;
}

export const reviewsApi = {
  /** Tenancies the renter can still write a review for. */
  pending: () => apiFetch<PendingReview[]>('/renter/reviews/pending'),

  /** Reviews this renter has written. */
  submitted: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<Review>>(`/renter/reviews/submitted?page=${page}&pageSize=${pageSize}`),

  /** Reviews landlords and agents have written about this renter. */
  received: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<Review>>(`/renter/reviews?page=${page}&pageSize=${pageSize}`),

  submit: (input: SubmitReviewInput) =>
    apiFetch<Review>('/renter/reviews', { method: 'POST', body: input }),
};
