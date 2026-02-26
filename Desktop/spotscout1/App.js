import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { getStudent } from './src/data/storage';
import { colors } from './src/components/theme';

import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen       from './src/screens/HomeScreen';
import ScannerScreen    from './src/screens/ScannerScreen';
import MySpotsScreen    from './src/screens/MySpotsScreen';
import AdminScreen      from './src/screens/AdminScreen';
import SettingsScreen   from './src/screens/SettingsScreen';
import FullMapScreen    from './src/screens/FullMapScreen';
const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10, marginTop: 2,
        color: focused ? colors.navy : colors.gray,
        fontWeight: focused ? '700' : '400',
      }}>{label}</Text>
    </View>
  );
}

function ScannerTabIcon({ focused }) {
  return (
    <View style={{
      width: 58, height: 58, borderRadius: 29,
      backgroundColor: colors.navy,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    }}>
      <Text style={{ fontSize: 24 }}>📷</Text>
    </View>
  );
}

function HomeTabs({ onReset }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="MySpots"
        component={MySpotsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="My Spots" focused={focused} /> }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ tabBarIcon: ({ focused }) => <ScannerTabIcon focused={focused} /> }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Admin" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }}
      >
        {() => <SettingsScreen onReset={onReset} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading]           = useState(true);
  const [hasProfile, setHasProfile]     = useState(false);

  const checkProfile = async () => {
    const s = await getStudent();
    setHasProfile(!!s);
    setLoading(false);
  };

  useEffect(() => { checkProfile(); }, []);

  if (loading) return (
    <View style={styles.splash}>
      <Text style={styles.splashEmoji}>📍</Text>
      <Text style={styles.splashTitle}>SpotScout</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: 20 }} />
    </View>
  );

  if (!hasProfile) return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <OnboardingScreen onDone={() => setHasProfile(true)} />
    </SafeAreaProvider>
  );

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main">
            {() => <HomeTabs onReset={() => setHasProfile(false)} />}
          </Stack.Screen>
          <Stack.Screen name="FullMap" component={FullMapScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash:       { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  splashEmoji:  { fontSize: 52, marginBottom: 10 },
  splashTitle:  { color: colors.white, fontSize: 32, fontWeight: '800', letterSpacing: 1 },
});
