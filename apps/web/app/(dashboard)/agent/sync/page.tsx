'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Cloud, CloudOff, Wifi, WifiOff } from 'lucide-react';
import { Alert, Badge, Button, EmptyState, ListSkeleton, PageErrorState } from '@getrentos/ui';
import { formatRelativeTime } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { agentService } from '@/services/agentService';
import { agentKeys } from '@/lib/queryKeys';
import { AGENT_QUEUE_CHANGED } from '@/lib/agentQueueEvents';
import {
  listAgentQueuedRecords,
  syncAgentQueuedRecords,
  unownedAgentRecordCount,
} from '@/lib/agentQueueSync';
import { useAgentUser } from '../layout';

const deviceQueueKey = ['agent', 'device-queue'] as const;
const recordLabels = {
  inspection: 'Inspection report',
  verification: 'Verification visit',
  document: 'Document',
  message: 'Message',
};

export default function AgentSyncPage() {
  const ownerId = useAgentUser()?.id;
  const ownedQueueKey = [...deviceQueueKey, ownerId];
  const queryClient = useQueryClient();
  const history = useQuery({
    queryKey: [...agentKeys.sync, ownerId],
    queryFn: () => unwrap(agentService.getSyncItems(ownerId)),
  });
  const queue = useQuery({
    queryKey: ownedQueueKey,
    queryFn: () => listAgentQueuedRecords(ownerId),
  });
  const legacy = useQuery({
    queryKey: ['agent', 'unowned-queue', ownerId],
    queryFn: unownedAgentRecordCount,
  });
  const [isOnline, setIsOnline] = useState(true);
  const sync = useMutation({
    mutationFn: (id: string | undefined) => syncAgentQueuedRecords(id, ownerId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['agent'] }),
  });

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    const refreshQueue = () => {
      void queryClient.invalidateQueries({ queryKey: deviceQueueKey });
      void queryClient.invalidateQueries({ queryKey: ['agent', 'unowned-queue'] });
    };
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener(AGENT_QUEUE_CHANGED, refreshQueue);
    window.addEventListener('storage', refreshQueue);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener(AGENT_QUEUE_CHANGED, refreshQueue);
      window.removeEventListener('storage', refreshQueue);
    };
  }, [queryClient]);

  const records = queue.data ?? [];
  const syncError = sync.data?.error || sync.error?.message;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sync Center</h1>
          <p className="mt-1 text-muted-foreground">
            {records.length} records waiting on this device
          </p>
        </div>
        <Button
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => sync.mutate(undefined)}
          isLoading={sync.isPending}
          loadingText="Syncing..."
          disabled={!records.length || !isOnline || sync.isPending || queue.isError}
        >
          Sync All
        </Button>
      </div>

      <Alert
        variant={isOnline ? 'success' : 'warning'}
        icon={isOnline ? Wifi : WifiOff}
        title={isOnline ? 'Connected' : 'Offline'}
        className="mb-6"
      >
        {isOnline
          ? 'Queued records are removed from this device only after GetRentos confirms they were saved.'
          : 'Queued records remain saved on this device. Uploads will retry when you reconnect.'}
      </Alert>
      {Boolean(legacy.data) && (
        <Alert variant="warning" className="mb-4" title="Older uploads need account review">
          Some older records have no account owner. They remain on this device and will not be
          uploaded automatically. Contact support before retrying them.
        </Alert>
      )}
      {syncError && (
        <Alert variant="danger" className="mb-4" title="Upload could not be completed">
          {syncError} Unsent records remain on this device. Retry when the issue is resolved.
        </Alert>
      )}
      {sync.data && !syncError && sync.data.synced > 0 && (
        <Alert variant="success" className="mb-4">
          {sync.data.synced} record{sync.data.synced === 1 ? '' : 's'} saved to GetRentos.
        </Alert>
      )}

      <h2 className="mb-3 text-lg font-semibold">Waiting on this device</h2>
      {queue.isPending ? (
        <ListSkeleton rows={3} label="Loading device records" />
      ) : queue.isError ? (
        <PageErrorState
          title="Device records could not be read"
          description="We could not open this device's upload queue. Please retry."
          onRetry={() => void queue.refetch()}
          isRetrying={queue.isFetching}
        />
      ) : records.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title="No uploads waiting"
          description="This device has no queued records."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {records.map((record) => (
            <li key={record.id} className="flex items-center gap-3 p-4">
              <CloudOff className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{recordLabels[record.type]}</p>
                <p className="text-xs text-muted-foreground">
                  Captured {formatRelativeTime(record.createdAt)}
                </p>
                <Badge variant="warning" className="mt-1">
                  Waiting to upload
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sync.mutate(record.id)}
                disabled={!isOnline || sync.isPending}
                isLoading={sync.isPending && sync.variables === record.id}
              >
                Retry
              </Button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 mt-8 text-lg font-semibold">Saved on GetRentos</h2>
      {history.isPending ? (
        <ListSkeleton rows={3} label="Loading saved records" />
      ) : history.isError ? (
        <PageErrorState
          title="Saved records are unavailable"
          description="Device uploads are shown above. Retry to load records already saved to GetRentos."
          onRetry={() => void history.refetch()}
          isRetrying={history.isFetching}
        />
      ) : history.data?.length ? (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {history.data.map((item) => (
            <li key={`${item.recordType}:${item.id}`} className="flex items-center gap-3 p-4">
              <Cloud className="h-4 w-4 shrink-0 text-success" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.recordLabel}</p>
              <Badge variant="success" className="shrink-0">
                Saved on server
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Cloud} title="No saved records yet" />
      )}
    </>
  );
}
