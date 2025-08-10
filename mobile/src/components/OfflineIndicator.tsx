
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Banner, Text } from 'react-native-paper';
import { useOfflineSync } from '../hooks/useOfflineSync';

const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingActions } = useOfflineSync();

  if (isOnline && pendingActions === 0) {
    return null;
  }

  return (
    <Banner
      visible={!isOnline || pendingActions > 0}
      icon={!isOnline ? 'wifi-off' : 'sync'}
      style={[
        styles.banner,
        { backgroundColor: !isOnline ? '#f44336' : '#ff9800' }
      ]}
    >
      <Text style={styles.text}>
        {!isOnline 
          ? 'You are offline. Changes will sync when connection is restored.'
          : `${pendingActions} changes pending sync...`
        }
      </Text>
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000
  },
  text: {
    color: 'white',
    fontWeight: '500'
  }
});

export default OfflineIndicator;
