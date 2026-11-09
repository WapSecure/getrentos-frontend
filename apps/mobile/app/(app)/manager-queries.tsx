import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquareText, Plus } from 'lucide-react-native';
import {
  Button,
  FormAlert,
  IconButton,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  managementApi,
  QUERY_CATEGORY_LABEL,
  type QueryCategory,
  type QuerySummary,
} from '@/lib/api/management';
import { errorMessage } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { QueryRow } from '@/components/management/QueryRow';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const CATEGORIES = Object.keys(QUERY_CATEGORY_LABEL) as QueryCategory[];

/**
 * Questions from an owner to whoever manages their property, as threads with a
 * 24-hour first-reply promise. Landlords and owners both ask from this side.
 */
export default function ManagerQueries() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [asking, setAsking] = useState(false);

  const list = useQuery({
    queryKey: qk.management.queries('owner'),
    queryFn: () => managementApi.queries('owner'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Your manager"
        title="Questions"
        subtitle="Replies due within 24 hours, kept on record"
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => setAsking(true)}
            accessibilityLabel="Ask a question"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={4} />}
        isEmpty={(list.data ?? []).length === 0}
        empty={{
          icon: <MessageSquareText size={32} color={colors.mutedForeground} />,
          title: 'No questions yet',
          description: 'Ask whoever manages your property about rent, statements or repairs.',
          action: <Button label="Ask a question" onPress={() => setAsking(true)} />,
        }}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={list.data ?? []}
          keyExtractor={(q) => q.id}
          renderItem={({ item }: { item: QuerySummary }) => <QueryRow query={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => list.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      </QueryState>

      <Sheet open={asking} onClose={() => setAsking(false)} title="Ask your manager">
        <AskForm
          key={asking ? 'open' : 'closed'}
          onDone={(id) => {
            setAsking(false);
            router.push(`/(app)/manager-query/${id}`);
          }}
        />
      </Sheet>
    </View>
  );
}

function AskForm({ onDone }: { onDone: (id: string) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const mandates = useQuery({
    queryKey: qk.management.mandates,
    queryFn: () => managementApi.myMandates(),
  });
  // Only a property with a live manager has someone to ask.
  const properties = [
    ...new Map(
      (mandates.data ?? [])
        .filter((m) => m.status === 'ACTIVE' || m.status === 'SUSPENDED')
        .map((m) => [m.propertyId, m.propertyTitle ?? 'Property'] as const)
    ).entries(),
  ].map(([value, label]) => ({ value, label }));

  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [category, setCategory] = useState<QueryCategory>('GENERAL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const ask = useMutation({
    mutationFn: () =>
      managementApi.askQuery({
        propertyId: propertyId!,
        category,
        subject: subject.trim(),
        body: body.trim(),
      }),
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: ['management', 'queries'] });
      onDone(q.id);
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send your question.'), 'error'),
  });

  if (mandates.isLoading) return <ListSkeleton rows={3} />;
  if (properties.length === 0) {
    return (
      <FormAlert
        tone="info"
        message="None of your properties has a manager right now, so there is no one to ask."
      />
    );
  }

  const valid = !!propertyId && subject.trim().length >= 3 && body.trim().length >= 5;
  return (
    <View style={{ gap: spacing.lg }}>
      <ChipSelect
        label="Property"
        options={properties}
        value={propertyId}
        onChange={setPropertyId}
      />
      <ChipSelect
        label="Topic"
        options={CATEGORIES.map((c) => ({ value: c, label: QUERY_CATEGORY_LABEL[c] }))}
        value={category}
        onChange={setCategory}
      />
      <TextField
        label="Subject"
        placeholder="e.g. September statement"
        value={subject}
        onChangeText={setSubject}
        maxLength={140}
        required
      />
      <TextField
        label="Your question"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={4}
        required
      />
      <Text variant="caption" color="mutedForeground">
        Your manager owes you a first reply within 24 hours. The whole conversation stays here.
      </Text>
      <Button
        label="Send question"
        loading={ask.isPending}
        disabled={!valid || ask.isPending}
        onPress={() => ask.mutate()}
      />
    </View>
  );
}
