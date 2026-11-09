import { Pressable, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, PenLine } from '@sureground/icons/native';
import { Badge, QueryState, Skeleton, Text, useTheme } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  committeeTitleLabel,
  estateGovernanceApi,
  governanceKeys,
  type GovernanceRecord,
} from '@/lib/api/estateGovernance';
import { formatDate, formatTime } from '@/lib/format';

export function GovernanceVersionsSheet({
  estateId,
  record,
  onClose,
}: {
  estateId: string;
  record: GovernanceRecord | null;
  onClose: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({
    queryKey: governanceKeys.versions(estateId, record?.id ?? ''),
    queryFn: () => estateGovernanceApi.governanceVersions(estateId, record!.id),
    enabled: !!estateId && !!record,
  });
  return (
    <Sheet open={!!record} onClose={onClose} title="Version history">
      <QueryState query={query} skeleton={<Skeleton height={120} radius={radius.md} />}>
        <View>
          {(query.data ?? []).map((v) => (
            <Pressable
              key={v.id}
              onPress={() => WebBrowser.openBrowserAsync(v.url)}
              accessibilityRole="link"
              accessibilityLabel={`Open version ${v.version}, ${v.size}, uploaded ${formatDate(v.createdAt, 'medium')}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                minHeight: 56,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <FileText size={18} color={colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text variant="callout" style={{ fontWeight: '600' }}>
                  Version {v.version}
                  {v.id === record?.id ? ' · current' : ''}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {v.size} · uploaded {formatDate(v.createdAt, 'medium')}
                </Text>
              </View>
              <ExternalLink size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </QueryState>
    </Sheet>
  );
}

export function GovernanceSignaturesSheet({
  estateId,
  record,
  onClose,
}: {
  estateId: string;
  record: GovernanceRecord | null;
  onClose: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({
    queryKey: governanceKeys.signatures(estateId, record?.id ?? ''),
    queryFn: () => estateGovernanceApi.governanceSignatures(estateId, record!.id),
    enabled: !!estateId && !!record,
  });
  const progress = record?.signatureProgress;
  return (
    <Sheet open={!!record} onClose={onClose} title="Signatures">
      {progress ? (
        <Text variant="callout" color="mutedForeground" style={{ marginBottom: spacing.sm }}>
          {progress.signed} of {progress.total} committee{' '}
          {progress.total === 1 ? 'member has' : 'members have'} signed.
          {record?.status === 'approved' ? ' It’s approved.' : ' It’s approved once all have.'}
        </Text>
      ) : null}
      <QueryState query={query} skeleton={<Skeleton height={120} radius={radius.md} />}>
        {!query.data?.length ? (
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
            <PenLine size={28} color={colors.mutedForeground} />
            <Text variant="callout" color="mutedForeground" center>
              Nobody has signed yet. Committee members sign from Governance in their resident app.
            </Text>
          </View>
        ) : (
          <View>
            {query.data.map((s) => (
              <View
                key={s.id}
                accessible
                accessibilityLabel={`${s.residentName}, ${s.unitLabel}, ${committeeTitleLabel(s.title)}, signed ${formatDate(s.signedAt, 'medium')} at ${formatTime(s.signedAt)}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  minHeight: 56,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                    {s.residentName}
                  </Text>
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {s.unitLabel} · signed {formatDate(s.signedAt, 'medium')},{' '}
                    {formatTime(s.signedAt)}
                  </Text>
                </View>
                <Badge label={committeeTitleLabel(s.title)} />
              </View>
            ))}
          </View>
        )}
      </QueryState>
    </Sheet>
  );
}
