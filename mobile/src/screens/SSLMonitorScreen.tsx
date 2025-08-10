
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, TextInput, Chip, FAB, List, Searchbar, Dialog, Portal, IconButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SSLMonitorScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newDomain, setNewDomain] = useState({
    domain: '',
    alertDays: '30'
  });

  const queryClient = useQueryClient();

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await fetch('/api/domains', {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch domains');
      return response.json();
    }
  });

  const { data: certificates } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const response = await fetch('/api/ssl-certificates', {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch certificates');
      return response.json();
    }
  });

  const addDomainMutation = useMutation({
    mutationFn: async (domain: any) => {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(domain)
      });
      if (!response.ok) throw new Error('Failed to add domain');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setDialogVisible(false);
      setNewDomain({ domain: '', alertDays: '30' });
      Alert.alert('Success', 'Domain added successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add domain');
    }
  });

  const scanDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const response = await fetch(`/api/domains/${domainId}/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to scan domain');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      Alert.alert('Success', 'Domain scan initiated');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to scan domain');
    }
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to delete domain');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      Alert.alert('Success', 'Domain removed');
    }
  });

  const getAuthToken = async () => {
    return 'mock-token';
  };

  const filteredDomains = domains?.filter((domain: any) =>
    domain.domain.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddDomain = () => {
    if (!newDomain.domain) {
      Alert.alert('Error', 'Domain is required');
      return;
    }
    addDomainMutation.mutate({
      domain: newDomain.domain,
      alertDays: parseInt(newDomain.alertDays)
    });
  };

  const handleDeleteDomain = (domainId: string, domainName: string) => {
    Alert.alert(
      'Remove Domain',
      `Are you sure you want to remove ${domainName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => deleteDomainMutation.mutate(domainId) }
      ]
    );
  };

  const getCertificateStatus = (cert: any) => {
    if (!cert) return 'unknown';
    const expiryDate = new Date(cert.expiryDate);
    const now = new Date();
    const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysToExpiry < 0) return 'expired';
    if (daysToExpiry <= 7) return 'critical';
    if (daysToExpiry <= 30) return 'warning';
    return 'valid';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'critical': return '#f44336';
      case 'expired': return '#9e9e9e';
      default: return '#2196f3';
    }
  };

  const getDaysToExpiry = (cert: any) => {
    if (!cert) return null;
    const expiryDate = new Date(cert.expiryDate);
    const now = new Date();
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Title>Loading SSL monitoring...</Title>
      </View>
    );
  }

  const expiringSoon = certificates?.filter((cert: any) => {
    const days = getDaysToExpiry(cert);
    return days !== null && days > 0 && days <= 30;
  }).length || 0;

  const expired = certificates?.filter((cert: any) => {
    const days = getDaysToExpiry(cert);
    return days !== null && days <= 0;
  }).length || 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>SSL Certificate Overview</Title>
            <View style={styles.statsRow}>
              <Surface style={styles.statCard}>
                <Title>{domains?.length || 0}</Title>
                <Paragraph>Monitored Domains</Paragraph>
              </Surface>
              <Surface style={styles.statCard}>
                <Title style={{ color: '#ff9800' }}>{expiringSoon}</Title>
                <Paragraph>Expiring Soon</Paragraph>
              </Surface>
              <Surface style={styles.statCard}>
                <Title style={{ color: '#f44336' }}>{expired}</Title>
                <Paragraph>Expired</Paragraph>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        <Searchbar
          placeholder="Search domains"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <Card style={styles.listCard}>
          <Card.Content>
            <Title>Monitored Domains</Title>
            {filteredDomains.map((domain: any) => {
              const cert = certificates?.find((c: any) => c.domainId === domain.id);
              const status = getCertificateStatus(cert);
              const daysToExpiry = getDaysToExpiry(cert);
              
              return (
                <Card key={domain.id} style={styles.domainCard}>
                  <Card.Content>
                    <View style={styles.domainHeader}>
                      <View style={styles.domainInfo}>
                        <Title style={styles.domainTitle}>{domain.domain}</Title>
                        <Paragraph>Alert threshold: {domain.alertDays} days</Paragraph>
                        {cert && (
                          <>
                            <Paragraph>Issuer: {cert.issuer}</Paragraph>
                            <Paragraph>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</Paragraph>
                            {daysToExpiry !== null && (
                              <Paragraph style={{ color: getStatusColor(status) }}>
                                {daysToExpiry > 0 ? `${daysToExpiry} days remaining` : 'Expired'}
                              </Paragraph>
                            )}
                          </>
                        )}
                      </View>
                      <View style={styles.domainActions}>
                        <Chip
                          style={{ backgroundColor: getStatusColor(status) }}
                          textStyle={{ color: 'white' }}
                        >
                          {status}
                        </Chip>
                        <View style={styles.actionButtons}>
                          <IconButton
                            icon="refresh"
                            mode="contained"
                            onPress={() => scanDomainMutation.mutate(domain.id)}
                            disabled={scanDomainMutation.isPending}
                          />
                          <IconButton
                            icon="delete"
                            mode="contained"
                            onPress={() => handleDeleteDomain(domain.id, domain.domain)}
                          />
                        </View>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
            
            {filteredDomains.length === 0 && (
              <View style={styles.emptyState}>
                <Paragraph>No domains found. Add a domain to start monitoring SSL certificates.</Paragraph>
              </View>
            )}
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
          <Dialog.Title>Add Domain</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Domain (e.g., example.com)"
              value={newDomain.domain}
              onChangeText={(text) => setNewDomain(prev => ({ ...prev, domain: text }))}
              style={styles.input}
              placeholder="example.com"
            />
            
            <TextInput
              label="Alert Days Before Expiry"
              value={newDomain.alertDays}
              onChangeText={(text) => setNewDomain(prev => ({ ...prev, alertDays: text }))}
              style={styles.input}
              keyboardType="numeric"
              placeholder="30"
            />
            
            <Paragraph style={styles.helpText}>
              We'll scan this domain for SSL certificate information and alert you when it's close to expiring.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddDomain} loading={addDomainMutation.isPending}>
              Add Domain
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
    width: '32%',
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
  domainCard: {
    marginVertical: 8
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  domainInfo: {
    flex: 1
  },
  domainTitle: {
    fontSize: 16
  },
  domainActions: {
    alignItems: 'flex-end'
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8
  },
  emptyState: {
    alignItems: 'center',
    padding: 32
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
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8
  }
});

export default SSLMonitorScreen;
