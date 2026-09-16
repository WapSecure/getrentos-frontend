import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react-native';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { shortletsApi, type ShortletBooking } from '@/lib/api/shortlets';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  booking: ShortletBooking | null;
}

export function ReviewStaySheet({ open, onClose, booking }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Review your stay">
      {/* Remount on each open so the rating always starts fresh. */}
      {booking ? (
        <ReviewForm key={open ? 'open' : 'closed'} onClose={onClose} booking={booking} />
      ) : null}
    </Sheet>
  );
}

function ReviewForm({ onClose, booking }: { onClose: () => void; booking: ShortletBooking }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => shortletsApi.reviewBooking(booking.id, rating, comment.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shortlets', 'bookings'] });
      qc.invalidateQueries({ queryKey: ['shortlets', 'reviews', booking.listingId] });
      toast.show('Thanks for the review.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not submit this review.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        How was <Text variant="bodyStrong">{booking.propertyTitle}</Text>?
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
            hitSlop={6}
          >
            <Star
              size={34}
              color={colors.warning}
              fill={n <= rating ? colors.warning : 'transparent'}
            />
          </Pressable>
        ))}
      </View>

      <TextField
        label="Comment (optional)"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
      />

      <Button
        label="Submit review"
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
