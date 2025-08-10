
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import DashboardScreen from './src/screens/DashboardScreen';
import ConsentTrackerScreen from './src/screens/ConsentTrackerScreen';
import DSARScreen from './src/screens/DSARScreen';
import SSLMonitorScreen from './src/screens/SSLMonitorScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator initialRouteName="Dashboard">
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Privacy Guard' }}
            />
            <Stack.Screen 
              name="ConsentTracker" 
              component={ConsentTrackerScreen}
              options={{ title: 'Consent Tracking' }}
            />
            <Stack.Screen 
              name="DSAR" 
              component={DSARScreen}
              options={{ title: 'DSAR Requests' }}
            />
            <Stack.Screen 
              name="SSLMonitor" 
              component={SSLMonitorScreen}
              options={{ title: 'SSL Monitoring' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}
