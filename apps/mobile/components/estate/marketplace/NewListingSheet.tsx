import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import {
  Button,
  DateField,
  SegmentedControl,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  LISTING_TYPES,
  buildListing,
  createdMessage,
  estateMarketplaceApi,
  marketable,
  marketplaceKeys,
  parseNaira,
  type ListingType,
  type MarketingAgreement,
} from '@/lib/api/estateMarketplace';
import { haptics } from '@/lib/haptics';
import { MarketplaceFormError } from './MarketplaceUI';

/** Advertise a property the estate is cleared to market. */
export function NewListingSheet({
  open,
  onClose,
  estateId,
  agreements,
  onAddProperty,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
  agreements: MarketingAgreement[];
  /** Offered when nothing can be listed yet: takes the manager to their properties. */
  onAddProperty: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="New listing" snapPoints={['90%']}>
      {open ? (
        <NewListingForm
          estateId={estateId}
          agreements={agreements}
          onDone={onClose}
          onAddProperty={onAddProperty}
        />
      ) : null}
    </Sheet>
  );
}

function NewListingForm({
  estateId,
  agreements,
  onDone,
  onAddProperty,
}: {
  estateId: string;
  agreements: MarketingAgreement[];
  onDone: () => void;
  onAddProperty: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const options = marketable(agreements);
  const [propertyId, setPropertyId] = useState(options.length === 1 ? options[0].propertyId : '');
  const [listingType, setListingType] = useState<ListingType>('RENT');
  const [price, setPrice] = useState('');
  const [title, setTitle] = useState('');
  const [availableFrom, setAvailableFrom] = useState(() => toISODate(new Date()));
  const amount = parseNaira(price);

  const create = useMutation({
    mutationFn: (publish: boolean) =>
      estateMarketplaceApi.createListing(
        estateId,
        buildListing({
          propertyId,
          listingType,
          price: amount ?? 0,
          availableFrom,
          title,
          publish,
        })
      ),
    onSuccess: (listing) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: marketplaceKeys.all(estateId) });
      toast.show(createdMessage(listing), 'success');
      onDone();
    },
  });

  if (!options.length) {
    const waiting = agreements.filter((a) => a.status === 'PENDING').length;
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          {waiting
            ? `There’s nothing you can list yet: ${waiting} ${waiting === 1 ? 'owner hasn’t' : 'owners haven’t'} answered. Once an owner agrees, their property appears here.`
            : 'There’s nothing you can list yet. Add a property and ask its owner for permission to market it.'}
        </Text>
        <Button label="Go to properties" variant="secondary" onPress={onAddProperty} />
      </View>
    );
  }

  const ready = !!propertyId && amount !== null && !!availableFrom;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">Property</Text>
        {options.map((a) => {
          const selected = a.propertyId === propertyId;
          return (
            <Pressable
              key={a.id}
              onPress={() => setPropertyId(a.propertyId)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${a.propertyTitle}, ${a.propertyAddress}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                minHeight: 48,
                padding: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.accent : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text variant="callout" style={{ fontWeight: '700' }} numberOfLines={1}>
                  {a.propertyTitle}
                </Text>
                <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                  {[a.propertyAddress, a.propertyCity].filter(Boolean).join(', ')}
                </Text>
              </View>
              {selected ? <Check size={16} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      <SegmentedControl
        accessibilityLabel="Market"
        value={listingType}
        onChange={setListingType}
        options={LISTING_TYPES}
      />
      <TextField
        label={
          listingType === 'SHORTLET'
            ? 'Nightly rate (₦)'
            : listingType === 'SALE'
              ? 'Asking price (₦)'
              : 'Rent (₦)'
        }
        value={price}
        onChangeText={setPrice}
        keyboardType="number-pad"
        placeholder={listingType === 'SALE' ? 'e.g. 85000000' : 'e.g. 2500000'}
        error={
          price.trim() && amount === null ? 'Enter an amount in naira, numbers only.' : undefined
        }
      />
      <TextField
        label="Headline (optional)"
        value={title}
        onChangeText={setTitle}
        maxLength={120}
        placeholder="e.g. Bright 3-bed terrace by the park"
        hint="Shown in search. Leave blank to use the property’s name."
      />
      <DateField
        label="Available from"
        value={availableFrom}
        onChange={setAvailableFrom}
        min={toISODate(new Date())}
      />
      <Text variant="caption" color="mutedForeground">
        You can add photos once it’s saved. The owner keeps their property; the estate only
        advertises it.
      </Text>

      <MarketplaceFormError error={create.error} fallback="That listing couldn’t be created." />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          label="Save draft"
          variant="secondary"
          fullWidth={false}
          style={{ flex: 1 }}
          disabled={!ready || create.isPending}
          loading={create.isPending && create.variables === false}
          onPress={() => create.mutate(false)}
        />
        <Button
          label="Publish"
          fullWidth={false}
          style={{ flex: 1 }}
          disabled={!ready || create.isPending}
          loading={create.isPending && create.variables === true}
          onPress={() => create.mutate(true)}
        />
      </View>
    </View>
  );
}
