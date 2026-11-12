'use client';

import { useRouter } from 'next/navigation';
import { Select } from '@sureground/ui';
import { NIGERIA_STATES } from '@/lib/constants/locations';
import { DEVELOPMENTS_PATH } from '@/lib/publicDevelopments';

const ALL = '__all__';
const OPTIONS = [
  { value: ALL, label: 'All states' },
  ...NIGERIA_STATES.map((s) => ({ value: s, label: s })),
];

export function DevelopmentStateFilter({ state }: { state?: string }) {
  const router = useRouter();
  return (
    <div className="w-full sm:w-60">
      <Select
        value={state || ALL}
        ariaLabel="State"
        options={OPTIONS}
        searchPlaceholder="Search states"
        onValueChange={(v) =>
          router.push(
            v === ALL ? DEVELOPMENTS_PATH : `${DEVELOPMENTS_PATH}?state=${encodeURIComponent(v)}`
          )
        }
      />
    </div>
  );
}
