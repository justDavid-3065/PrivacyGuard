
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../../src/hooks/useAuth';
import { authTokenManager } from '../../src/services/authTokenManager';

jest.mock('../../src/services/authTokenManager');

describe('useAuth', () => {
  const mockUser = {
    sub: 'user-123',
    email: 'user@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    first_name: 'John',
    last_name: 'Doe'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should set authenticated state when user is logged in', async () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (authTokenManager.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should set unauthenticated state when user is not logged in', async () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockResolvedValue(false);

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle sign out', async () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (authTokenManager.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (authTokenManager.clearTokens as jest.Mock).mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await waitForNextUpdate();

    await act(async () => {
      const success = await result.current.signOut();
      expect(success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(authTokenManager.clearTokens).toHaveBeenCalled();
  });

  it('should handle sign out error', async () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (authTokenManager.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (authTokenManager.clearTokens as jest.Mock).mockRejectedValue(new Error('Clear failed'));

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await waitForNextUpdate();

    await act(async () => {
      const success = await result.current.signOut();
      expect(success).toBe(false);
    });
  });

  it('should refresh auth state', async () => {
    (authTokenManager.isAuthenticated as jest.Mock)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    (authTokenManager.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.refreshAuth();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });
});
