'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Star as StarOutline, MapPin } from 'lucide-react';
import { Textarea } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { Toast, ToastVariant } from '@getrentos/ui';
import { renterService, type PendingReview } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export const RenterReviews = () => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: pending = [] } = useQuery({
    queryKey: renterKeys.reviewsPending,
    queryFn: () => unwrap(renterService.getPendingReviews()),
  });

  const { data: submittedData } = useQuery({
    queryKey: [...renterKeys.reviewsSubmitted, { page: 1, pageSize: 5 }],
    queryFn: () => unwrap(renterService.getSubmittedReviews({ page: 1, pageSize: 5 })),
  });
  const submitted = useMemo(() => submittedData?.items ?? [], [submittedData]);

  const submitMutation = useMutation({
    mutationFn: (input: {
      leaseId: string;
      category: 'LANDLORD' | 'PROPERTY';
      rating: number;
      comment?: string;
    }) => unwrap(renterService.submitReview(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.reviewsPending });
      queryClient.invalidateQueries({ queryKey: renterKeys.reviewsSubmitted });
      setShowReviewModal(false);
      setRating(0);
      setReviewText('');
      setToast({ message: 'Review submitted — thanks for sharing!', variant: 'success' });
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Failed to submit review.', variant: 'error' });
    },
  });

  // Real average from the reviews the renter has written.
  const averageRating = useMemo(() => {
    if (submitted.length === 0) return 0;
    return submitted.reduce((sum, r) => sum + r.rating, 0) / submitted.length;
  }, [submitted]);

  const handleStartReview = (review: PendingReview) => {
    setSelectedReview(review);
    setRating(0);
    setReviewText('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedReview) return;
    submitMutation.mutate({
      leaseId: selectedReview.leaseId,
      category: selectedReview.category,
      rating,
      comment: reviewText || undefined,
    });
  };

  // Nothing to write and nothing written yet — reviews only become relevant
  // after a lease ends, so keep the card off the dashboard until then.
  if (pending.length === 0 && submitted.length === 0) return null;

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Reviews & Ratings</h2>
          <p className="text-sm text-muted-foreground">Share your experience</p>
        </div>

        <div className="p-4">
          {submitted.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{averageRating.toFixed(1)}</div>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= Math.round(averageRating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {submitted.length} review{submitted.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          )}

          {/* Pending Reviews */}
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Pending Reviews</h3>
              <div className="space-y-3">
                {pending.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + index * 0.05, duration: 0.3 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {review.type === 'property' ? review.property : review.landlord}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {review.type === 'property' ? 'Rate this property' : 'Rate your landlord'}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleStartReview(review)}>
                      Write Review
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {submitted.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Your Reviews</h3>
              <div className="space-y-3">
                {submitted.map((review) => (
                  <div key={review.id} className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {review.category === 'PROPERTY'
                            ? review.propertyTitle
                            : review.reviewerName}
                        </p>
                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${star <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.propertyTitle && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {review.propertyTitle}
                        </span>
                      )}
                    </div>
                    {review.comment && (
                      <p className="text-xs text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Review Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Write a Review</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedReview.type === 'property'
                  ? `How was your experience at ${selectedReview.property}?`
                  : `How was your experience with ${selectedReview.landlord}?`}
              </p>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    {(hoverRating || rating) >= star ? (
                      <Star className="w-8 h-8 fill-primary text-primary" />
                    ) : (
                      <StarOutline className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </button>
                ))}
              </div>

              {/* Review Text */}
              <Textarea
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              />

              <div className="flex gap-3">
                <Button variant="outline" fullWidth onClick={() => setShowReviewModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSubmitReview}
                  disabled={rating === 0}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
