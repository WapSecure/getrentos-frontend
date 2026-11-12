import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Building2, Home, LandPlot, type SgIcon } from '@sureground/icons/native';
import { Badge, Button, Divider, PressableScale, Text, useTheme } from '@sureground/ui-native';
import { stageProgress, type PurchaseSummary } from '@sureground/shared';
import { AcquisitionStatusBadges } from './AcquisitionStatusBadges';
import { StepProgress } from './StepProgress';
import { asHref, purchaseWorkspaceHref } from './purchaseHref';

const TYPE_ICON: Record<string, SgIcon> = {
  LAND: LandPlot,
  HOUSE: Home,
  DUPLEX: Home,
  BUNGALOW: Home,
};

/**
 * Purchases with their three separate statuses, how far along the usual path each is, and what
 * happens next. Rows open the buyer's or the representative's workspace. A released deposit never
 * reads as legal completion.
 */
export function PurchaseSummaryList({ purchases }: { purchases: readonly PurchaseSummary[] }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View>
      {purchases.map((purchase, index) => {
        const open = () => router.push(asHref(purchaseWorkspaceHref(purchase)));
        const Icon = TYPE_ICON[purchase.propertyType?.toUpperCase()] ?? Building2;
        const progress = stageProgress(purchase.operationalStage.code);
        return (
          <View key={`${purchase.role}-${purchase.transactionId}`}>
            {index > 0 ? <Divider style={{ marginVertical: spacing.md }} /> : null}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.secondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} color={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <PressableScale
                  onPress={open}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${purchase.title}`}
                >
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {purchase.title}
                  </Text>
                </PressableScale>
                {purchase.role === 'REPRESENTATIVE' ? (
                  <Badge
                    label={`Representing ${purchase.representing?.principalName ?? 'a buyer'}`}
                    tone="info"
                  />
                ) : null}
                <AcquisitionStatusBadges statuses={purchase} />
                {progress ? (
                  <StepProgress
                    label={`Stage: ${purchase.operationalStage.label}`}
                    done={progress.step}
                    total={progress.total}
                  />
                ) : null}
                <Text variant="callout" color="mutedForeground">
                  <Text variant="callout">Next: </Text>
                  {purchase.nextAction ?? 'Nothing due from anyone right now'}
                </Text>
                {purchase.waitingForYou ? (
                  <Badge
                    label={
                      purchase.pendingApprovals > 0
                        ? `${purchase.pendingApprovals} approval${purchase.pendingApprovals === 1 ? '' : 's'} for you`
                        : 'Waiting for you'
                    }
                    tone="warning"
                  />
                ) : null}
                <Button
                  label={purchase.waitingForYou ? 'Take action' : 'Open'}
                  size="sm"
                  variant={purchase.waitingForYou ? 'primary' : 'outline'}
                  iconRight={
                    <ArrowRight
                      size={16}
                      color={purchase.waitingForYou ? colors.primaryForeground : colors.foreground}
                    />
                  }
                  onPress={open}
                  style={{ alignSelf: 'flex-start' }}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
