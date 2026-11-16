import { Badge } from '@sureground/ui';
import { cn, legalVariant, moneyVariant, stageVariant } from '@sureground/shared';
import type { AcquisitionStatuses } from '@/types/transactionWorkspace';

// Never merged; the money label starts with "Deposit" because Payment Protection covers the deposit only.
export const AcquisitionStatusBadges = ({
  statuses,
  className,
}: {
  statuses: AcquisitionStatuses;
  className?: string;
}) => {
  const { operationalStage, moneyStatus, legalStatus } = statuses;
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Status">
      <li>
        <Badge dot variant={stageVariant(operationalStage.code)} title="Progress">
          {operationalStage.label}
        </Badge>
      </li>
      <li>
        <Badge dot variant={moneyVariant(moneyStatus.code)} title={moneyStatus.note}>
          {moneyStatus.label}
        </Badge>
      </li>
      <li>
        <Badge dot variant={legalVariant(legalStatus.code)} title="Legal transfer">
          {`Legal: ${legalStatus.label}`}
        </Badge>
      </li>
    </ul>
  );
};
