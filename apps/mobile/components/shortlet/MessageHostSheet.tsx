import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EyeOff } from 'lucide-react-native';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type ShortletListing } from '@/lib/api/shortlets';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';

type HostOf = Pick<ShortletListing, 'id' | 'title' | 'hostName'>;

/** Ask the host a question; the thread continues in Messages. */
export function MessageHostSheet(props: { open: boolean; onClose: () => void; listing: HostOf }) {
  return <Inner key={props.open ? 'open' : 'closed'} {...props} />;
}

function Inner({
  open,
  onClose,
  listing,
}: {
  open: boolean;
  onClose: () => void;
  listing: HostOf;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState('');
  const first = listing.hostName?.split(/\s+/)[0] || 'the host';

  const send = useMutation({
    mutationFn: () => shortletsApi.messageHost(listing.id, text.trim()),
    onSuccess: (c) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.shortlets.conversations });
      onClose();
      router.push({ pathname: '/(app)/shortlet-conversation/[id]', params: { id: c.id } });
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Message not sent.', 'error'),
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Message ${first}`}
      footer={
        <Button
          label="Send message"
          loading={send.isPending}
          disabled={text.trim().length < 2}
          onPress={() => send.mutate()}
        />
      }
    >
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          Ask about {listing.title}: parking, early check-in, anything the listing doesn&apos;t say.
        </Text>
        <TextField
          value={text}
          onChangeText={setText}
          placeholder={`Hi ${first}, …`}
          accessibilityLabel="Your message"
          multiline
          autoFocus
          maxLength={2000}
          containerStyle={{ minHeight: 120 }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <EyeOff size={14} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            Phone numbers and emails stay hidden until a stay is paid. Book and pay on GetRentos so
            you&apos;re covered by Payment Protection and the Guest Promise.
          </Text>
        </View>
      </View>
    </Sheet>
  );
}
