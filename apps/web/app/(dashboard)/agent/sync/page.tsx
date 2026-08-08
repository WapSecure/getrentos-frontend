'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { AgentNavbar } from '@/components/agent/navigation/AgentNavbar';
import { AgentSidebar } from '@/components/agent/dashboard/AgentSidebar';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/format';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { OfflineSyncItem } from '@/types/agent';

const mockSyncItems: OfflineSyncItem[] = [
  {
    id: 'sync_001',
    recordType: 'inspection',
    recordLabel: 'Move-out Inspection — Modern 2-Bed Flat, Ikeja GRA',
    capturedAt: '2026-08-07T15:40:00.000Z',
    syncStatus: 'pending',
    sizeLabel: '4.2 MB',
  },
  {
    id: 'sync_002',
    recordType: 'verification',
    recordLabel: 'Tenant Verification — David Okoro',
    capturedAt: '2026-08-07T09:10:00.000Z',
    syncStatus: 'pending',
    sizeLabel: '620 KB',
  },
  {
    id: 'sync_003',
    recordType: 'inspection',
    recordLabel: 'Move-in Inspection — Sunrise Apartments, Unit 1A',
    capturedAt: '2026-08-05T13:00:00.000Z',
    syncStatus: 'failed',
    sizeLabel: '3.8 MB',
  },
];

export default function AgentSyncPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<OfflineSyncItem[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'agent') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setItems(mockSyncItems);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

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
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, syncStatus: 'synced' } : i)));
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    window.setTimeout(() => {
      setItems((prev) =>
        prev.map((i) => (i.syncStatus !== 'synced' ? { ...i, syncStatus: 'synced' } : i))
      );
      setIsSyncingAll(false);
    }, 1200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = items.filter((i) => i.syncStatus !== 'synced').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AgentNavbar user={user} />

      <div className="flex">
        <AgentSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sync Center</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Records captured offline, waiting to upload
                </p>
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
                <Wifi className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <WifiOff className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${isOnline ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}
                >
                  {isOnline ? 'Connected' : 'Offline'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {isOnline
                    ? 'Inspections and verifications you capture in the field are saved locally and sync automatically when possible.'
                    : 'You are working offline. Records will be saved on this device and synced once you reconnect.'}
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Cloud className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  All caught up
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Every record you&apos;ve captured has been synced to GetRentos.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                {items.map((item) => {
                  const TypeIcon = item.recordType === 'inspection' ? ClipboardCheck : UserCheck;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          item.syncStatus === 'failed'
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : 'bg-gray-100 dark:bg-white/10'
                        }`}
                      >
                        {item.syncStatus === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <TypeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.recordLabel}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Captured {formatRelativeTime(item.capturedAt)} · {item.sizeLabel}
                        </p>
                      </div>
                      {item.syncStatus === 'synced' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20 flex-shrink-0">
                          <Cloud className="w-3 h-3" />
                          Synced
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 flex-shrink-0"
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
          </div>
        </main>
      </div>
    </div>
  );
}
