'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw,
  CloudOff,
  Cloud,
  AlertCircle,
  ClipboardCheck,
  UserCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Alert, Badge, Button, EmptyState, ListSkeleton } from '@getrentos/ui';
import { formatRelativeTime } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { agentService } from '@/services/agentService';
import { agentKeys } from '@/lib/queryKeys';

export default function AgentSyncPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: agentKeys.sync,
    queryFn: () => unwrap(agentService.getSyncItems()),
  });
  const [locallySynced, setLocallySynced] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const syncItem = (id: string) => {
    setLocallySynced((prev) => new Set(prev).add(id));
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    window.setTimeout(() => {
      setLocallySynced((prev) => {
        const next = new Set(prev);
        items.forEach((i) => {
          if (i.syncStatus !== 'synced') next.add(i.id);
        });
        return next;
      });
      setIsSyncingAll(false);
    }, 1200);
  };

  const pendingCount = items.filter(
    (i) => !locallySynced.has(i.id) && i.syncStatus !== 'synced'
  ).length;

  if (isLoading) {
    return <ListSkeleton rows={5} label="Loading sync records" />;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sync Center</h1>
          <p className="text-muted-foreground mt-1">Records captured offline, waiting to upload</p>
        </div>
        <Button
          variant="primary"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={handleSyncAll}
          isLoading={isSyncingAll}
          loadingText="Syncing..."
          disabled={pendingCount === 0 || !isOnline}
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
          ? 'Inspections and verifications you capture in the field are saved locally and sync automatically when possible.'
          : 'You are working offline. Records will be saved on this device and synced once you reconnect.'}
      </Alert>

      {items.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title="All caught up"
          description="Every record you've captured has been synced to GetRentos."
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {items.map((item) => {
            const TypeIcon = item.recordType === 'inspection' ? ClipboardCheck : UserCheck;
            const synced = locallySynced.has(item.id) || item.syncStatus === 'synced';
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 hover:bg-secondary transition-colors"
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    item.syncStatus === 'failed' ? 'bg-destructive-subtle' : 'bg-secondary'
                  }`}
                >
                  {item.syncStatus === 'failed' ? (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <TypeIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.recordLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Captured {formatRelativeTime(item.capturedAt)}
                    {item.sizeLabel ? ` · ${item.sizeLabel}` : ''}
                  </p>
                </div>
                {synced ? (
                  <Badge
                    variant="success"
                    icon={<Cloud className="w-3 h-3" />}
                    className="shrink-0"
                  >
                    Synced
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    icon={<CloudOff className="w-3.5 h-3.5" />}
                    onClick={() => syncItem(item.id)}
                    disabled={!isOnline}
                  >
                    {item.syncStatus === 'failed' ? 'Retry' : 'Sync'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
