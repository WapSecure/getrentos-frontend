import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Upload, X } from 'lucide-react-native';
import { Button, Chip, FormAlert, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  ownerApi,
  OWNERSHIP_DOCUMENTS,
  type CreateOwnerPropertyInput,
  type OwnershipDocumentType,
} from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { LocationFields } from '@/components/forms/LocationFields';

const TYPES: { value: CreateOwnerPropertyInput['propertyType']; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LAND', label: 'Land' },
];

const digits = (s: string) => Number(s.replace(/\D/g, '')) || undefined;

export default function OwnerAddProperty() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const stackFieldPairs = width < 380 || fontScale > 1.15;
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState('');
  const [propertyType, setPropertyType] =
    useState<CreateOwnerPropertyInput['propertyType']>('APARTMENT');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [docType, setDocType] = useState<OwnershipDocumentType>('C_OF_O');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [attempted, setAttempted] = useState(false);

  const missing = {
    name: !name.trim() ? 'Give the property a name' : undefined,
    address: !address.trim() ? 'Enter the street address' : undefined,
    city: !city.trim() ? 'Enter the city' : undefined,
    state: !state.trim() ? 'Enter the state' : undefined,
    file: !file ? 'Add at least one ownership document' : undefined,
  };
  const valid = !Object.values(missing).some(Boolean);

  const submit = useMutation({
    mutationFn: async () => {
      const property = await ownerApi.createProperty({
        name: name.trim(),
        propertyType,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country,
        estimatedValue: digits(estimatedValue),
        purchasePrice: digits(purchasePrice),
      });
      // The property exists now; a failed upload must not lose it.
      let proofFailed = false;
      try {
        await ownerApi.submitOwnershipProof(property.id, docType, file!);
      } catch {
        proofFailed = true;
      }
      return { property, proofFailed };
    },
    onSuccess: ({ property, proofFailed }) => {
      haptics.success();
      qc.invalidateQueries({ queryKey: qk.owner.properties });
      qc.invalidateQueries({ queryKey: qk.owner.dashboard });
      if (proofFailed) {
        Alert.alert(
          'Property added — document didn’t upload',
          'Your property was saved, but the ownership document could not be sent. Open the property to try again.'
        );
      } else {
        toast.show('Property added. We’ll review your ownership document.', 'success');
      }
      router.replace(`/(app)/owner-property/${property.id}`);
    },
    onError: () => haptics.error(),
  });

  const onSubmit = () => {
    setAttempted(true);
    if (valid) submit.mutate();
    else haptics.error();
  };

  const err = (key: keyof typeof missing) => (attempted ? missing[key] : undefined);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
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
          eyebrow="Your portfolio"
          title="Add a property"
          subtitle="Verified ownership lets you list it for sale"
          onBack={() => router.back()}
        />

        <TextField
          label="Property name"
          placeholder="e.g. 4-bed duplex, Lekki"
          value={name}
          onChangeText={setName}
          error={err('name')}
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
            Type
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                selected={propertyType === t.value}
                onPress={() => setPropertyType(t.value)}
              />
            ))}
          </View>
        </View>

        <TextField
          label="Street address"
          value={address}
          onChangeText={setAddress}
          autoComplete="street-address"
          error={err('address')}
        />
        <LocationFields
          country={country}
          state={state}
          city={city}
          onCountryChange={setCountry}
          onStateChange={setState}
          onCityChange={setCity}
          errors={{ state: err('state'), city: err('city') }}
        />
        <View style={{ flexDirection: stackFieldPairs ? 'column' : 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Estimated value (₦)"
              keyboardType="number-pad"
              value={digits(estimatedValue)?.toLocaleString('en-NG') ?? ''}
              onChangeText={setEstimatedValue}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label="Bought for (₦, optional)"
              keyboardType="number-pad"
              value={digits(purchasePrice)?.toLocaleString('en-NG') ?? ''}
              onChangeText={setPurchasePrice}
            />
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="heading" accessibilityRole="header">
            Proof of ownership
          </Text>
          <Text variant="callout" color="mutedForeground">
            Our compliance team checks this before the property can be listed. PDF or photo.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {OWNERSHIP_DOCUMENTS.map((d) => (
              <Chip
                key={d.value}
                size="sm"
                label={d.label}
                selected={docType === d.value}
                onPress={() => setDocType(d.value)}
              />
            ))}
          </View>
          {file ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingLeft: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.secondary,
              }}
            >
              <FileText size={16} color={colors.primary} />
              <Text variant="callout" numberOfLines={1} style={{ flex: 1 }}>
                {file.name}
              </Text>
              <Pressable
                onPress={() => setFile(null)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${file.name}`}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ) : (
            <Button
              label="Choose document"
              variant="outline"
              icon={<Upload size={16} color={colors.foreground} />}
              onPress={async () => {
                const picked = await pickDocument();
                if (picked) setFile(picked);
              }}
            />
          )}
          {err('file') ? (
            <Text variant="caption" color="destructive" accessibilityLiveRegion="polite">
              {err('file')}
            </Text>
          ) : null}
        </View>

        <FormAlert
          message={
            submit.error
              ? submit.error instanceof ApiError
                ? submit.error.message
                : 'Could not add this property. Try again.'
              : null
          }
        />
        <Button label="Add property" loading={submit.isPending} onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
