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
import { Button } from '@getrentos/ui';
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
    return <div className="p-10 text-center text-muted-foreground">Loading sync records…</div>;
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
          className="gap-2"
          onClick={handleSyncAll}
          disabled={pendingCount === 0 || isSyncingAll || !isOnline}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
          {isSyncingAll ? 'Syncing...' : 'Sync All'}
        </Button>
      </div>

      <div
        className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 ${
          isOnline
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        }`}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        ) : (
          <WifiOff className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
        )}
        <div>
          <p
            className={`text-sm font-medium ${isOnline ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}
          >
            {isOnline ? 'Connected' : 'Offline'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isOnline
              ? 'Inspections and verifications you capture in the field are saved locally and sync automatically when possible.'
              : 'You are working offline. Records will be saved on this device and synced once you reconnect.'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Cloud className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">All caught up</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Every record you&apos;ve captured has been synced to GetRentos.
          </p>
        </div>
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
                    item.syncStatus === 'failed' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-secondary'
                  }`}
                >
                  {item.syncStatus === 'failed' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
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
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20 shrink-0">
                    <Cloud className="w-3 h-3" />
                    Synced
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => syncItem(item.id)}
                    disabled={!isOnline}
                  >
                    <CloudOff className="w-3.5 h-3.5" />
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
