import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ApiError } from '../api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24, // keep for a day so the app opens with data
      retry: (failureCount, error) => {
        // Never retry auth failures or client errors; retry transient ones twice.
        if (error instanceof ApiError && (error.isAuth || (error.status >= 400 && error.status < 500)))
          return false;
        return failureCount < 2;
      },
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

/** Disk cache so dashboards paint instantly on launch, then revalidate. */
export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'getrentos.query-cache',
  throttleTime: 1000,
});
