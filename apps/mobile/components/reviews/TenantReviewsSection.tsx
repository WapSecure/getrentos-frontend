import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Text, TextField, useTheme, useToast } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { StarRating } from '@/components/reviews/StarRating';
import { qk } from '@/lib/query/keys';
import { landlordApi, type PendingTenantReview } from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

const RATING_HINT: Record<number, string> = {
  1: 'Poor',
  2: 'Below expectations',
  3: 'Fine',
  4: 'Good',
  5: 'Excellent',
};

/** Landlords and owners rate a tenant once they have moved out; screening shows these to the next landlord. */
export function TenantReviewsSection() {
  const { spacing } = useTheme();
  const [target, setTarget] = useState<PendingTenantReview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const query = useQuery({ queryKey: qk.landlord.tenantReviews, queryFn: landlordApi.tenantReviews });
  const pending = query.data?.pending ?? [];
  const written = query.data?.written ?? [];

  if (!pending.length && !written.length) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Card elevated style={{ gap: spacing.sm }}>
        <Text variant="subheading">Review your tenants</Text>
        <Text variant="caption" color="mutedForeground">
          Rate a tenant once they have moved out. Other landlords see these when the tenant applies
          to rent again, and the tenant can read what you wrote.
        </Text>
        {pending.map((p) => (
          <View
            key={p.leaseId}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xs }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {p.tenantName}
              </Text>
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {p.propertyName} · lease ended {formatDate(p.leaseEnd, 'short')}
              </Text>
            </View>
            <Button
              label="Review"
              size="sm"
              accessibilityLabel={`Review ${p.tenantName}`}
              onPress={() => setTarget(p)}
            />
          </View>
        ))}
        {written.length ? (
          <View style={{ gap: spacing.xs, paddingTop: spacing.xs }}>
            <Text variant="caption" color="mutedForeground">
              Tenants you have reviewed
            </Text>
            {written.map((r) => (
              <View key={r.id} style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {r.tenantName}
                  </Text>
                  <StarRating value={r.rating} size={13} />
                </View>
                {r.comment ? (
                  <Text variant="caption" color="mutedForeground">
                    {r.comment}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Sheet
        open={target !== null}
        onClose={submitting ? () => undefined : () => setTarget(null)}
        title="Review your tenant"
      >
        {target ? (
          <ReviewTenantForm
            key={target.leaseId}
            target={target}
            onClose={() => setTarget(null)}
            onSubmittingChange={setSubmitting}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function ReviewTenantForm({
  target,
  onClose,
  onSubmittingChange,
}: {
  target: PendingTenantReview;
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      landlordApi.reviewTenant({
        leaseId: target.leaseId,
        rating,
        comment: comment.trim() || undefined,
      }),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landlord.tenantReviews });
      toast.show(`Review saved. ${target.tenantName} has been told.`, 'success');
      onClose();
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not save that review.'), 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        How was <Text variant="bodyStrong">{target.tenantName}</Text> as a tenant at{' '}
        {target.propertyName}? They will be able to read your review.
      </Text>

      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <StarRating value={rating} onChange={setRating} disabled={mutation.isPending} />
        <Text variant="caption" color="mutedForeground">
          {rating ? RATING_HINT[rating] : 'Tap to rate'}
        </Text>
      </View>

      <TextField
        label="Comment (optional)"
        placeholder="Rent on time? Looked after the home?"
        multiline
        numberOfLines={4}
        maxLength={1000}
        value={comment}
        onChangeText={setComment}
        editable={!mutation.isPending}
      />

      <Button
        label="Submit review"
        loading={mutation.isPending}
        disabled={mutation.isPending || rating < 1}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
