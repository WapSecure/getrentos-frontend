import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { StarRating } from '@/components/reviews/StarRating';
import { qk } from '@/lib/query/keys';
import { reviewsApi, type PendingReview } from '@/lib/api/reviews';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  pending: PendingReview | null;
}

const RATING_HINT: Record<number, string> = {
  1: 'Poor',
  2: 'Below expectations',
  3: 'Fine',
  4: 'Good',
  5: 'Excellent',
};

export function SubmitReviewSheet({ open, onClose, pending }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={pending?.type === 'landlord' ? 'Review your landlord' : 'Review this property'}
    >
      {/* Remount per open so the rating and comment reset between tenancies. */}
      {pending ? <SubmitReviewForm key={pending.id} pending={pending} onClose={onClose} /> : null}
    </Sheet>
  );
}

function SubmitReviewForm({ pending, onClose }: { pending: PendingReview; onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const subject =
    pending.type === 'landlord'
      ? (pending.landlord ?? 'your landlord')
      : (pending.property ?? 'this property');

  const mutation = useMutation({
    mutationFn: () =>
      reviewsApi.submit({
        leaseId: pending.leaseId,
        category: pending.category,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.reviewsPending });
      qc.invalidateQueries({ queryKey: ['renter', 'reviews', 'submitted'] });
      toast.show('Thanks — your review is live.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not submit that review.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        How was your experience with <Text variant="bodyStrong">{subject}</Text>? Reviews are public
        and help the next renter decide.
      </Text>

      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <StarRating value={rating} onChange={setRating} />
        <Text variant="caption" color="mutedForeground">
          {rating ? RATING_HINT[rating] : 'Tap to rate'}
        </Text>
      </View>

      <TextField
        label="Comment (optional)"
        placeholder="What should the next renter know?"
        multiline
        numberOfLines={4}
        value={comment}
        onChangeText={setComment}
      />

      <Button
        label="Submit review"
        loading={mutation.isPending}
        disabled={rating < 1}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
