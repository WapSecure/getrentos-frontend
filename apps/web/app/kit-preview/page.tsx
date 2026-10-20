'use client';

import { useQuery } from '@tanstack/react-query';
import { Button, Switch, useOptimisticMutation, useToast } from '@getrentos/ui';

let serverValue = false;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function KitPreview() {
  const toast = useToast();
  const pref = useQuery({
    queryKey: ['preview-pref'],
    queryFn: async () => {
      await wait(300);
      return { on: serverValue };
    },
  });
  const toggle = useOptimisticMutation<void, { on: boolean; fail: boolean }>({
    mutationFn: async ({ on, fail }) => {
      await wait(1200);
      if (fail) throw new Error('The server refused that change.');
      serverValue = on;
    },
    patches: ({ on }) => [{ queryKey: ['preview-pref'], update: () => ({ on }) }],
  });
  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Toasts and optimistic</h1>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => toast.success('Inspection booked')}>Success</Button>
        <Button
          variant="outline"
          onClick={() => toast.error('Payment failed. Your card was declined.')}
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info('Item archived', {
              action: { label: 'Undo', onClick: () => toast.success('Restored') },
            })
          }
        >
          With undo
        </Button>
      </div>
      <Switch
        label="Email alerts (succeeds)"
        checked={pref.data?.on ?? false}
        onCheckedChange={(on) => toggle.mutate({ on, fail: false })}
      />
      <Switch
        label="Email alerts (fails, rolls back)"
        checked={pref.data?.on ?? false}
        onCheckedChange={(on) => toggle.mutate({ on, fail: true })}
      />
      <p id="state">
        server={String(serverValue)} cache={String(pref.data?.on)}
      </p>
    </main>
  );
}
