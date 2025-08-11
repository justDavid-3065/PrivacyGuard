
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PendingAction {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadPendingActions();
    
    // Monitor network status
    const checkConnection = () => {
      // In a real app, you'd use NetInfo from @react-native-community/netinfo
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions]);

  const loadPendingActions = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingActions');
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  };

  const savePendingActions = async (actions: PendingAction[]) => {
    try {
      await AsyncStorage.setItem('pendingActions', JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to save pending actions:', error);
    }
  };

  const queueAction = async (endpoint: string, method: string, data: any) => {
    const action: PendingAction = {
      id: Date.now().toString(),
      endpoint,
      method,
      data,
      timestamp: Date.now()
    };

    const newActions = [...pendingActions, action];
    setPendingActions(newActions);
    await savePendingActions(newActions);

    // If online, try to sync immediately
    if (isOnline) {
      await syncPendingActions();
    }
  };

  const syncPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const failedActions: PendingAction[] = [];

    for (const action of pendingActions) {
      try {
        const response = await fetch(`http://localhost:5000/api${action.endpoint}`, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: action.method !== 'GET' ? JSON.stringify(action.data) : undefined
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Action succeeded, invalidate related queries
        invalidateQueriesForEndpoint(action.endpoint);
      } catch (error) {
        console.error('Failed to sync action:', error);
        failedActions.push(action);
      }
    }

    // Update pending actions with only the failed ones
    setPendingActions(failedActions);
    await savePendingActions(failedActions);
  };

  const invalidateQueriesForEndpoint = (endpoint: string) => {
    // Map endpoints to query keys for cache invalidation
    const endpointToQueryKey: Record<string, string[]> = {
      '/data-types': ['dataTypes'],
      '/consent-records': ['consents'],
      '/dsar-requests': ['dsars'],
      '/privacy-notices': ['privacyNotices'],
      '/domains': ['domains'],
      '/ssl-certificates': ['certificates'],
      '/incidents': ['incidents'],
      '/dashboard/stats': ['dashboardStats']
    };

    const baseEndpoint = endpoint.split('/').slice(0, 2).join('/');
    const queryKeys = endpointToQueryKey[baseEndpoint];
    
    if (queryKeys) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }
  };

  const getAuthToken = async () => {
    const { authTokenManager } = await import('../services/authTokenManager');
    return await authTokenManager.getValidToken();
  };

  const clearPendingActions = async () => {
    setPendingActions([]);
    await savePendingActions([]);
  };

  return {
    isOnline,
    pendingActions: pendingActions.length,
    queueAction,
    syncPendingActions,
    clearPendingActions
  };
};
