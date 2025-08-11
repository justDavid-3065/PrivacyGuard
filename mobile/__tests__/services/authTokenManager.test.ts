
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authTokenManager } from '../../src/services/authTokenManager';
import { jwtDecode } from 'jwt-decode';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
}));

jest.mock('jwt-decode');

// Mock fetch
global.fetch = jest.fn();

describe('AuthTokenManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTokenData = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    userId: 'user-123'
  };

  const mockJWTClaims = {
    sub: 'user-123',
    email: 'user@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    first_name: 'John',
    last_name: 'Doe'
  };

  describe('storeTokens', () => {
    it('should store tokens successfully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await authTokenManager.storeTokens(mockTokenData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'privacy_guard_access_token',
        mockTokenData.accessToken
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'privacy_guard_token_data',
        expect.stringContaining(mockTokenData.userId)
      );
    });

    it('should handle storage errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(authTokenManager.storeTokens(mockTokenData)).rejects.toThrow(
        'Failed to store authentication tokens'
      );
    });
  });

  describe('getValidToken', () => {
    it('should return valid token when not expired', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockTokenData.accessToken);
      (jwtDecode as jest.Mock).mockReturnValue(mockJWTClaims);

      const token = await authTokenManager.getValidToken();

      expect(token).toBe(mockTokenData.accessToken);
    });

    it('should return null when no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const token = await authTokenManager.getValidToken();

      expect(token).toBeNull();
    });

    it('should refresh token when expired', async () => {
      const expiredClaims = {
        ...mockJWTClaims,
        exp: Math.floor(Date.now() / 1000) - 100 // Expired 100 seconds ago
      };

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('expired-token')
        .mockResolvedValueOnce('refresh-token');
      (jwtDecode as jest.Mock).mockReturnValue(expiredClaims);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      });

      // Mock the token refresh process
      jest.spyOn(authTokenManager, 'refreshAccessToken').mockResolvedValue('new-access-token');

      const token = await authTokenManager.getValidToken();

      expect(token).toBe('new-access-token');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      (jwtDecode as jest.Mock).mockReturnValue(mockJWTClaims);

      const isExpired = authTokenManager.isTokenExpired('valid-token');

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredClaims = {
        ...mockJWTClaims,
        exp: Math.floor(Date.now() / 1000) - 100
      };
      (jwtDecode as jest.Mock).mockReturnValue(expiredClaims);

      const isExpired = authTokenManager.isTokenExpired('expired-token');

      expect(isExpired).toBe(true);
    });

    it('should return true for invalid token', () => {
      (jwtDecode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const isExpired = authTokenManager.isTokenExpired('invalid-token');

      expect(isExpired).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('refresh-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      });
      (jwtDecode as jest.Mock).mockReturnValue(mockJWTClaims);

      const token = await authTokenManager.refreshAccessToken();

      expect(token).toBe('new-access-token');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: 'refresh-token' })
        })
      );
    });

    it('should clear tokens on refresh failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('refresh-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      const token = await authTokenManager.refreshAccessToken();

      expect(token).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user claims from valid token', async () => {
      jest.spyOn(authTokenManager, 'getValidToken').mockResolvedValue('valid-token');
      (jwtDecode as jest.Mock).mockReturnValue(mockJWTClaims);

      const user = await authTokenManager.getCurrentUser();

      expect(user).toEqual(mockJWTClaims);
    });

    it('should return null when no valid token', async () => {
      jest.spyOn(authTokenManager, 'getValidToken').mockResolvedValue(null);

      const user = await authTokenManager.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should clear all stored data', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await authTokenManager.clearTokens();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('privacy_guard_access_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('privacy_guard_token_data');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('privacy_guard_user_data');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', async () => {
      jest.spyOn(authTokenManager, 'getValidToken').mockResolvedValue('valid-token');

      const isAuth = await authTokenManager.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false when no valid token', async () => {
      jest.spyOn(authTokenManager, 'getValidToken').mockResolvedValue(null);

      const isAuth = await authTokenManager.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle successful OAuth callback', async () => {
      const callbackUrl = 'http://localhost:5000/api/callback?code=auth-code&state=random-state';
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      });
      (jwtDecode as jest.Mock).mockReturnValue(mockJWTClaims);

      const success = await authTokenManager.handleOAuthCallback(callbackUrl);

      expect(success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/mobile/token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'auth-code', state: 'random-state' })
        })
      );
    });

    it('should handle OAuth callback failure', async () => {
      const callbackUrl = 'http://localhost:5000/api/callback?error=access_denied';

      const success = await authTokenManager.handleOAuthCallback(callbackUrl);

      expect(success).toBe(false);
    });
  });
});
