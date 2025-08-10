
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, TextInput, Switch, List, Dialog, Portal, RadioButton, Divider } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SettingsScreen = ({ navigation }: any) => {
  const [notificationDialogVisible, setNotificationDialogVisible] = useState(false);
  const [dataLocationDialogVisible, setDataLocationDialogVisible] = useState(false);
  const [apiKeyDialogVisible, setApiKeyDialogVisible] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ [key]: value })
      });
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      Alert.alert('Success', 'Setting updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update setting');
    }
  });

  const generateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ name: 'Mobile App Key' })
      });
      if (!response.ok) throw new Error('Failed to generate API key');
      return response.json();
    },
    onSuccess: (data) => {
      setNewApiKey(data.key);
      setApiKeyDialogVisible(true);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate API key');
    }
  });

  const getAuthToken = async () => {
    return 'mock-token';
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => {
            // Implement logout logic
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'This will generate a report with all your privacy data. You will receive an email when it\'s ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate Report', 
          onPress: () => {
            // Implement data export
            Alert.alert('Success', 'Data export initiated. You will receive an email when ready.');
          }
        }
      ]
    );
  };

  const handleAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Error', 'Account deletion is not available in the mobile app. Please contact support.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Profile</Title>
          <List.Item
            title={user?.firstName + ' ' + user?.lastName || 'User'}
            description={user?.email || 'email@example.com'}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          <List.Item
            title="Role"
            description={user?.role || 'viewer'}
            left={(props) => <List.Icon {...props} icon="badge-account" />}
          />
        </Card.Content>
      </Card>

      {/* Notification Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Notifications</Title>
          <List.Item
            title="SSL Certificate Alerts"
            description="Get notified when certificates are expiring"
            right={() => (
              <Switch
                value={settings?.sslAlerts || true}
                onValueChange={(value) => updateSettingMutation.mutate({ key: 'sslAlerts', value })}
              />
            )}
          />
          <List.Item
            title="DSAR Deadline Alerts"
            description="Get notified about upcoming DSAR deadlines"
            right={() => (
              <Switch
                value={settings?.dsarAlerts || true}
                onValueChange={(value) => updateSettingMutation.mutate({ key: 'dsarAlerts', value })}
              />
            )}
          />
          <List.Item
            title="Compliance Score Updates"
            description="Get notified when your compliance score changes"
            right={() => (
              <Switch
                value={settings?.complianceAlerts || true}
                onValueChange={(value) => updateSettingMutation.mutate({ key: 'complianceAlerts', value })}
              />
            )}
          />
          <List.Item
            title="Security Incident Alerts"
            description="Get notified about security incidents"
            right={() => (
              <Switch
                value={settings?.securityAlerts || true}
                onValueChange={(value) => updateSettingMutation.mutate({ key: 'securityAlerts', value })}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Privacy & Security */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Privacy & Security</Title>
          <List.Item
            title="Data Processing Location"
            description={settings?.dataLocation || 'Auto'}
            left={(props) => <List.Icon {...props} icon="earth" />}
            onPress={() => setDataLocationDialogVisible(true)}
          />
          <List.Item
            title="Two-Factor Authentication"
            description="Not configured"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            onPress={() => Alert.alert('Info', '2FA configuration is not available in the mobile app.')}
          />
          <List.Item
            title="API Keys"
            description="Manage API access"
            left={(props) => <List.Icon {...props} icon="key" />}
            onPress={() => generateApiKeyMutation.mutate()}
          />
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Data Management</Title>
          <List.Item
            title="Export My Data"
            description="Download all your data"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={handleDataExport}
          />
          <List.Item
            title="Data Retention"
            description={`${settings?.dataRetentionDays || 365} days`}
            left={(props) => <List.Icon {...props} icon="clock" />}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Delete Account"
            description="Permanently delete your account and all data"
            titleStyle={{ color: '#f44336' }}
            left={(props) => <List.Icon {...props} icon="delete" color="#f44336" />}
            onPress={handleAccountDeletion}
          />
        </Card.Content>
      </Card>

      {/* App Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>App Settings</Title>
          <List.Item
            title="Analytics & Telemetry"
            description="Help improve the app by sharing usage data"
            right={() => (
              <Switch
                value={settings?.analytics || true}
                onValueChange={(value) => updateSettingMutation.mutate({ key: 'analytics', value })}
              />
            )}
          />
          <List.Item
            title="Auto-refresh Data"
            description="Automatically refresh data every 5 minutes"
            right={() => (
              <Switch
                value={settings?.autoRefresh || false}
                onValueChange={(value) => updateSettingMutation.mutate({ key: 'autoRefresh', value })}
              />
            )}
          />
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </Card.Content>
      </Card>

      {/* Support */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Support</Title>
          <List.Item
            title="Help Center"
            description="Get help and find answers"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => Alert.alert('Info', 'Help center coming soon!')}
          />
          <List.Item
            title="Contact Support"
            description="Get in touch with our team"
            left={(props) => <List.Icon {...props} icon="email" />}
            onPress={() => Alert.alert('Info', 'Please email support@privacyguard.app')}
          />
          <List.Item
            title="Privacy Policy"
            description="Read our privacy policy"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => Alert.alert('Info', 'Privacy policy will open in browser')}
          />
        </Card.Content>
      </Card>

      {/* Logout */}
      <Card style={styles.card}>
        <Card.Content>
          <Button mode="contained" onPress={handleLogout} buttonColor="#f44336">
            Logout
          </Button>
        </Card.Content>
      </Card>

      {/* Data Location Dialog */}
      <Portal>
        <Dialog visible={dataLocationDialogVisible} onDismiss={() => setDataLocationDialogVisible(false)}>
          <Dialog.Title>Data Processing Location</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => {
                updateSettingMutation.mutate({ key: 'dataLocation', value });
                setDataLocationDialogVisible(false);
              }}
              value={settings?.dataLocation || 'auto'}
            >
              <RadioButton.Item label="Auto (Recommended)" value="auto" />
              <RadioButton.Item label="United States" value="us" />
              <RadioButton.Item label="European Union" value="eu" />
              <RadioButton.Item label="Canada" value="ca" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDataLocationDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* API Key Dialog */}
      <Portal>
        <Dialog visible={apiKeyDialogVisible} onDismiss={() => setApiKeyDialogVisible(false)}>
          <Dialog.Title>New API Key Generated</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Your new API key has been generated. Please copy it now as it won't be shown again.</Paragraph>
            <TextInput
              value={newApiKey}
              multiline
              numberOfLines={3}
              style={styles.apiKeyInput}
              editable={false}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              // Copy to clipboard implementation
              Alert.alert('Copied', 'API key copied to clipboard');
              setApiKeyDialogVisible(false);
            }}>
              Copy
            </Button>
            <Button onPress={() => setApiKeyDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  card: {
    margin: 16,
    marginBottom: 8
  },
  divider: {
    marginVertical: 8
  },
  apiKeyInput: {
    marginTop: 16,
    backgroundColor: '#f5f5f5'
  }
});

export default SettingsScreen;
