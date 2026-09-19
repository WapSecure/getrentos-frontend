import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import { Button, Card, Divider, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { applicationsApi, type ApplicationNote } from '@/lib/api/applications';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

interface Props {
  applicationId: string;
}

export function ApplicationNotesSection({ applicationId }: Props) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: qk.renter.applicationNotes(applicationId),
    queryFn: () => applicationsApi.listNotes(applicationId),
  });

  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: qk.renter.applicationNotes(applicationId) });

  const createMutation = useMutation({
    mutationFn: (content: string) => applicationsApi.createNote(applicationId, content),
    onSuccess: () => {
      invalidate();
      setDraft('');
      setComposing(false);
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save this note.', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      applicationsApi.updateNote(applicationId, id, content),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update this note.', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.deleteNote(applicationId, id),
    onSuccess: invalidate,
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not delete this note.', 'error'),
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="bodyStrong">Your private notes</Text>
        {!composing ? (
          <Pressable
            onPress={() => setComposing(true)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Plus size={14} color={colors.primary} />
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Add
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text variant="caption" color="mutedForeground">
        Only visible to you — not shared with the landlord.
      </Text>

      {composing ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            placeholder="e.g. Follow up about parking"
            multiline
            numberOfLines={3}
            value={draft}
            onChangeText={setDraft}
            autoFocus
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setComposing(false);
                  setDraft('');
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Save"
                loading={createMutation.isPending}
                disabled={!draft.trim()}
                onPress={() => createMutation.mutate(draft.trim())}
              />
            </View>
          </View>
        </View>
      ) : null}

      {query.data && query.data.length > 0 ? (
        <Card elevated padding="none">
          {query.data.map((note: ApplicationNote, i) => (
            <View key={note.id}>
              {i > 0 ? <Divider /> : null}
              <View style={{ padding: spacing.lg }}>
                {editingId === note.id ? (
                  <View style={{ gap: spacing.sm }}>
                    <TextField
                      multiline
                      numberOfLines={3}
                      value={editingDraft}
                      onChangeText={setEditingDraft}
                      autoFocus
                    />
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Button label="Cancel" variant="ghost" onPress={() => setEditingId(null)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          label="Save"
                          loading={updateMutation.isPending}
                          disabled={!editingDraft.trim()}
                          onPress={() =>
                            updateMutation.mutate({ id: note.id, content: editingDraft.trim() })
                          }
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text variant="callout">{note.content}</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: spacing.sm,
                      }}
                    >
                      <Text variant="caption" color="mutedForeground">
                        {formatDate(note.updatedAt, 'short')}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Pressable
                          onPress={() => {
                            setEditingId(note.id);
                            setEditingDraft(note.content);
                          }}
                          hitSlop={8}
                        >
                          <Pencil size={14} color={colors.mutedForeground} />
                        </Pressable>
                        <Pressable onPress={() => removeMutation.mutate(note.id)} hitSlop={8}>
                          <Trash2 size={14} color={colors.destructive} />
                        </Pressable>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          ))}
        </Card>
      ) : !composing ? (
        <Text variant="callout" color="mutedForeground">
          No notes yet.
        </Text>
      ) : null}
    </View>
  );
}
