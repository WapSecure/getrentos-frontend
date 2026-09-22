import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Camera, X } from 'lucide-react-native';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import {
  landlordApi,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABEL,
  type PropertyType,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { pickImage } from '@/lib/filePicker';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreatePropertySheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Add a property">
      {/* Remount per open so a dismissed draft never reappears. */}
      <CreatePropertyForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function CreatePropertyForm({ onClose }: { onClose: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<PropertyType>('apartment');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<{ uri: string; key: string } | null>(null);

  /**
   * The API takes media as storage keys, so the photo uploads first and the
   * property carries its key. An upload the landlord then abandons is left
   * uncommitted server-side rather than attached to anything.
   */
  const uploadCover = useMutation({
    mutationFn: async () => {
      const file = await pickImage();
      if (!file) return null;
      const { key } = await landlordApi.uploadPropertyMedia(file, 'image');
      return { uri: file.uri, key };
    },
    onSuccess: (result) => {
      if (result) setCover(result);
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not upload that photo.', 'error'),
  });

  const create = useMutation({
    mutationFn: () =>
      landlordApi.createProperty({
        name: name.trim(),
        type,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: 'Nigeria',
        description: description.trim() || undefined,
        coverImageKey: cover?.key,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'dashboard'] });
      toast.show('Property added.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not add that property.', 'error'),
  });

  const valid = name.trim() && address.trim() && city.trim() && state.trim();

  return (
    <View style={{ gap: spacing.lg }}>
      <Pressable
        onPress={() => uploadCover.mutate()}
        disabled={uploadCover.isPending}
        accessibilityRole="button"
        accessibilityLabel={cover ? 'Change the cover photo' : 'Add a cover photo'}
        style={{
          height: 130,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: cover ? 0 : 1,
          borderStyle: 'dashed',
          borderColor: colors.border,
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cover ? (
          <>
            <Image
              source={{ uri: cover.uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <Pressable
              onPress={() => setCover(null)}
              accessibilityRole="button"
              accessibilityLabel="Remove the cover photo"
              hitSlop={8}
              style={{
                position: 'absolute',
                top: spacing.sm,
                right: spacing.sm,
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.scrim,
              }}
            >
              <X size={15} color="#fff" />
            </Pressable>
          </>
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Camera size={22} color={colors.mutedForeground} />
            <Text variant="caption" color="mutedForeground">
              {uploadCover.isPending ? 'Uploading…' : 'Add a cover photo (optional)'}
            </Text>
          </View>
        )}
      </Pressable>

      <TextField
        label="Name"
        placeholder="e.g. 3-Bed Flat · Yaba"
        value={name}
        onChangeText={setName}
      />

      <ChipSelect
        label="Type"
        options={PROPERTY_TYPES.map((t) => ({ value: t, label: PROPERTY_TYPE_LABEL[t] }))}
        value={type}
        onChange={setType}
      />

      <TextField
        label="Address"
        placeholder="e.g. 22 Herbert Macaulay Way"
        value={address}
        onChangeText={setAddress}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextField label="City" placeholder="Lagos" value={city} onChangeText={setCity} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="State" placeholder="Lagos" value={state} onChangeText={setState} />
        </View>
      </View>

      <TextField
        label="Description (optional)"
        multiline
        numberOfLines={3}
        value={description}
        onChangeText={setDescription}
      />

      <Button
        label="Add property"
        loading={create.isPending}
        disabled={!valid || uploadCover.isPending}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
