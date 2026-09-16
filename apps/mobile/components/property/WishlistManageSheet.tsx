import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import { Button, Divider, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { wishlistsApi, type Wishlist } from '@/lib/api/wishlists';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WishlistManageSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Manage wishlists">
      {/* Remount on each open so any in-flight edit state resets. */}
      <WishlistManageBody key={open ? 'open' : 'closed'} />
    </Sheet>
  );
}

function WishlistManageBody() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({ queryKey: qk.renter.wishlists, queryFn: wishlistsApi.list });

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: qk.renter.wishlists });

  const createMutation = useMutation({
    mutationFn: (name: string) => wishlistsApi.create(name),
    onSuccess: () => {
      setNewName('');
      invalidate();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not create that wishlist.',
        'error'
      ),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => wishlistsApi.rename(id, name),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not rename that wishlist.',
        'error'
      ),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => wishlistsApi.remove(id),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: qk.listings.saved });
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not delete that wishlist.',
        'error'
      ),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        {(query.data ?? []).map((w) => (
          <View key={w.id}>
            <WishlistRow
              wishlist={w}
              editing={editingId === w.id}
              editingName={editingName}
              onStartEdit={() => {
                setEditingId(w.id);
                setEditingName(w.name);
              }}
              onChangeEditingName={setEditingName}
              onConfirmEdit={() => renameMutation.mutate({ id: w.id, name: editingName.trim() })}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => removeMutation.mutate(w.id)}
              busy={renameMutation.isPending || removeMutation.isPending}
            />
            <Divider style={{ marginTop: spacing.sm }} />
          </View>
        ))}
        {query.data?.length === 0 ? (
          <Text variant="callout" color="mutedForeground">
            No wishlists yet — create one below.
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <TextField
            placeholder="New wishlist name"
            value={newName}
            onChangeText={setNewName}
            returnKeyType="done"
          />
        </View>
        <Button
          label="Add"
          size="md"
          icon={<Plus size={15} color={colors.primaryForeground} />}
          loading={createMutation.isPending}
          disabled={!newName.trim()}
          onPress={() => createMutation.mutate(newName.trim())}
        />
      </View>
    </View>
  );
}

function WishlistRow({
  wishlist: w,
  editing,
  editingName,
  onStartEdit,
  onChangeEditingName,
  onConfirmEdit,
  onCancelEdit,
  onDelete,
  busy,
}: {
  wishlist: Wishlist;
  editing: boolean;
  editingName: string;
  onStartEdit: () => void;
  onChangeEditingName: (v: string) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const { colors, spacing } = useTheme();

  if (editing) {
    return (
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <TextField
            value={editingName}
            onChangeText={onChangeEditingName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onConfirmEdit}
          />
        </View>
        <Pressable onPress={onConfirmEdit} hitSlop={8}>
          <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
            Save
          </Text>
        </Pressable>
        <Pressable onPress={onCancelEdit} hitSlop={8}>
          <Text variant="callout" color="mutedForeground">
            Cancel
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{w.name}</Text>
        <Text variant="caption" color="mutedForeground">
          {w.count} {w.count === 1 ? 'home' : 'homes'}
        </Text>
      </View>
      <Pressable onPress={onStartEdit} disabled={busy} hitSlop={8}>
        <Pencil size={16} color={colors.mutedForeground} />
      </Pressable>
      {!w.isDefault ? (
        <Pressable onPress={onDelete} disabled={busy} hitSlop={8}>
          <Trash2 size={16} color={colors.destructive} />
        </Pressable>
      ) : null}
    </View>
  );
}
