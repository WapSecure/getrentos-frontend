import { apiFetch } from './client';
import type { Paginated } from './properties';

export interface AgentReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment?: string;
  category?: string;
}

export interface AgentRatingSummary {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: { rating: number; count: number }[];
}

export const agentReviewsApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<AgentReview>>(`/agent/reviews?page=${page}&pageSize=${pageSize}`),
  summary: () => apiFetch<AgentRatingSummary>('/agent/reviews/summary'),
};
