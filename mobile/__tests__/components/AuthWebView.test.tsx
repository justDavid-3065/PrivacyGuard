
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AuthWebView from '../../src/components/AuthWebView';
import { authTokenManager } from '../../src/services/authTokenManager';

// Mock dependencies
jest.mock('../../src/services/authTokenManager');
jest.mock('react-native-webview', () => ({
  WebView: ({ onNavigationStateChange, onLoadStart, onLoadEnd }: any) => {
    const MockWebView = require('react-native').View;
    return (
      <MockWebView
        testID="webview"
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
    );
  }
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      {component}
    </PaperProvider>
  );
};

describe('AuthWebView', () => {
  const mockOnAuthSuccess = jest.fn();
  const mockOnAuthCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <AuthWebView
        onAuthSuccess={mockOnAuthSuccess}
        onAuthCancel={mockOnAuthCancel}
      />
    );

    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByTestId('webview')).toBeTruthy();
  });

  it('should call onAuthCancel when cancel button is pressed', () => {
    const { getByText } = renderWithProvider(
      <AuthWebView
        onAuthSuccess={mockOnAuthSuccess}
        onAuthCancel={mockOnAuthCancel}
      />
    );

    fireEvent.press(getByText('Cancel'));

    expect(mockOnAuthCancel).toHaveBeenCalled();
  });

  it('should handle successful OAuth callback', async () => {
    (authTokenManager.handleOAuthCallback as jest.Mock).mockResolvedValue(true);

    const { getByTestId } = renderWithProvider(
      <AuthWebView
        onAuthSuccess={mockOnAuthSuccess}
        onAuthCancel={mockOnAuthCancel}
      />
    );

    const webview = getByTestId('webview');
    
    // Simulate navigation to callback URL
    fireEvent(webview, 'onNavigationStateChange', {
      url: 'http://localhost:5000/api/callback?code=test-code'
    });

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(authTokenManager.handleOAuthCallback).toHaveBeenCalledWith(
      'http://localhost:5000/api/callback?code=test-code'
    );
    expect(mockOnAuthSuccess).toHaveBeenCalled();
  });

  it('should handle failed OAuth callback', async () => {
    (authTokenManager.handleOAuthCallback as jest.Mock).mockResolvedValue(false);

    const { getByTestId } = renderWithProvider(
      <AuthWebView
        onAuthSuccess={mockOnAuthSuccess}
        onAuthCancel={mockOnAuthCancel}
      />
    );

    const webview = getByTestId('webview');
    
    fireEvent(webview, 'onNavigationStateChange', {
      url: 'http://localhost:5000/api/callback?error=access_denied'
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockOnAuthSuccess).not.toHaveBeenCalled();
  });
});
