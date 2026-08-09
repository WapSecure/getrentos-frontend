'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const HelpFeedback = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating > 0) {
      setSubmitted(true);
      // In production, send feedback
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setFeedback('');
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <Star className="w-6 h-6 text-green-600 fill-green-600" />
        </div>
        <p className="text-sm font-medium text-foreground">Thank you for your feedback!</p>
        <p className="text-xs text-gray-500 mt-1">We appreciate your input</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Send Feedback</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Help us improve</p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm text-foreground mb-2">How was your experience?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    (hoverRating || rating) >= star
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/50'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Your Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={rating === 0}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Submit Feedback
        </Button>
      </div>
    </div>
  );
};
