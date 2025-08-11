
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AuthScreen from '../../src/screens/AuthScreen';
import { authTokenManager } from '../../src/services/authTokenManager';

jest.mock('../../src/services/authTokenManager');

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      {component}
    </PaperProvider>
  );
};

describe('AuthScreen', () => {
  const mockOnAuthSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockResolvedValue(false);

    const { getByText } = renderWithProvider(
      <AuthScreen onAuthSuccess={mockOnAuthSuccess} />
    );

    await waitFor(() => {
      expect(getByText('Privacy Guard')).toBeTruthy();
      expect(getByText('Comprehensive privacy compliance management')).toBeTruthy();
      expect(getByText('Sign In with Replit')).toBeTruthy();
    });
  });

  it('should call onAuthSuccess if already authenticated', async () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockResolvedValue(true);

    renderWithProvider(
      <AuthScreen onAuthSuccess={mockOnAuthSuccess} />
    );

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalled();
    });
  });

  it('should show WebView when sign in button is pressed', async () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockResolvedValue(false);

    const { getByText, queryByText } = renderWithProvider(
      <AuthScreen onAuthSuccess={mockOnAuthSuccess} />
    );

    await waitFor(() => {
      expect(getByText('Sign In with Replit')).toBeTruthy();
    });

    fireEvent.press(getByText('Sign In with Replit'));

    await waitFor(() => {
      expect(queryByText('Privacy Guard')).toBeFalsy();
    });
  });

  it('should clear tokens when clear data button is pressed', async () => {
    (authTokenManager.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (authTokenManager.clearTokens as jest.Mock).mockResolvedValue(undefined);

    const { getByText } = renderWithProvider(
      <AuthScreen onAuthSuccess={mockOnAuthSuccess} />
    );

    await waitFor(() => {
      expect(getByText('Clear Stored Data')).toBeTruthy();
    });

    fireEvent.press(getByText('Clear Stored Data'));

    await waitFor(() => {
      expect(authTokenManager.clearTokens).toHaveBeenCalled();
    });
  });
});
