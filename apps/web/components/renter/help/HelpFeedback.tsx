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
      <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <Star className="w-6 h-6 text-green-600 fill-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Thank you for your feedback!
        </p>
        <p className="text-xs text-gray-500 mt-1">We appreciate your input</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Send Feedback</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Help us improve</p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">How was your experience?</p>
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
                      ? 'fill-[#c4a747] text-[#c4a747]'
                      : 'text-gray-300 dark:text-gray-600'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
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
