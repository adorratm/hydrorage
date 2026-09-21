import React from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 30_000,
    },
  },
});

/** AsyncStorage API’sini her zaman Promise döndürecek şekilde sar (web SSR güvenliği). */
const safeStorage = {
  getItem: async (key: string) => {
    try {
      return await Promise.resolve(AsyncStorage.getItem(key));
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await Promise.resolve(AsyncStorage.setItem(key, value));
    } catch {
      /* ignore */
    }
  },
  removeItem: async (key: string) => {
    try {
      await Promise.resolve(AsyncStorage.removeItem(key));
    } catch {
      /* ignore */
    }
  },
};

const persister =
  Platform.OS === 'web'
    ? null
    : createAsyncStoragePersister({
        storage: safeStorage,
        key: 'hydrorage-query-cache-v2',
      });

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  // Web / SSR: persist hydrate `promise.then` hatası veriyor → düz provider
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.state.status === 'success' &&
            (q.queryKey[0] === 'dashboard' ||
              q.queryKey[0] === 'settings' ||
              q.queryKey[0] === 'stats-weekly'),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
