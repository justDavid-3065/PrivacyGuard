
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, TextInput, Chip, FAB, List, Searchbar, Dialog, Portal, RadioButton, Menu } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DSARScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [newDSAR, setNewDSAR] = useState({
    subjectEmail: '',
    subjectName: '',
    requestType: 'access',
    description: ''
  });

  const queryClient = useQueryClient();

  const { data: dsars, isLoading } = useQuery({
    queryKey: ['dsars'],
    queryFn: async () => {
      const response = await fetch('/api/dsar-requests', {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch DSARs');
      return response.json();
    }
  });

  const createDSARMutation = useMutation({
    mutationFn: async (dsar: any) => {
      const response = await fetch('/api/dsar-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(dsar)
      });
      if (!response.ok) throw new Error('Failed to create DSAR');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsars'] });
      setDialogVisible(false);
      setNewDSAR({ subjectEmail: '', subjectName: '', requestType: 'access', description: '' });
      Alert.alert('Success', 'DSAR request created successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create DSAR request');
    }
  });

  const updateDSARMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await fetch(`/api/dsar-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update DSAR');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsars'] });
      setMenuVisible(null);
      Alert.alert('Success', 'DSAR status updated');
    }
  });

  const getAuthToken = async () => {
    return 'mock-token';
  };

  const filteredDSARs = dsars?.filter((dsar: any) =>
    dsar.subjectEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dsar.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dsar.requestType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateDSAR = () => {
    if (!newDSAR.subjectEmail || !newDSAR.subjectName) {
      Alert.alert('Error', 'Email and name are required');
      return;
    }
    createDSARMutation.mutate(newDSAR);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'in_progress': return '#2196f3';
      case 'completed': return '#4caf50';
      case 'rejected': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getDaysRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const deadline = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Title>Loading DSAR requests...</Title>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>DSAR Overview</Title>
            <View style={styles.statsRow}>
              <Surface style={styles.statCard}>
                <Title>{dsars?.filter((d: any) => d.status === 'pending').length || 0}</Title>
                <Paragraph>Pending</Paragraph>
              </Surface>
              <Surface style={styles.statCard}>
                <Title>{dsars?.filter((d: any) => d.status === 'in_progress').length || 0}</Title>
                <Paragraph>In Progress</Paragraph>
              </Surface>
              <Surface style={styles.statCard}>
                <Title>{dsars?.filter((d: any) => getDaysRemaining(d.createdAt) <= 7).length || 0}</Title>
                <Paragraph>Due Soon</Paragraph>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        <Searchbar
          placeholder="Search by email, name, or type"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <Card style={styles.listCard}>
          <Card.Content>
            <Title>DSAR Requests</Title>
            {filteredDSARs.map((dsar: any) => (
              <Card key={dsar.id} style={styles.dsarCard}>
                <Card.Content>
                  <View style={styles.dsarHeader}>
                    <View style={styles.dsarInfo}>
                      <Title style={styles.dsarTitle}>{dsar.subjectName}</Title>
                      <Paragraph>{dsar.subjectEmail}</Paragraph>
                      <Paragraph>Type: {dsar.requestType}</Paragraph>
                      <Paragraph>Created: {new Date(dsar.createdAt).toLocaleDateString()}</Paragraph>
                    </View>
                    <View style={styles.dsarActions}>
                      <Chip
                        style={{ backgroundColor: getStatusColor(dsar.status) }}
                        textStyle={{ color: 'white' }}
                      >
                        {dsar.status}
                      </Chip>
                      <Paragraph style={styles.daysRemaining}>
                        {getDaysRemaining(dsar.createdAt)} days left
                      </Paragraph>
                      <Menu
                        visible={menuVisible === dsar.id}
                        onDismiss={() => setMenuVisible(null)}
                        anchor={
                          <Button onPress={() => setMenuVisible(dsar.id)}>
                            Update Status
                          </Button>
                        }
                      >
                        <Menu.Item 
                          onPress={() => updateDSARMutation.mutate({ id: dsar.id, status: 'pending' })} 
                          title="Pending" 
                        />
                        <Menu.Item 
                          onPress={() => updateDSARMutation.mutate({ id: dsar.id, status: 'in_progress' })} 
                          title="In Progress" 
                        />
                        <Menu.Item 
                          onPress={() => updateDSARMutation.mutate({ id: dsar.id, status: 'completed' })} 
                          title="Completed" 
                        />
                        <Menu.Item 
                          onPress={() => updateDSARMutation.mutate({ id: dsar.id, status: 'rejected' })} 
                          title="Rejected" 
                        />
                      </Menu>
                    </View>
                  </View>
                  {dsar.description && (
                    <Paragraph style={styles.description}>{dsar.description}</Paragraph>
                  )}
                </Card.Content>
              </Card>
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
          <Dialog.Title>New DSAR Request</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Subject Email"
              value={newDSAR.subjectEmail}
              onChangeText={(text) => setNewDSAR(prev => ({ ...prev, subjectEmail: text }))}
              style={styles.input}
            />
            
            <TextInput
              label="Subject Name"
              value={newDSAR.subjectName}
              onChangeText={(text) => setNewDSAR(prev => ({ ...prev, subjectName: text }))}
              style={styles.input}
            />

            <Title style={styles.sectionTitle}>Request Type</Title>
            <RadioButton.Group
              onValueChange={(value) => setNewDSAR(prev => ({ ...prev, requestType: value }))}
              value={newDSAR.requestType}
            >
              <RadioButton.Item label="Access (Article 15)" value="access" />
              <RadioButton.Item label="Rectification (Article 16)" value="rectification" />
              <RadioButton.Item label="Erasure (Article 17)" value="erasure" />
              <RadioButton.Item label="Portability (Article 20)" value="portability" />
              <RadioButton.Item label="Object (Article 21)" value="object" />
            </RadioButton.Group>

            <TextInput
              label="Description (Optional)"
              value={newDSAR.description}
              onChangeText={(text) => setNewDSAR(prev => ({ ...prev, description: text }))}
              style={styles.input}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCreateDSAR} loading={createDSARMutation.isPending}>
              Create Request
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
  dsarCard: {
    marginVertical: 8
  },
  dsarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  dsarInfo: {
    flex: 1
  },
  dsarTitle: {
    fontSize: 16
  },
  dsarActions: {
    alignItems: 'flex-end'
  },
  daysRemaining: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold'
  },
  description: {
    marginTop: 8,
    fontStyle: 'italic'
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

export default DSARScreen;
