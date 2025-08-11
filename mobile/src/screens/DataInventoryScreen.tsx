
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, TextInput, Chip, FAB, List, Searchbar, Dialog, Portal, RadioButton, Menu } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DataInventoryScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newDataType, setNewDataType] = useState({
    name: '',
    description: '',
    category: 'personal',
    purpose: '',
    source: '',
    retention: '',
    legalBasis: 'consent'
  });

  const queryClient = useQueryClient();

  const { data: dataTypes, isLoading } = useQuery({
    queryKey: ['dataTypes'],
    queryFn: async () => {
      const response = await fetch('/api/data-types', {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch data types');
      return response.json();
    }
  });

  const createDataTypeMutation = useMutation({
    mutationFn: async (dataType: any) => {
      const response = await fetch('/api/data-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(dataType)
      });
      if (!response.ok) throw new Error('Failed to create data type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataTypes'] });
      setDialogVisible(false);
      resetForm();
      Alert.alert('Success', 'Data type created successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create data type');
    }
  });

  const deleteDataTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/data-types/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (!response.ok) throw new Error('Failed to delete data type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataTypes'] });
      Alert.alert('Success', 'Data type deleted');
    }
  });

  const getAuthToken = async () => {
    return 'mock-token';
  };

  const resetForm = () => {
    setNewDataType({
      name: '',
      description: '',
      category: 'personal',
      purpose: '',
      source: '',
      retention: '',
      legalBasis: 'consent'
    });
  };

  // Schema-based categories with fallback when API returns empty data
  const availableCategories = dataTypes && dataTypes.length > 0 
    ? [...new Set(dataTypes.map((dt: any) => dt.category))]
    : ['personal', 'sensitive', 'financial', 'behavioral', 'technical'];

  const filteredDataTypes = dataTypes?.filter((dt: any) => {
    const matchesSearch = dt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dt.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleCreateDataType = () => {
    if (!newDataType.name || !newDataType.purpose || !newDataType.source) {
      Alert.alert('Error', 'Name, purpose, and source are required');
      return;
    }
    createDataTypeMutation.mutate(newDataType);
  };

  const handleDeleteDataType = (id: string, name: string) => {
    Alert.alert(
      'Delete Data Type',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteDataTypeMutation.mutate(id) }
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personal': return '#2196f3';
      case 'sensitive': return '#f44336';
      case 'financial': return '#ff9800';
      case 'health': return '#4caf50';
      case 'behavioral': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Title>Loading data inventory...</Title>
      </View>
    );
  }

  const categoryStats = {
    personal: dataTypes?.filter((dt: any) => dt.category === 'personal').length || 0,
    sensitive: dataTypes?.filter((dt: any) => dt.category === 'sensitive').length || 0,
    financial: dataTypes?.filter((dt: any) => dt.category === 'financial').length || 0,
    health: dataTypes?.filter((dt: any) => dt.category === 'health').length || 0,
    behavioral: dataTypes?.filter((dt: any) => dt.category === 'behavioral').length || 0
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Data Inventory Overview</Title>
            <View style={styles.statsGrid}>
              <Surface style={styles.statCard}>
                <Title>{dataTypes?.length || 0}</Title>
                <Paragraph>Total Data Types</Paragraph>
              </Surface>
              <Surface style={styles.statCard}>
                <Title>{categoryStats.sensitive}</Title>
                <Paragraph>Sensitive Data</Paragraph>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.controls}>
          <Searchbar
            placeholder="Search data types"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <Menu
            visible={filterVisible}
            onDismiss={() => setFilterVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setFilterVisible(true)}>
                Filter: {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSelectedCategory('all'); setFilterVisible(false); }} title="All Categories" />
            {availableCategories.map((category) => (
              <Menu.Item 
                key={category}
                onPress={() => { setSelectedCategory(category); setFilterVisible(false); }} 
                title={category.charAt(0).toUpperCase() + category.slice(1)} 
              />
            ))}
          </Menu>
        </View>

        <Card style={styles.listCard}>
          <Card.Content>
            <Title>Data Types ({filteredDataTypes.length})</Title>
            {filteredDataTypes.map((dataType: any) => (
              <Card key={dataType.id} style={styles.dataTypeCard}>
                <Card.Content>
                  <View style={styles.dataTypeHeader}>
                    <View style={styles.dataTypeInfo}>
                      <Title style={styles.dataTypeName}>{dataType.name}</Title>
                      <Paragraph>{dataType.description}</Paragraph>
                      <View style={styles.dataTypeDetails}>
                        <Chip
                          style={{ backgroundColor: getCategoryColor(dataType.category), marginRight: 8 }}
                          textStyle={{ color: 'white' }}
                        >
                          {dataType.category}
                        </Chip>
                        <Chip mode="outlined">
                          {dataType.legalBasis}
                        </Chip>
                      </View>
                      <Paragraph style={styles.metadata}>
                        Purpose: {dataType.purpose}
                      </Paragraph>
                      <Paragraph style={styles.metadata}>
                        Source: {dataType.source}
                      </Paragraph>
                      {dataType.retention && (
                        <Paragraph style={styles.metadata}>
                          Retention: {dataType.retention}
                        </Paragraph>
                      )}
                    </View>
                    <Button
                      mode="text"
                      textColor="#f44336"
                      onPress={() => handleDeleteDataType(dataType.id, dataType.name)}
                    >
                      Delete
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            {filteredDataTypes.length === 0 && (
              <View style={styles.emptyState}>
                <Paragraph>No data types found. Add a data type to start building your inventory.</Paragraph>
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
          <Dialog.Title>Add Data Type</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label="Name *"
                value={newDataType.name}
                onChangeText={(text) => setNewDataType(prev => ({ ...prev, name: text }))}
                style={styles.input}
              />
              
              <TextInput
                label="Description"
                value={newDataType.description}
                onChangeText={(text) => setNewDataType(prev => ({ ...prev, description: text }))}
                style={styles.input}
                multiline
                numberOfLines={2}
              />

              <Title style={styles.sectionTitle}>Category</Title>
              <RadioButton.Group
                onValueChange={(value) => setNewDataType(prev => ({ ...prev, category: value }))}
                value={newDataType.category}
              >
                <RadioButton.Item label="Personal Data" value="personal" />
                <RadioButton.Item label="Sensitive Data" value="sensitive" />
                <RadioButton.Item label="Financial Data" value="financial" />
                <RadioButton.Item label="Health Data" value="health" />
                <RadioButton.Item label="Behavioral Data" value="behavioral" />
              </RadioButton.Group>

              <TextInput
                label="Purpose *"
                value={newDataType.purpose}
                onChangeText={(text) => setNewDataType(prev => ({ ...prev, purpose: text }))}
                style={styles.input}
                placeholder="e.g., Customer communication, Analytics"
              />
              
              <TextInput
                label="Source *"
                value={newDataType.source}
                onChangeText={(text) => setNewDataType(prev => ({ ...prev, source: text }))}
                style={styles.input}
                placeholder="e.g., Website forms, Mobile app"
              />
              
              <TextInput
                label="Retention Period"
                value={newDataType.retention}
                onChangeText={(text) => setNewDataType(prev => ({ ...prev, retention: text }))}
                style={styles.input}
                placeholder="e.g., 2 years, Until consent withdrawn"
              />

              <Title style={styles.sectionTitle}>Legal Basis</Title>
              <RadioButton.Group
                onValueChange={(value) => setNewDataType(prev => ({ ...prev, legalBasis: value }))}
                value={newDataType.legalBasis}
              >
                <RadioButton.Item label="Consent" value="consent" />
                <RadioButton.Item label="Contract" value="contract" />
                <RadioButton.Item label="Legal Obligation" value="legal_obligation" />
                <RadioButton.Item label="Vital Interests" value="vital_interests" />
                <RadioButton.Item label="Public Task" value="public_task" />
                <RadioButton.Item label="Legitimate Interests" value="legitimate_interests" />
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCreateDataType} loading={createDataTypeMutation.isPending}>
              Add Data Type
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
  dataTypeCard: {
    marginVertical: 8
  },
  dataTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  dataTypeInfo: {
    flex: 1
  },
  dataTypeName: {
    fontSize: 16
  },
  dataTypeDetails: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'center'
  },
  metadata: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
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
    maxHeight: '80%'
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

export default DataInventoryScreen;
