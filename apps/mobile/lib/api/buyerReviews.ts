import { apiFetch } from './client';
import type { Paginated } from './buyer';

export interface BuyerReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment?: string;
  category?: string;
}

export const buyerReviewsApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<BuyerReview>>(`/buyer/reviews?page=${page}&pageSize=${pageSize}`),
};
