
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button, ActivityIndicator, Surface, Text } from 'react-native-paper';
import { authTokenManager } from '../services/authTokenManager';

interface AuthWebViewProps {
  onAuthSuccess: () => void;
  onAuthCancel: () => void;
}

const AuthWebView: React.FC<AuthWebViewProps> = ({ onAuthSuccess, onAuthCancel }) => {
  const [loading, setLoading] = useState(true);
  const [authUrl] = useState('http://localhost:5000/api/login');

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    
    // Check if this is the callback URL
    if (url.includes('/api/callback')) {
      try {
        const success = await authTokenManager.handleOAuthCallback(url);
        if (success) {
          onAuthSuccess();
        } else {
          Alert.alert('Authentication Failed', 'Please try again.');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        Alert.alert('Authentication Error', 'An error occurred during authentication.');
      }
    }
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Sign In</Text>
        <Button mode="text" onPress={onAuthCancel}>
          Cancel
        </Button>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading authentication...</Text>
        </View>
      )}
      
      <WebView
        source={{ uri: authUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 1,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  webview: {
    flex: 1,
  },
});

export default AuthWebView;
