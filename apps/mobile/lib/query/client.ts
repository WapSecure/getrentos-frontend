import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ApiError } from '../api/client';
import { shouldPersistQuery } from './persistencePolicy';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  })
);

focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (state) => {
    setFocused(state === 'active');
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24, // keep for a day so the app opens with data
      retry: (failureCount, error) => {
        // Never retry auth failures or client errors; retry transient ones twice.
        if (
          error instanceof ApiError &&
          (error.isAuth || (error.status >= 400 && error.status < 500))
        )
          return false;
        return failureCount < 2;
      },
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
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

export const queryPersistenceOptions = {
  persister,
  maxAge: 1000 * 60 * 60 * 12,
  buster: 'getrentos-mobile-v1',
  dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
};
