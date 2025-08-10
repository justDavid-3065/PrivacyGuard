
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Surface } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

const DashboardScreen = ({ navigation }: any) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      // In production, this would call your API
      return {
        totalDataTypes: 12,
        openDsars: 3,
        totalDomains: 8,
        expiringCerts: 2,
        complianceScore: 87
      };
    }
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Title>Loading...</Title>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Privacy Dashboard</Title>
        <Paragraph>Monitor your privacy compliance status</Paragraph>
      </View>

      <View style={styles.statsGrid}>
        <Surface style={styles.statCard}>
          <Title>{stats?.complianceScore}%</Title>
          <Paragraph>Compliance Score</Paragraph>
        </Surface>
        
        <Surface style={styles.statCard}>
          <Title>{stats?.totalDataTypes}</Title>
          <Paragraph>Data Types</Paragraph>
        </Surface>
        
        <Surface style={styles.statCard}>
          <Title>{stats?.openDsars}</Title>
          <Paragraph>Open DSARs</Paragraph>
        </Surface>
        
        <Surface style={styles.statCard}>
          <Title>{stats?.expiringCerts}</Title>
          <Paragraph>Expiring Certs</Paragraph>
        </Surface>
      </View>

      <View style={styles.quickActions}>
        <Title style={styles.sectionTitle}>Quick Actions</Title>
        
        <Button
          mode="contained"
          style={styles.actionButton}
          onPress={() => navigation.navigate('ConsentTracker')}
        >
          Manage Consent
        </Button>
        
        <Button
          mode="contained"
          style={styles.actionButton}
          onPress={() => navigation.navigate('DSAR')}
        >
          DSAR Requests
        </Button>
        
        <Button
          mode="contained"
          style={styles.actionButton}
          onPress={() => navigation.navigate('SSLMonitor')}
        >
          SSL Monitoring
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  header: {
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  quickActions: {
    marginTop: 16
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16
  },
  actionButton: {
    marginBottom: 12
  }
});

export default DashboardScreen;
