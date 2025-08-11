
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Title, Paragraph, Surface, ActivityIndicator } from 'react-native-paper';
import { authTokenManager } from '../services/authTokenManager';
import AuthWebView from '../components/AuthWebView';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await authTokenManager.isAuthenticated();
      if (isAuthenticated) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    setShowWebView(true);
  };

  const handleAuthSuccess = () => {
    setShowWebView(false);
    onAuthSuccess();
  };

  const handleAuthCancel = () => {
    setShowWebView(false);
  };

  const handleSignOut = async () => {
    try {
      await authTokenManager.clearTokens();
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } catch (error) {
      console.error('Sign out failed:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (showWebView) {
    return (
      <AuthWebView
        onAuthSuccess={handleAuthSuccess}
        onAuthCancel={handleAuthCancel}
      />
    );
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Privacy Guard</Title>
            <Paragraph style={styles.subtitle}>
              Comprehensive privacy compliance management
            </Paragraph>
            
            <View style={styles.features}>
              <Paragraph>• GDPR & CCPA Compliance</Paragraph>
              <Paragraph>• Data Subject Rights Management</Paragraph>
              <Paragraph>• Privacy Notice Generation</Paragraph>
              <Paragraph>• SSL Certificate Monitoring</Paragraph>
              <Paragraph>• Consent Tracking</Paragraph>
            </View>
          </Card.Content>
          
          <Card.Actions style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleSignIn}
              style={styles.signInButton}
              contentStyle={styles.buttonContent}
            >
              Sign In with Replit
            </Button>
          </Card.Actions>
        </Card>
        
        <Button
          mode="text"
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          Clear Stored Data
        </Button>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#666',
  },
  features: {
    marginBottom: 20,
  },
  actions: {
    justifyContent: 'center',
    paddingBottom: 20,
  },
  signInButton: {
    backgroundColor: '#2196f3',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  signOutButton: {
    marginTop: 20,
  },
});

export default AuthScreen;
