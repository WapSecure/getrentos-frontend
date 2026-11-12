'use client';

import { Alert } from '@sureground/ui/Alert';
import { CircleDashed } from '@sureground/icons';
import { formatDate } from '@/lib/format';
import type { LandOpenCondition } from '@/types/land';

export const OpenConditionsNotice = ({
  conditions,
  action = 'reservations and offers',
}: {
  conditions?: LandOpenCondition[];
  action?: string;
}) => {
  if (!conditions?.length) return null;
  return (
    <Alert variant="info" icon={CircleDashed} title="Verified with conditions">
      <p>
        Sureground approved this land subject to the following. {capitalise(action)} open once they
        are met.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {conditions.map((condition) => (
          <li key={condition.text}>
            {condition.text}
            {condition.dueAt && (
              <span className="text-muted-foreground">
                {' '}
                (expected by {formatDate(condition.dueAt)})
              </span>
            )}
          </li>
        ))}
      </ul>
    </Alert>
  );
};

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
