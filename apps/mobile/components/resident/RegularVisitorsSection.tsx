import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from '@sureground/icons/native';
import { Badge, Button, Card, Text, useTheme, useToast } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { AuthoriseRegularVisitorForm } from '@/components/estate/gate/AuthoriseRegularVisitorForm';
import { GroupLabel } from '@/components/resident/VisitorParts';
import { residentApi } from '@/lib/api/resident';
import { CONTRACTOR_STATUS_TONE, type ContractorPass } from '@/lib/api/estateGate';
import { qk } from '@/lib/query/keys';
import { usePagedList } from '@/lib/query/usePagedList';
import { errorMessage } from '@/lib/api/client';

/** People who come often, on one code, on the days the household chooses. */
export function RegularVisitorsSection({ estateName }: { estateName?: string }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const list = usePagedList(qk.resident.regularVisitors, (page) =>
    residentApi.listRegularVisitors(page, 10)
  );
  const first = list.query.data?.pages[0];
  const available = first?.available ?? false;

  const withdraw = useMutation({
    mutationFn: (passId: string) => residentApi.withdrawRegularVisitor(passId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.resident.regularVisitors }),
    onError: (err) => toast.show(errorMessage(err, "Couldn't withdraw that pass."), 'error'),
  });

  const confirmWithdraw = (visitor: ContractorPass) =>
    Alert.alert(
      `Withdraw ${visitor.name}?`,
      'Their code stops working at the gate straight away. You can add them again later with a new code.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: () => withdraw.mutate(visitor.id) },
      ]
    );

  if (list.query.isLoading) return null;

  return (
    <View style={{ gap: spacing.md }}>
      <GroupLabel label="Regular visitors" count={list.total} />
      {list.items.length === 0 ? (
        <Card>
          <Text variant="caption" color="mutedForeground">
            {available
              ? 'Someone who comes often, like a cleaner or a driver, can use one code on the days you choose.'
              : "Your estate's plan doesn't include regular visitor passes. Ask the estate office to set one up for you."}
          </Text>
        </Card>
      ) : (
        list.items.map((visitor) => (
          <Card key={visitor.id} elevated>
            <View style={{ gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {visitor.name}
                    {visitor.trade ? (
                      <Text variant="callout" color="mutedForeground">
                        {` · ${visitor.trade}`}
                      </Text>
                    ) : null}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {visitor.scheduleLabel}
                    {visitor.visitCount > 0
                      ? ` · ${visitor.visitCount} ${visitor.visitCount === 1 ? 'visit' : 'visits'}`
                      : ''}
                  </Text>
                </View>
                <Badge label={visitor.statusLabel} tone={CONTRACTOR_STATUS_TONE[visitor.status]} />
              </View>
              {visitor.status === 'ACTIVE' ? (
                <Button
                  label="Withdraw"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  accessibilityLabel={`Withdraw ${visitor.name}'s regular pass`}
                  loading={withdraw.isPending && withdraw.variables === visitor.id}
                  onPress={() => confirmWithdraw(visitor)}
                  style={{ alignSelf: 'flex-start' }}
                />
              ) : null}
            </View>
          </Card>
        ))
      )}
      {list.hasMore ? (
        <Button
          label="Show more"
          variant="ghost"
          loading={list.isLoadingMore}
          onPress={list.loadMore}
        />
      ) : null}
      {available ? (
        <Button
          label="Add regular visitor"
          variant="outline"
          icon={<Plus size={16} color={colors.primary} />}
          onPress={() => setAdding(true)}
        />
      ) : null}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a regular visitor">
        {adding ? (
          <AuthoriseRegularVisitorForm
            forHousehold
            estateName={estateName}
            maxDays={first?.maxDays}
            createPass={({ householdId: _unused, ...body }) => residentApi.addRegularVisitor(body)}
            onCreated={() => qc.invalidateQueries({ queryKey: qk.resident.regularVisitors })}
            onDone={() => setAdding(false)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}
