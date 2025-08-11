
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export interface JWTClaims {
  sub: string;
  email: string;
  exp: number;
  iat: number;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

class AuthTokenManager {
  private static instance: AuthTokenManager;
  private readonly ACCESS_TOKEN_KEY = 'privacy_guard_access_token';
  private readonly REFRESH_TOKEN_KEY = 'privacy_guard_refresh_token';
  private readonly TOKEN_DATA_KEY = 'privacy_guard_token_data';
  private readonly USER_DATA_KEY = 'privacy_guard_user_data';

  static getInstance(): AuthTokenManager {
    if (!AuthTokenManager.instance) {
      AuthTokenManager.instance = new AuthTokenManager();
    }
    return AuthTokenManager.instance;
  }

  /**
   * Store tokens securely
   */
  async storeTokens(tokenData: TokenData): Promise<void> {
    try {
      // Store access token in AsyncStorage for quick access
      await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, tokenData.accessToken);
      
      // Store refresh token securely using Keychain/SecureStore
      await this.storeSecurely(this.REFRESH_TOKEN_KEY, tokenData.refreshToken);
      
      // Store token metadata
      await AsyncStorage.setItem(this.TOKEN_DATA_KEY, JSON.stringify({
        expiresAt: tokenData.expiresAt,
        userId: tokenData.userId,
        tokenHash: this.hashToken(tokenData.accessToken)
      }));

      console.log('Tokens stored successfully');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Get valid access token, refresh if necessary
   */
  async getValidToken(): Promise<string | null> {
    try {
      const accessToken = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
      
      if (!accessToken) {
        console.log('No access token found');
        return null;
      }

      // Check if token is expired
      if (this.isTokenExpired(accessToken)) {
        console.log('Access token expired, attempting refresh');
        const refreshedToken = await this.refreshAccessToken();
        return refreshedToken;
      }

      return accessToken;
    } catch (error) {
      console.error('Failed to get valid token:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getSecurely(this.REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        console.log('No refresh token available');
        await this.clearTokens();
        return null;
      }

      // Call refresh endpoint
      const response = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.log('Token refresh failed');
        await this.clearTokens();
        return null;
      }

      const tokenResponse = await response.json();
      
      // Store new tokens
      const claims = jwtDecode<JWTClaims>(tokenResponse.accessToken);
      await this.storeTokens({
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken || refreshToken,
        expiresAt: claims.exp,
        userId: claims.sub
      });

      return tokenResponse.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JWTClaims>(token);
      const now = Math.floor(Date.now() / 1000);
      // Add 5 minute buffer for token refresh
      return decoded.exp <= (now + 300);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return true;
    }
  }

  /**
   * Get current user data from stored token
   */
  async getCurrentUser(): Promise<JWTClaims | null> {
    try {
      const token = await this.getValidToken();
      if (!token) return null;

      return jwtDecode<JWTClaims>(token);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Store user profile data
   */
  async storeUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  /**
   * Get stored user profile data
   */
  async getUserData(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Clear all stored tokens and user data
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(this.TOKEN_DATA_KEY),
        AsyncStorage.removeItem(this.USER_DATA_KEY),
        this.removeSecurely(this.REFRESH_TOKEN_KEY)
      ]);
      console.log('All tokens cleared');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidToken();
    return token !== null;
  }

  /**
   * Store data securely using Keychain (iOS) or SecureStore (Android/Expo)
   */
  private async storeSecurely(key: string, value: string): Promise<void> {
    try {
      if (Keychain.setInternetCredentials) {
        // React Native Keychain
        await Keychain.setInternetCredentials(key, 'user', value);
      } else {
        // Expo SecureStore fallback
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Secure storage failed, falling back to AsyncStorage:', error);
      await AsyncStorage.setItem(key, value);
    }
  }

  /**
   * Retrieve data securely
   */
  private async getSecurely(key: string): Promise<string | null> {
    try {
      if (Keychain.getInternetCredentials) {
        // React Native Keychain
        const credentials = await Keychain.getInternetCredentials(key);
        if (credentials && typeof credentials !== 'boolean') {
          return credentials.password;
        }
      } else {
        // Expo SecureStore fallback
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Secure retrieval failed, falling back to AsyncStorage:', error);
      return await AsyncStorage.getItem(key);
    }
    return null;
  }

  /**
   * Remove data from secure storage
   */
  private async removeSecurely(key: string): Promise<void> {
    try {
      if (Keychain.resetInternetCredentials) {
        await Keychain.resetInternetCredentials(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Secure removal failed, falling back to AsyncStorage:', error);
      await AsyncStorage.removeItem(key);
    }
  }

  /**
   * Create a simple hash of the token for integrity checking
   */
  private hashToken(token: string): string {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Handle OAuth callback from WebView
   */
  async handleOAuthCallback(url: string): Promise<boolean> {
    try {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for tokens
      const response = await fetch('http://localhost:5000/api/auth/mobile/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const tokenData = await response.json();
      const claims = jwtDecode<JWTClaims>(tokenData.accessToken);

      await this.storeTokens({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: claims.exp,
        userId: claims.sub
      });

      await this.storeUserData(claims);

      return true;
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      return false;
    }
  }
}

export const authTokenManager = AuthTokenManager.getInstance();
export default authTokenManager;
