'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Star, Send } from 'lucide-react';
import { Alert, Button, Card, Field, Textarea } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';

export const HelpFeedback = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: (data: { rating?: number; message: string }) =>
      unwrap(renterService.submitFeedback(data)),
    onSuccess: () => {
      setSubmitted(true);
      setRating(0);
      setFeedback('');
    },
    onError: (error: Error) =>
      setErrorMessage(error.message || 'Your feedback could not be sent. Please try again.'),
  });

  const handleSubmit = () => {
    if (rating > 0) {
      setErrorMessage(null);
      submitMutation.mutate({ rating, message: feedback.trim() || 'No additional feedback' });
    }
  };

  if (submitted) {
    return (
      <Card className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle">
          <Star className="h-6 w-6 fill-success text-success" />
        </div>
        <p className="text-sm font-medium text-foreground">Thank you for your feedback!</p>
        <p className="mt-1 text-xs text-muted-foreground">We appreciate your input</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Send Feedback</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Help us improve</p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p id="help-feedback-rating" className="text-sm text-foreground mb-2">
            How was your experience?
          </p>
          <div className="flex gap-1" role="group" aria-labelledby="help-feedback-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                aria-pressed={rating === star}
                className="rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Field label="Your Feedback">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think..."
            rows={3}
          />
        </Field>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={rating === 0 || submitMutation.isPending}
          isLoading={submitMutation.isPending}
          loadingText="Sending feedback"
          icon={<Send className="h-4 w-4" />}
        >
          Submit Feedback
        </Button>
      </div>
    </Card>
  );
};
