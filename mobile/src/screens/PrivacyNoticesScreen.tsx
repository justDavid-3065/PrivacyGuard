
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, TextInput, Chip, FAB, List, Searchbar, Dialog, Portal, RadioButton, Menu } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PrivacyNoticesScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedRegulation, setSelectedRegulation] = useState('all');
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    regulation: 'GDPR',
    isActive: true,
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  const { data: notices, isLoading } = useQuery({
    queryKey: ['privacyNotices'],
    queryFn: async () => {
      const response = await fetch('/api/privacy-notices', {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch privacy notices');
      return response.json();
    }
  });

  const createNoticeMutation = useMutation({
    mutationFn: async (notice: any) => {
      const response = await fetch('/api/privacy-notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          ...notice,
          version: 'v1.0',
          effectiveDate: new Date(notice.effectiveDate)
        })
      });
      if (!response.ok) throw new Error('Failed to create privacy notice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacyNotices'] });
      setDialogVisible(false);
      resetForm();
      Alert.alert('Success', 'Privacy notice created successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create privacy notice');
    }
  });

  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const response = await fetch(`/api/privacy-notices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to update privacy notice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacyNotices'] });
      Alert.alert('Success', 'Privacy notice status updated');
    }
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/privacy-notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to delete privacy notice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacyNotices'] });
      Alert.alert('Success', 'Privacy notice deleted');
    }
  });

  const getAuthToken = async () => {
    return 'mock-token';
  };

  const resetForm = () => {
    setNewNotice({
      title: '',
      content: '',
      regulation: 'GDPR',
      isActive: true,
      effectiveDate: new Date().toISOString().split('T')[0]
    });
  };

  const filteredNotices = notices?.filter((notice: any) => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegulation = selectedRegulation === 'all' || notice.regulation === selectedRegulation;
    return matchesSearch && matchesRegulation;
  }) || [];

  const handleCreateNotice = () => {
    if (!newNotice.title || !newNotice.content) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }
    createNoticeMutation.mutate(newNotice);
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleActiveStatusMutation.mutate({ id, isActive: !isActive });
  };

  const handleDeleteNotice = (id: string, title: string) => {
    Alert.alert(
      'Delete Privacy Notice',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteNoticeMutation.mutate(id) }
      ]
    );
  };

  const getRegulationColor = (regulation: string) => {
    switch (regulation) {
      case 'GDPR': return '#2196f3';
      case 'CCPA': return '#ff9800';
      case 'UK_DPA': return '#4caf50';
      case 'PIPEDA': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  const generateTemplate = () => {
    const templates = {
      GDPR: {
        title: 'GDPR Privacy Policy',
        content: `PRIVACY POLICY

1. DATA CONTROLLER
[Your Company Name] is the data controller responsible for your personal data.

2. PERSONAL DATA WE COLLECT
We collect the following categories of personal data:
- Contact information (name, email, phone)
- Account information
- Usage data

3. LEGAL BASIS FOR PROCESSING
We process your personal data based on:
- Your consent (Article 6(1)(a))
- Contract performance (Article 6(1)(b))
- Legitimate interests (Article 6(1)(f))

4. YOUR RIGHTS
Under GDPR, you have the right to:
- Access your personal data (Article 15)
- Rectify inaccurate data (Article 16)
- Erase your data (Article 17)
- Restrict processing (Article 18)
- Data portability (Article 20)
- Object to processing (Article 21)

5. DATA RETENTION
We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy.

6. CONTACT US
For privacy-related questions, contact us at [privacy@yourcompany.com]`
      },
      CCPA: {
        title: 'CCPA Privacy Notice',
        content: `CALIFORNIA PRIVACY NOTICE

This notice applies to California residents under the California Consumer Privacy Act (CCPA).

1. PERSONAL INFORMATION WE COLLECT
Categories of personal information we collect:
- Identifiers
- Commercial information
- Internet activity
- Geolocation data

2. YOUR CCPA RIGHTS
You have the right to:
- Know what personal information we collect
- Delete your personal information
- Opt-out of the sale of personal information
- Non-discrimination for exercising your rights

3. HOW TO EXERCISE YOUR RIGHTS
To exercise your rights, contact us at [privacy@yourcompany.com] or call [phone number].

4. SALE OF PERSONAL INFORMATION
We do not sell personal information to third parties.`
      }
    };

    const template = templates[newNotice.regulation as keyof typeof templates];
    if (template) {
      setNewNotice(prev => ({
        ...prev,
        title: template.title,
        content: template.content
      }));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Title>Loading privacy notices...</Title>
      </View>
    );
  }

  const regulationStats = {
    total: notices?.length || 0,
    active: notices?.filter((n: any) => n.isActive).length || 0,
    gdpr: notices?.filter((n: any) => n.regulation === 'GDPR').length || 0,
    ccpa: notices?.filter((n: any) => n.regulation === 'CCPA').length || 0
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Privacy Notices Overview</Title>
            <View style={styles.statsGrid}>
              <Surface style={styles.statCard}>
                <Title>{regulationStats.total}</Title>
                <Paragraph>Total Notices</Paragraph>
              </Surface>
              <Surface style={styles.statCard}>
                <Title>{regulationStats.active}</Title>
                <Paragraph>Active</Paragraph>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.controls}>
          <Searchbar
            placeholder="Search privacy notices"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <Menu
            visible={filterVisible}
            onDismiss={() => setFilterVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setFilterVisible(true)}>
                {selectedRegulation === 'all' ? 'All' : selectedRegulation}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSelectedRegulation('all'); setFilterVisible(false); }} title="All" />
            <Menu.Item onPress={() => { setSelectedRegulation('GDPR'); setFilterVisible(false); }} title="GDPR" />
            <Menu.Item onPress={() => { setSelectedRegulation('CCPA'); setFilterVisible(false); }} title="CCPA" />
            <Menu.Item onPress={() => { setSelectedRegulation('UK_DPA'); setFilterVisible(false); }} title="UK DPA" />
            <Menu.Item onPress={() => { setSelectedRegulation('PIPEDA'); setFilterVisible(false); }} title="PIPEDA" />
          </Menu>
        </View>

        <Card style={styles.listCard}>
          <Card.Content>
            <Title>Privacy Notices ({filteredNotices.length})</Title>
            {filteredNotices.map((notice: any) => (
              <Card key={notice.id} style={styles.noticeCard}>
                <Card.Content>
                  <View style={styles.noticeHeader}>
                    <View style={styles.noticeInfo}>
                      <Title style={styles.noticeTitle}>{notice.title}</Title>
                      <Paragraph>Version: {notice.version}</Paragraph>
                      <View style={styles.noticeDetails}>
                        <Chip
                          style={{ backgroundColor: getRegulationColor(notice.regulation), marginRight: 8 }}
                          textStyle={{ color: 'white' }}
                        >
                          {notice.regulation}
                        </Chip>
                        <Chip mode={notice.isActive ? 'flat' : 'outlined'}>
                          {notice.isActive ? 'Active' : 'Inactive'}
                        </Chip>
                      </View>
                      <Paragraph style={styles.metadata}>
                        Effective: {new Date(notice.effectiveDate).toLocaleDateString()}
                      </Paragraph>
                      <Paragraph style={styles.metadata}>
                        Created: {new Date(notice.createdAt).toLocaleDateString()}
                      </Paragraph>
                    </View>
                    <View style={styles.noticeActions}>
                      <Button
                        mode="text"
                        onPress={() => handleToggleActive(notice.id, notice.isActive)}
                      >
                        {notice.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        mode="text"
                        textColor="#f44336"
                        onPress={() => handleDeleteNotice(notice.id, notice.title)}
                      >
                        Delete
                      </Button>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            {filteredNotices.length === 0 && (
              <View style={styles.emptyState}>
                <Paragraph>No privacy notices found. Create your first privacy notice to get started.</Paragraph>
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
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>Create Privacy Notice</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label="Title *"
                value={newNotice.title}
                onChangeText={(text) => setNewNotice(prev => ({ ...prev, title: text }))}
                style={styles.input}
              />

              <Title style={styles.sectionTitle}>Regulation</Title>
              <RadioButton.Group
                onValueChange={(value) => setNewNotice(prev => ({ ...prev, regulation: value }))}
                value={newNotice.regulation}
              >
                <RadioButton.Item label="GDPR (European Union)" value="GDPR" />
                <RadioButton.Item label="CCPA (California)" value="CCPA" />
                <RadioButton.Item label="UK DPA (United Kingdom)" value="UK_DPA" />
                <RadioButton.Item label="PIPEDA (Canada)" value="PIPEDA" />
              </RadioButton.Group>

              <Button mode="outlined" onPress={generateTemplate} style={styles.templateButton}>
                Generate Template
              </Button>

              <TextInput
                label="Content *"
                value={newNotice.content}
                onChangeText={(text) => setNewNotice(prev => ({ ...prev, content: text }))}
                style={styles.input}
                multiline
                numberOfLines={10}
              />

              <TextInput
                label="Effective Date"
                value={newNotice.effectiveDate}
                onChangeText={(text) => setNewNotice(prev => ({ ...prev, effectiveDate: text }))}
                style={styles.input}
                placeholder="YYYY-MM-DD"
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCreateNotice} loading={createNoticeMutation.isPending}>
              Create Notice
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
  statsGrid: {
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
  controls: {
    flexDirection: 'row',
    margin: 16,
    marginVertical: 8,
    alignItems: 'center',
    gap: 8
  },
  searchbar: {
    flex: 1
  },
  listCard: {
    margin: 16,
    marginTop: 8
  },
  noticeCard: {
    marginVertical: 8
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  noticeInfo: {
    flex: 1
  },
  noticeTitle: {
    fontSize: 16
  },
  noticeDetails: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'center'
  },
  metadata: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  noticeActions: {
    alignItems: 'flex-end'
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
  dialog: {
    maxHeight: '90%'
  },
  input: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8
  },
  templateButton: {
    marginBottom: 16
  }
});

export default PrivacyNoticesScreen;
