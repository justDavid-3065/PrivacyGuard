
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, TextInput, Chip, FAB, List, Searchbar, Dialog, Portal, RadioButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ConsentTrackerScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newConsent, setNewConsent] = useState({
    subjectEmail: '',
    purpose: 'marketing',
    status: 'granted',
    channel: 'website'
  });

  const queryClient = useQueryClient();

  const { data: consents, isLoading } = useQuery({
    queryKey: ['consents'],
    queryFn: async () => {
      const response = await fetch('/api/consent-records', {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch consents');
      return response.json();
    }
  });

  const createConsentMutation = useMutation({
    mutationFn: async (consent: any) => {
      const response = await fetch('/api/consent-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(consent)
      });
      if (!response.ok) throw new Error('Failed to create consent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents'] });
      setDialogVisible(false);
      setNewConsent({ subjectEmail: '', purpose: 'marketing', status: 'granted', channel: 'website' });
      Alert.alert('Success', 'Consent record created successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create consent record');
    }
  });

  const updateConsentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await fetch(`/api/consent-records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update consent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents'] });
      Alert.alert('Success', 'Consent status updated');
    }
  });

  const getAuthToken = async () => {
    // Implementation depends on your auth system
    return 'mock-token';
  };

  // Schema-based statuses with fallback when API returns empty data
  const availableStatuses = consents && consents.length > 0 
    ? [...new Set(consents.map((consent: any) => consent.status))]
    : ['granted', 'withdrawn', 'pending'];

  const filteredConsents = consents?.filter((consent: any) =>
    consent.subjectEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    consent.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateConsent = () => {
    if (!newConsent.subjectEmail) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    createConsentMutation.mutate(newConsent);
  };

  const handleWithdrawConsent = (consentId: string) => {
    Alert.alert(
      'Withdraw Consent',
      'Are you sure you want to withdraw this consent?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', onPress: () => updateConsentMutation.mutate({ id: consentId, status: 'withdrawn' }) }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Title>Loading consents...</Title>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Consent Overview</Title>
            <View style={styles.statsRow}>
              <Surface style={styles.statCard}>
                <Title>{consents?.filter((c: any) => c.status === 'granted').length || 0}</Title>
                <Paragraph>Active Consents</Paragraph>
              </Surface>
              <Surface style={styles.statCard}>
                <Title>{consents?.filter((c: any) => c.status === 'withdrawn').length || 0}</Title>
                <Paragraph>Withdrawn</Paragraph>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        <Searchbar
          placeholder="Search by email or purpose"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <Card style={styles.listCard}>
          <Card.Content>
            <Title>Consent Records</Title>
            {filteredConsents.map((consent: any) => (
              <List.Item
                key={consent.id}
                title={consent.subjectEmail}
                description={`${consent.purpose} • ${consent.channel}`}
                right={(props) => (
                  <View style={styles.consentActions}>
                    <Chip
                      mode={consent.status === 'granted' ? 'flat' : 'outlined'}
                      textStyle={{ color: consent.status === 'granted' ? '#2e7d32' : '#d32f2f' }}
                    >
                      {consent.status}
                    </Chip>
                    {consent.status === 'granted' && (
                      <Button
                        mode="text"
                        compact
                        onPress={() => handleWithdrawConsent(consent.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </View>
                )}
              />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setDialogVisible(true)}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Record New Consent</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Subject Email"
              value={newConsent.subjectEmail}
              onChangeText={(text) => setNewConsent(prev => ({ ...prev, subjectEmail: text }))}
              style={styles.input}
            />
            
            <Title style={styles.sectionTitle}>Purpose</Title>
            <RadioButton.Group
              onValueChange={(value) => setNewConsent(prev => ({ ...prev, purpose: value }))}
              value={newConsent.purpose}
            >
              <RadioButton.Item label="Marketing" value="marketing" />
              <RadioButton.Item label="Analytics" value="analytics" />
              <RadioButton.Item label="Functional" value="functional" />
              <RadioButton.Item label="Performance" value="performance" />
            </RadioButton.Group>

            <Title style={styles.sectionTitle}>Channel</Title>
            <RadioButton.Group
              onValueChange={(value) => setNewConsent(prev => ({ ...prev, channel: value }))}
              value={newConsent.channel}
            >
              <RadioButton.Item label="Website" value="website" />
              <RadioButton.Item label="Mobile App" value="mobile" />
              <RadioButton.Item label="Email" value="email" />
              <RadioButton.Item label="Phone" value="phone" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCreateConsent} loading={createConsentMutation.isPending}>
              Record Consent
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  searchbar: {
    margin: 16,
    marginVertical: 8
  },
  listCard: {
    margin: 16,
    marginTop: 8
  },
  consentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  },
  input: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8
  }
});

export default ConsentTrackerScreen;
