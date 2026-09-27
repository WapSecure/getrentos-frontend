import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, MapPin } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  FormAlert,
  LinkButton,
  Price,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  ownerApi,
  OWNER_LISTING_LABEL,
  OWNER_LISTING_TONE,
  OWNER_VERIFICATION_LABEL,
  OWNER_VERIFICATION_TONE,
  type OwnerProperty,
} from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { readGate } from '@/lib/verificationGate';
import { formatDate, formatNaira } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { VerificationGateNotice } from '@/components/VerificationGateNotice';
import { Sheet } from '@/components/Sheet';
import { OwnershipProofSheet } from '@/components/owner/OwnershipProofSheet';

export default function OwnerPropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [listOpen, setListOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  const property = useQuery({
    queryKey: qk.owner.property(id),
    queryFn: () => ownerApi.property(id),
    enabled: !!id,
  });
  const listings = useQuery({ queryKey: qk.owner.listings, queryFn: () => ownerApi.listings() });
  const listing = (listings.data?.items ?? [])
    .filter((l) => l.propertyId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.owner.listings });
    qc.invalidateQueries({ queryKey: qk.owner.property(id) });
    qc.invalidateQueries({ queryKey: qk.owner.dashboard });
  };

  const setStatus = useMutation({
    mutationFn: (status: 'PUBLISHED' | 'PAUSED' | 'CLOSED') =>
      ownerApi.setListingStatus(listing!.id, status),
    onSuccess: (_d, status) => {
      refresh();
      toast.show(
        status === 'PUBLISHED'
          ? 'Listing is live.'
          : status === 'PAUSED'
            ? 'Listing paused.'
            : 'Listing closed.',
        'success'
      );
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update the listing.', 'error'),
  });

  const p = property.data;
  const canList = p?.verificationStatus === 'verified';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}>
        <PropertyGallery
          images={[p?.coverImageUrl, ...(p?.galleryImageUrls ?? [])].filter(
            (x): x is string => !!x
          )}
          height={240}
          emptyLabel="No photos added yet"
        />
        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          <DetailHeader
            eyebrow="Your property"
            title={p?.name ?? 'Property'}
            onBack={() => router.back()}
          />

          {property.isError && !p ? (
            <ErrorState onRetry={() => property.refetch()} />
          ) : !p ? (
            <Skeleton height={160} radius={radius.lg} />
          ) : (
            <>
              <View style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                  <MapPin size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                  <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                    {p.address}, {p.city}, {p.state}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Badge
                    label={OWNER_VERIFICATION_LABEL[p.verificationStatus]}
                    tone={OWNER_VERIFICATION_TONE[p.verificationStatus]}
                  />
                  <Badge label={p.propertyType.replace(/_/g, ' ').toLowerCase()} tone="neutral" />
                </View>
              </View>

              <VerificationState property={p} />
              {p.verificationStatus !== 'verified' ? (
                <Button
                  label={
                    p.verificationStatus === 'pending_review'
                      ? 'Add another ownership document'
                      : 'Upload ownership document'
                  }
                  variant={p.verificationStatus === 'pending_review' ? 'ghost' : 'secondary'}
                  onPress={() => setProofOpen(true)}
                />
              ) : null}

              <Card elevated style={{ gap: spacing.sm }}>
                <Fact
                  label="Estimated value"
                  value={<Price amount={p.estimatedValue} variant="callout" />}
                />
                {p.purchasePrice ? (
                  <Fact
                    label="Bought for"
                    value={<Price amount={p.purchasePrice} variant="callout" />}
                  />
                ) : null}
                {p.purchaseDate ? (
                  <Fact label="Bought on" value={formatDate(p.purchaseDate, 'medium')} />
                ) : null}
                <Fact label="Added" value={formatDate(p.createdAt, 'medium')} />
              </Card>

              <View style={{ gap: spacing.sm }}>
                <Text variant="heading" accessibilityRole="header">
                  Sale listing
                </Text>
                {listings.isPending ? (
                  <Skeleton height={90} radius={radius.lg} />
                ) : listing && listing.status !== 'closed' ? (
                  <Card elevated style={{ gap: spacing.sm }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
                        {listing.listingTitle}
                      </Text>
                      <Badge
                        label={OWNER_LISTING_LABEL[listing.status]}
                        tone={OWNER_LISTING_TONE[listing.status]}
                      />
                    </View>
                    <Price amount={listing.askingPrice} variant="heading" />
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      {listing.status === 'published' ? (
                        <Button
                          label="Pause"
                          variant="outline"
                          size="sm"
                          style={{ flex: 1 }}
                          loading={setStatus.isPending && setStatus.variables === 'PAUSED'}
                          disabled={setStatus.isPending}
                          onPress={() => setStatus.mutate('PAUSED')}
                        />
                      ) : listing.status === 'paused' ? (
                        <Button
                          label="Relist"
                          size="sm"
                          style={{ flex: 1 }}
                          loading={setStatus.isPending && setStatus.variables === 'PUBLISHED'}
                          disabled={setStatus.isPending}
                          onPress={() => setStatus.mutate('PUBLISHED')}
                        />
                      ) : null}
                      <Button
                        label="Close listing"
                        variant="secondary"
                        size="sm"
                        style={{ flex: 1 }}
                        loading={setStatus.isPending && setStatus.variables === 'CLOSED'}
                        disabled={setStatus.isPending}
                        onPress={() =>
                          Alert.alert(
                            'Close this listing?',
                            'Buyers will no longer see it or be able to make offers.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Close listing',
                                style: 'destructive',
                                onPress: () => setStatus.mutate('CLOSED'),
                              },
                            ]
                          )
                        }
                      />
                    </View>
                  </Card>
                ) : (
                  <Card style={{ gap: spacing.sm }}>
                    <Text variant="callout" color="mutedForeground">
                      {canList
                        ? 'Not listed for sale. List it to start receiving offers from verified buyers.'
                        : 'You can list this property once its ownership has been verified.'}
                    </Text>
                    <Button
                      label="List for sale"
                      disabled={!canList}
                      onPress={() => setListOpen(true)}
                    />
                  </Card>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {p ? (
        <OwnershipProofSheet
          propertyId={p.id}
          open={proofOpen}
          onClose={() => setProofOpen(false)}
        />
      ) : null}
      <Sheet open={listOpen} onClose={() => setListOpen(false)} title="List for sale">
        {p ? (
          <ListForm
            key={listOpen ? 'open' : 'closed'}
            property={p}
            onDone={() => {
              setListOpen(false);
              refresh();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function VerificationState({ property: p }: { property: OwnerProperty }) {
  if (p.verificationStatus === 'verified') return null;
  const tone = p.verificationStatus === 'pending_review' ? 'info' : 'warning';
  const message =
    p.verificationStatus === 'pending_review'
      ? 'We’re checking your ownership documents. You’ll be able to list once it’s verified.'
      : p.verificationStatus === 'needs_clarification'
        ? p.rejectionReason || 'Our reviewers need more information about ownership.'
        : p.rejectionReason || 'Ownership could not be verified.';
  return (
    <FormAlert
      tone={tone}
      title={
        p.verificationStatus === 'pending_review' ? 'Verification in progress' : 'Action needed'
      }
      message={message}
    />
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="callout" color="mutedForeground">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="callout" style={{ fontWeight: '600' }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

function ListForm({ property, onDone }: { property: OwnerProperty; onDone: () => void }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [title, setTitle] = useState(property.name);
  const [price, setPrice] = useState(
    property.estimatedValue ? String(property.estimatedValue) : ''
  );
  const value = Number(price.replace(/\D/g, ''));
  // Recent completed sales in the same city. The API doesn't match on property
  // type, so it's shown as context and only suggested when there are a few.
  const insights = useQuery({
    queryKey: qk.owner.marketInsights(property.city),
    queryFn: () => ownerApi.marketInsights(property.city),
    staleTime: 30 * 60_000,
  });
  const m = insights.data;

  const create = useMutation({
    mutationFn: () =>
      ownerApi.createListing({
        propertyId: property.id,
        price: value,
        listingTitle: title.trim() || undefined,
      }),
    onSuccess: () => {
      toast.show('Listing created. Buyers can now make offers.', 'success');
      onDone();
    },
    onError: (err) => {
      if (!readGate(err))
        toast.show(
          err instanceof ApiError ? err.message : 'Could not create the listing.',
          'error'
        );
    },
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField label="Listing title" value={title} onChangeText={setTitle} maxLength={120} />
      <TextField
        label="Asking price (₦)"
        keyboardType="number-pad"
        value={value ? value.toLocaleString('en-NG') : ''}
        onChangeText={setPrice}
        hint="Buyers can offer above or below this."
      />
      {m && m.comparables.length >= 3 && m.suggested > 0 ? (
        <View
          accessible
          accessibilityLabel={`Recent sales in ${property.city} ranged from ${formatNaira(m.lowEstimate)} to ${formatNaira(m.highEstimate)}. Average ${formatNaira(m.suggested)}.`}
          style={{ gap: spacing.xs }}
        >
          <Text variant="caption" color="mutedForeground">
            Recent sales in {property.city}: {formatNaira(m.lowEstimate, { compact: true })} –{' '}
            {formatNaira(m.highEstimate, { compact: true })}
          </Text>
          <LinkButton
            label={`Use their average, ${formatNaira(m.suggested, { compact: true })}`}
            onPress={() => setPrice(String(Math.round(m.suggested)))}
          />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <AlertTriangle size={16} color={colors.warning} style={{ marginTop: 2 }} />
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
          GetRentos holds the buyer’s payment on accepted offers. You’re paid once the sale
          completes.
        </Text>
      </View>
      <VerificationGateNotice error={create.error} onNavigate={onDone} />
      <Button
        label="Create listing"
        loading={create.isPending}
        disabled={!value}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
