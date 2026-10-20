import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import {
  Button,
  Divider,
  IconButton,
  LinkButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { wishlistsApi, type Wishlist } from '@/lib/api/wishlists';
import { ApiError } from '@/lib/api/client';
import { useOptimisticMutation } from '@/lib/query/optimistic';

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

  // A rename shows at once; a refusal puts the old name back.
  const renameMutation = useOptimisticMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => wishlistsApi.rename(id, name),
    patches: ({ id, name }) => [
      {
        queryKey: qk.renter.wishlists,
        update: (old) => (old as Wishlist[]).map((w) => (w.id === id ? { ...w, name } : w)),
      },
    ],
    errorMessage: 'Could not rename that wishlist.',
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
              onConfirmEdit={() => {
                renameMutation.mutate({ id: w.id, name: editingName.trim() });
                setEditingId(null);
              }}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => removeMutation.mutate(w.id)}
              busy={renameMutation.isPending || removeMutation.isPending}
            />
            <Divider style={{ marginTop: spacing.sm }} />
          </View>
        ))}
        {query.isPending ? (
          <>
            <Skeleton height={40} />
            <Skeleton height={40} />
          </>
        ) : null}
        {query.data?.length === 0 ? (
          <Text variant="callout" color="mutedForeground">
            No wishlists yet: create one below.
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <TextField
            placeholder="New wishlist name"
            accessibilityLabel="New wishlist name"
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
            accessibilityLabel="Wishlist name"
            value={editingName}
            onChangeText={onChangeEditingName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onConfirmEdit}
          />
        </View>
        <LinkButton label="Save" onPress={onConfirmEdit} />
        <LinkButton label="Cancel" tone="muted" onPress={onCancelEdit} />
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
      <IconButton
        accessibilityLabel={`Rename ${w.name}`}
        icon={<Pencil size={16} color={colors.mutedForeground} />}
        onPress={onStartEdit}
        disabled={busy}
      />
      {!w.isDefault ? (
        <IconButton
          accessibilityLabel={`Delete ${w.name}`}
          icon={<Trash2 size={16} color={colors.destructive} />}
          onPress={onDelete}
          disabled={busy}
        />
      ) : null}
    </View>
  );
}
