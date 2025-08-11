
import { authTokenManager } from '../../src/services/authTokenManager';

// Mock dependencies for E2E testing
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: { [key: string]: string } = {};
  
  return {
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    })
  };
});

// Mock fetch for OAuth flow
global.fetch = jest.fn();

describe('Authentication E2E Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full authentication flow', async () => {
    // Mock OAuth callback URL
    const callbackUrl = 'http://localhost:5000/api/callback?code=test-auth-code&state=random-state';
    
    // Mock token exchange response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwfQ.example',
        refreshToken: 'refresh-token-123'
      })
    });

    // Step 1: Handle OAuth callback
    const authSuccess = await authTokenManager.handleOAuthCallback(callbackUrl);
    expect(authSuccess).toBe(true);

    // Step 2: Check authentication status
    const isAuthenticated = await authTokenManager.isAuthenticated();
    expect(isAuthenticated).toBe(true);

    // Step 3: Get current user
    const user = await authTokenManager.getCurrentUser();
    expect(user).toEqual({
      sub: 'user-123',
      email: 'user@example.com',
      exp: 9999999999,
      iat: 1600000000
    });

    // Step 4: Get valid token
    const token = await authTokenManager.getValidToken();
    expect(token).toBeTruthy();

    // Step 5: Sign out
    await authTokenManager.clearTokens();
    const isAuthenticatedAfterSignOut = await authTokenManager.isAuthenticated();
    expect(isAuthenticatedAfterSignOut).toBe(false);
  });

  it('should handle token refresh flow', async () => {
    // Store expired token
    const expiredTokenData = {
      accessToken: 'expired-token',
      refreshToken: 'valid-refresh-token',
      expiresAt: Math.floor(Date.now() / 1000) - 100, // Expired
      userId: 'user-123'
    };

    await authTokenManager.storeTokens(expiredTokenData);

    // Mock refresh token response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      })
    });

    // Mock jwt-decode for the new token
    jest.doMock('jwt-decode', () => ({
      jwtDecode: () => ({
        sub: 'user-123',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      })
    }));

    const token = await authTokenManager.getValidToken();
    expect(token).toBe('new-access-token');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'valid-refresh-token' })
      })
    );
  });

  it('should handle authentication errors gracefully', async () => {
    // Mock failed OAuth callback
    const errorCallbackUrl = 'http://localhost:5000/api/callback?error=access_denied';
    
    const authSuccess = await authTokenManager.handleOAuthCallback(errorCallbackUrl);
    expect(authSuccess).toBe(false);

    // Should not be authenticated
    const isAuthenticated = await authTokenManager.isAuthenticated();
    expect(isAuthenticated).toBe(false);
  });

  it('should handle network errors during authentication', async () => {
    const callbackUrl = 'http://localhost:5000/api/callback?code=test-code';
    
    // Mock network error
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const authSuccess = await authTokenManager.handleOAuthCallback(callbackUrl);
    expect(authSuccess).toBe(false);
  });
});
