import { View } from 'react-native';
import { Badge, useTheme } from '@sureground/ui-native';
import {
  legalVariant,
  moneyVariant,
  stageVariant,
  type AcquisitionStatuses,
} from '@sureground/shared';

/**
 * A purchase's three statuses, always side by side and never merged (DIA-16): what is happening,
 * where the deposit is, and how far the legal transfer has got. The money label already starts
 * with "Deposit", because Payment Protection covers the deposit only.
 */
export function AcquisitionStatusBadges({ statuses }: { statuses: AcquisitionStatuses }) {
  const { spacing } = useTheme();
  const { operationalStage, moneyStatus, legalStatus } = statuses;
  return (
    <View
      accessibilityLabel="Status"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}
    >
      <Badge label={operationalStage.label} tone={stageVariant(operationalStage.code)} />
      <Badge label={moneyStatus.label} tone={moneyVariant(moneyStatus.code)} />
      <Badge label={`Legal: ${legalStatus.label}`} tone={legalVariant(legalStatus.code)} />
    </View>
  );
}
