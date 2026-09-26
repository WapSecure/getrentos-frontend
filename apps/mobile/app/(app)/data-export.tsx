import { Share, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Database, Download } from 'lucide-react-native';
import {
  Button,
  Card,
  Divider,
  ErrorState,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { dataExportApi } from '@/lib/api/dataExport';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function DataExport() {
  const { colors, spacing } = useTheme();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.renter.dataExport,
    queryFn: dataExportApi.get,
    enabled: false,
  });

  const rows = query.data
    ? [
        { label: 'Applications', count: query.data.applications.length },
        { label: 'Saved listings', count: query.data.savedListings.length },
        { label: 'Leases', count: query.data.leases.length },
        { label: 'Payments', count: query.data.payments.length },
        { label: 'Maintenance requests', count: query.data.maintenanceRequests.length },
        { label: 'Documents', count: query.data.documents.length },
      ]
    : [];

  const share = async () => {
    const result = query.data ?? (await query.refetch()).data;
    if (!result) {
      toast.show('Could not prepare your export.', 'error');
      return;
    }
    try {
      await Share.share({
        message: JSON.stringify(result, null, 2),
        title: 'GetRentos data export',
      });
    } catch {
      toast.show('Could not share your export.', 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Data portability"
        title="Export your data"
        subtitle="Prepare a secure copy of your GetRentos records"
        onBack={() => router.back()}
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <Screen padded>
          <Card elevated>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Database size={20} color={colors.primary} />
              <Text variant="heading">Your GetRentos data</Text>
            </View>
            <Text variant="callout" color="mutedForeground" style={{ marginTop: spacing.sm }}>
              Download a copy of your profile, applications, lease, payment history, maintenance
              requests and documents.
            </Text>
          </Card>

          {query.isFetching ? (
            <View style={{ gap: spacing.md }}>
              <Skeleton height={140} radius={16} />
            </View>
          ) : rows.length > 0 ? (
            <Card elevated padding="none">
              {rows.map((r, i) => (
                <View key={r.label}>
                  {i > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing.lg,
                    }}
                  >
                    <Text variant="callout">{r.label}</Text>
                    <Text variant="callout" color="mutedForeground">
                      {r.count}
                    </Text>
                  </View>
                </View>
              ))}
              {query.data ? (
                <>
                  <Divider />
                  <View style={{ padding: spacing.lg }}>
                    <Text variant="caption" color="mutedForeground">
                      Prepared {formatDate(query.data.exportedAt, 'short')}
                    </Text>
                  </View>
                </>
              ) : null}
            </Card>
          ) : null}

          <Button
            label={rows.length > 0 ? 'Share export again' : 'Prepare & share my data'}
            icon={<Download size={16} color={colors.primaryForeground} />}
            loading={query.isFetching}
            onPress={share}
          />
        </Screen>
      )}
    </View>
  );
}
