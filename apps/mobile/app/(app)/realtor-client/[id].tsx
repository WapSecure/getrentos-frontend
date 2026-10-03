import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, MapPin, MessageCircle, Plus } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormAlert,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { clientName, clientRole, realtorApi } from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { ContactActions } from '@/components/realtor/RealtorUI';

/** One client: how to reach them, and the properties they've trusted you with. */
export default function RealtorClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const clients = useQuery({ queryKey: qk.realtor.clients, queryFn: () => realtorApi.clients() });
  const c = clients.data?.items.find((x) => x.id === id);
  const properties = useQuery({
    queryKey: qk.realtor.assigned(id),
    queryFn: () => realtorApi.assignedProperties(id),
    enabled: c?.status === 'ACTIVE',
  });
  const listings = useQuery({
    queryKey: qk.realtor.listings,
    queryFn: () => realtorApi.listings(),
  });

  const message = useMutation({
    mutationFn: () => realtorApi.startConversation(c!.clientId),
    onSuccess: (conversation) =>
      router.push({
        pathname: '/(app)/realtor-conversation/[id]',
        params: { id: conversation.id },
      }),
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not open the chat.', 'error'),
  });

  const listedIds = new Set(
    listings.data?.items.filter((l) => l.status !== 'CLOSED').map((l) => l.propertyId) ?? []
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={clients.isRefetching || properties.isRefetching}
          onRefresh={() => {
            clients.refetch();
            properties.refetch();
          }}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <DetailHeader
        eyebrow="Client"
        title={c ? clientName(c) : 'Client'}
        onBack={() => router.back()}
      />
      {clients.isError && !clients.data ? (
        <ErrorState onRetry={() => clients.refetch()} />
      ) : clients.isPending ? (
        <Skeleton height={160} radius={radius.lg} />
      ) : !c ? (
        <EmptyState title="Client not found" description="This relationship may have ended." />
      ) : (
        <>
          <Card elevated style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar name={clientName(c)} size={52} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{clientName(c)}</Text>
                <Text variant="caption" color="mutedForeground">
                  {clientRole(c)} · client since {formatDate(c.createdAt, 'medium')}
                </Text>
              </View>
            </View>
            <ContactActions phone={c.client.phone} email={c.client.email} name={clientName(c)} />
            <Button
              label="Message on GetRentos"
              variant="secondary"
              icon={<MessageCircle size={16} color={colors.foreground} />}
              loading={message.isPending}
              onPress={() => message.mutate()}
            />
          </Card>

          <View style={{ gap: spacing.sm }}>
            <Text variant="heading" accessibilityRole="header">
              Properties you handle
            </Text>
            {properties.isPending ? (
              <Skeleton height={72} radius={radius.lg} />
            ) : properties.isError ? (
              <ErrorState onRetry={() => properties.refetch()} />
            ) : !properties.data?.items.length ? (
              <FormAlert
                tone="info"
                message={`${clientName(c)} hasn’t assigned you a property yet. They choose which ones from their Realtors & agents screen.`}
              />
            ) : (
              properties.data.items.map((p) => {
                const listed = listedIds.has(p.id);
                return (
                  <Card
                    key={p.id}
                    elevated
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                  >
                    <Building2 size={20} color={colors.primary} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {p.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color={colors.mutedForeground} />
                        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                          {[p.city, p.state].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    </View>
                    {listed ? (
                      <Text variant="caption" color="mutedForeground">
                        Listed
                      </Text>
                    ) : (
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/(app)/realtor-new-listing',
                            params: { relationshipId: c.id, propertyId: p.id },
                          })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`List ${p.title}`}
                        hitSlop={8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          minHeight: 44,
                        }}
                      >
                        <Plus size={16} color={colors.primary} />
                        <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                          List it
                        </Text>
                      </Pressable>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
