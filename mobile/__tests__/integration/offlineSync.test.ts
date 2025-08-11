
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-hooks';
import { useOfflineSync } from '../../src/hooks/useOfflineSync';
import { authTokenManager } from '../../src/services/authTokenManager';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../src/services/authTokenManager');
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn()
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('useOfflineSync Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  it('should queue actions when offline', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineSync());

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      value: false
    });

    await act(async () => {
      await result.current.queueAction('/data-types', 'POST', { name: 'Test' });
    });

    expect(result.current.pendingActions).toBe(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'pendingActions',
      expect.stringContaining('/data-types')
    );
  });

  it('should sync pending actions when coming back online', async () => {
    const pendingActions = [{
      id: '1',
      endpoint: '/data-types',
      method: 'POST',
      data: { name: 'Test' },
      timestamp: Date.now()
    }];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(pendingActions));
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    const { result } = renderHook(() => useOfflineSync());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.pendingActions).toBe(1);

    // Simulate coming back online
    await act(async () => {
      await result.current.syncPendingActions();
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/data-types',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      })
    );

    expect(result.current.pendingActions).toBe(0);
  });

  it('should handle sync failures gracefully', async () => {
    const pendingActions = [{
      id: '1',
      endpoint: '/data-types',
      method: 'POST',
      data: { name: 'Test' },
      timestamp: Date.now()
    }];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(pendingActions));
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.syncPendingActions();
    });

    // Failed action should remain in queue
    expect(result.current.pendingActions).toBe(1);
  });

  it('should clear pending actions', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.clearPendingActions();
    });

    expect(result.current.pendingActions).toBe(0);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('pendingActions', '[]');
  });
});
