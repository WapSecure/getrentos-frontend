import { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Star } from 'lucide-react-native';
import { Button, Card, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { StarRating } from '@/components/reviews/StarRating';
import { feedbackApi } from '@/lib/api/feedback';
import { ApiError } from '@/lib/api/client';

/** "Was this helpful?" — the help centre's rating-plus-note widget. */
export function HelpFeedbackCard() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      feedbackApi.submit({
        rating,
        message: message.trim() || 'No additional feedback',
      }),
    onSuccess: () => setSubmitted(true),
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not send that feedback.', 'error'),
  });

  if (submitted) {
    return (
      <Card padding={spacing.xl}>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.success + '1f',
            }}
          >
            <Star size={22} color={colors.success} fill={colors.success} />
          </View>
          <Text variant="bodyStrong">Thanks for the feedback</Text>
          <Text variant="caption" color="mutedForeground" center>
            It goes straight to the team working on the app.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card padding={spacing.xl}>
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: 4 }}>
          <Text variant="bodyStrong">How are we doing?</Text>
          <Text variant="caption" color="mutedForeground">
            Rate the help centre and tell us what was missing.
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <StarRating value={rating} onChange={setRating} />
        </View>

        <TextField
          label="Anything else? (optional)"
          placeholder="What were you looking for?"
          multiline
          numberOfLines={3}
          maxLength={2000}
          value={message}
          onChangeText={setMessage}
        />

        <Button
          label="Send feedback"
          loading={mutation.isPending}
          disabled={rating < 1}
          onPress={() => mutation.mutate()}
        />
      </View>
    </Card>
  );
}
