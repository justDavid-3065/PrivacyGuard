
import { useState, useEffect } from 'react';
import { authTokenManager, type JWTClaims } from '../services/authTokenManager';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<JWTClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authTokenManager.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = await authTokenManager.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authTokenManager.clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      return true;
    } catch (error) {
      console.error('Sign out failed:', error);
      return false;
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  return {
    isAuthenticated,
    user,
    loading,
    signOut,
    refreshAuth,
    checkAuthStatus
  };
};
