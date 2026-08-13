'use client';

import { Textarea } from '@/components/ui/Textarea';

import { motion } from 'framer-motion';
import { Star, Star as StarOutline, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toast, ToastVariant } from '@/components/ui/Toast';
import { useState } from 'react';

interface PendingReview {
  id: string;
  property: string;
  landlord: string;
  moveOutDate: string;
  type: 'property' | 'landlord';
}

const pendingReviews: PendingReview[] = [
  {
    id: '1',
    property: 'Modern Downtown Loft',
    landlord: 'Jane Smith',
    moveOutDate: '2024-08-01',
    type: 'property',
  },
  {
    id: '2',
    property: 'Cozy Studio Apartment',
    landlord: 'John Doe',
    moveOutDate: '2024-07-15',
    type: 'landlord',
  },
];

export const RenterReviews = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [pending, setPending] = useState(pendingReviews);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const handleStartReview = (review: PendingReview) => {
    setSelectedReview(review);
    setRating(0);
    setReviewText('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedReview) return;
    const existing = localStorage.getItem('renter_submitted_reviews');
    const submitted = existing ? JSON.parse(existing) : [];
    submitted.push({
      id: selectedReview.id,
      target:
        selectedReview.type === 'property' ? selectedReview.property : selectedReview.landlord,
      rating,
      text: reviewText,
      date: new Date().toISOString(),
    });
    localStorage.setItem('renter_submitted_reviews', JSON.stringify(submitted));

    setPending((prev) => prev.filter((r) => r.id !== selectedReview.id));
    setShowReviewModal(false);
    setToast({ message: 'Review submitted — thanks for sharing!', variant: 'success' });
  };

  const toggleHelpful = (index: number) => {
    setHelpfulVotes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

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
          {/* Your Rating Summary */}
          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">4.8</div>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3 h-3 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Your Rating</p>
            </div>
            <div className="flex-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span>5 star</span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="w-[60%] h-full bg-primary rounded-full" />
                  </div>
                  <span>60%</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>4 star</span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="w-[25%] h-full bg-primary rounded-full" />
                  </div>
                  <span>25%</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>3 star</span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="w-[10%] h-full bg-primary rounded-full" />
                  </div>
                  <span>10%</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>2 star</span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="w-[3%] h-full bg-primary rounded-full" />
                  </div>
                  <span>3%</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>1 star</span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="w-[2%] h-full bg-primary rounded-full" />
                  </div>
                  <span>2%</span>
                </div>
              </div>
            </div>
          </div>

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
                      <p className="text-xs text-gray-500 mt-0.5">
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

          {/* Recent Reviews */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Your Recent Reviews</h3>
            <div className="space-y-3">
              {[1, 2].map((_, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Luxury Beachfront Villa</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-3 h-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">2 months ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Great property, excellent location, very responsive landlord!
                  </p>
                  <button
                    onClick={() => toggleHelpful(index)}
                    className={`flex items-center gap-1 mt-2 text-xs transition-colors ${
                      helpfulVotes[index] ? 'text-primary' : 'text-gray-500 hover:text-foreground'
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3 h-3 ${helpfulVotes[index] ? 'fill-primary text-primary' : 'text-gray-400'}`}
                    />
                    <span>{helpfulVotes[index] ? 'Marked helpful' : 'Helpful'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
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
