import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Check, ChevronRight } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  DateField,
  FormAlert,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { clientName, clientRole, realtorApi, type AssignedProperty } from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

/**
 * Draft a listing on a property a client assigned. Client → property → terms;
 * opened from a property, it starts at the terms.
 */
export default function RealtorNewListing() {
  const params = useLocalSearchParams<{ relationshipId?: string; propertyId?: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [relationshipId, setRelationshipId] = useState(params.relationshipId ?? '');
  const [property, setProperty] = useState<AssignedProperty | null>(null);
  const [type, setType] = useState<'SALE' | 'RENT'>('SALE');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');

  const clients = useQuery({ queryKey: qk.realtor.clients, queryFn: () => realtorApi.clients() });
  const active = clients.data?.items.filter((c) => c.status === 'ACTIVE') ?? [];
  const properties = useQuery({
    queryKey: qk.realtor.assigned(relationshipId),
    queryFn: () => realtorApi.assignedProperties(relationshipId),
    enabled: !!relationshipId,
  });
  // Opened for a specific property: pick it as soon as it loads.
  const preset =
    !property && params.propertyId
      ? properties.data?.items.find((p) => p.id === params.propertyId)
      : undefined;
  const chosen = property ?? preset ?? null;

  const n = Number(price.replace(/\D/g, ''));
  const create = useMutation({
    mutationFn: () =>
      realtorApi.createListing({
        propertyId: chosen!.id,
        listingTitle: title.trim() || chosen!.title,
        listingType: type,
        price: n,
        availableFrom: availableFrom
          ? new Date(`${availableFrom}T00:00:00`).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['realtor'] });
      toast.show('Draft saved. Your client publishes it from their account.', 'success');
      router.back();
    },
  });

  const client = active.find((c) => c.id === relationshipId);
  const step = !relationshipId ? 1 : !chosen ? 2 : 3;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow={`Step ${step} of 3`}
          title={step === 1 ? 'Whose property?' : step === 2 ? 'Which property?' : 'Listing terms'}
          onBack={() => {
            if (step === 3 && !params.propertyId) setProperty(null);
            else if (step === 2 && !params.relationshipId) setRelationshipId('');
            else router.back();
          }}
        />

        {step === 1 ? (
          clients.isPending ? (
            <Skeleton height={140} radius={radius.lg} />
          ) : !active.length ? (
            <View style={{ gap: spacing.md }}>
              <FormAlert
                tone="info"
                message="You can list once a client has approved you and assigned a property."
              />
              <Button
                label="Go to clients"
                variant="secondary"
                onPress={() => router.replace('/(app)/realtor-clients')}
              />
            </View>
          ) : (
            active.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setRelationshipId(c.id)}
                accessibilityRole="button"
                accessibilityLabel={`${clientName(c)}, ${clientRole(c)}, ${c._count.properties} assigned`}
              >
                <Card
                  elevated
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                >
                  <Avatar name={clientName(c)} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{clientName(c)}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {clientRole(c)} · {c._count.properties} assigned
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            ))
          )
        ) : step === 2 ? (
          properties.isPending ? (
            <Skeleton height={140} radius={radius.lg} />
          ) : !properties.data?.items.length ? (
            <FormAlert
              tone="info"
              message={`${client ? clientName(client) : 'This client'} hasn’t assigned you a property yet.`}
            />
          ) : (
            properties.data.items.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setProperty(p);
                  if (!title) setTitle(p.title);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${p.title}, ${p.city}`}
              >
                <Card
                  elevated
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                >
                  <Building2 size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {p.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {[p.city, p.state].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            ))
          )
        ) : (
          <>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Check size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {chosen!.title}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {client ? `For ${clientName(client)}` : [chosen!.city, chosen!.state].join(', ')}
                </Text>
              </View>
            </Card>
            <SegmentedControl
              accessibilityLabel="Sale or rent"
              value={type}
              onChange={setType}
              options={[
                { value: 'SALE', label: 'For sale' },
                { value: 'RENT', label: 'For rent' },
              ]}
            />
            <TextField
              label="Listing title"
              value={title}
              onChangeText={setTitle}
              placeholder={chosen!.title}
              hint="What buyers see first, e.g. “Renovated 4-bed duplex with BQ”"
            />
            <TextField
              label={type === 'RENT' ? 'Rent per year (₦)' : 'Asking price (₦)'}
              keyboardType="number-pad"
              value={n ? n.toLocaleString('en-NG') : ''}
              onChangeText={setPrice}
            />
            <DateField
              label="Available from (optional)"
              value={availableFrom}
              onChange={setAvailableFrom}
              min={toISODate(new Date())}
            />
            <FormAlert
              tone="info"
              message="It’s saved as a draft. Your client reviews and publishes it from their account."
            />
            {create.error ? (
              <FormAlert
                message={
                  create.error instanceof ApiError
                    ? create.error.message
                    : 'Could not save the listing.'
                }
              />
            ) : null}
            <Button
              label="Save draft listing"
              disabled={n < 1}
              loading={create.isPending}
              onPress={() => create.mutate()}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
