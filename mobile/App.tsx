
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import DashboardScreen from './src/screens/DashboardScreen';
import ConsentTrackerScreen from './src/screens/ConsentTrackerScreen';
import DSARScreen from './src/screens/DSARScreen';
import SSLMonitorScreen from './src/screens/SSLMonitorScreen';
import DataInventoryScreen from './src/screens/DataInventoryScreen';
import PrivacyNoticesScreen from './src/screens/PrivacyNoticesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OfflineIndicator from './src/components/OfflineIndicator';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Icon.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'view-dashboard';
              break;
            case 'Data':
              iconName = 'database';
              break;
            case 'Privacy':
              iconName = 'shield-check';
              break;
            case 'SSL':
              iconName = 'certificate';
              break;
            case 'Settings':
              iconName = 'cog';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="Data" 
        component={DataInventoryScreen}
        options={{ title: 'Data Inventory' }}
      />
      <Tab.Screen 
        name="Privacy" 
        component={PrivacyStack}
        options={{ title: 'Privacy' }}
      />
      <Tab.Screen 
        name="SSL" 
        component={SSLMonitorScreen}
        options={{ title: 'SSL Monitor' }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function PrivacyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PrivacyNotices" 
        component={PrivacyNoticesScreen}
        options={{ title: 'Privacy Notices' }}
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
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <View style={{ flex: 1 }}>
          <OfflineIndicator />
          <NavigationContainer>
            <StatusBar style="auto" />
            <Stack.Navigator 
              initialRouteName="Main"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen 
                name="ConsentDetails" 
                component={ConsentTrackerScreen}
                options={{ 
                  headerShown: true,
                  title: 'Consent Details' 
                }}
              />
              <Stack.Screen 
                name="DSARDetails" 
                component={DSARScreen}
                options={{ 
                  headerShown: true,
                  title: 'DSAR Details' 
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </PaperProvider>
    </QueryClientProvider>
  );
}
