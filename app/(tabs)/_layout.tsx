import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, StatusBar } from 'react-native';
import { Home, TruckIcon, Calendar, User } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const windowWidth = Dimensions.get('window').width;

export default function TabLayout() {
  const { requireAuth } = useAuth();
  
  // Ensure status bar is completely removed in this layout
  useEffect(() => {
    // Use multiple methods to ensure the status bar is completely hidden
    StatusBar.setHidden(true, 'none');
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('#00000000');
    
    return () => {
      // This cleanup is important for when the component unmounts
      StatusBar.setHidden(true, 'none');
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('#00000000');
    };
  }, []);

  // Add proper type annotations for parameters
  const handleNavigation = (route: string, message?: string) => {
    // Fix navigation to use proper route types
    if (route === 'index' || route === 'home') {
      // Allow direct navigation to home
      router.replace({ pathname: '/(tabs)' });
      return;
    }
    
    // For other routes, check authentication with custom message
    requireAuth(() => {
      router.push({ pathname: route as any });
    }, message);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          headerStatusBarHeight: 0,
          tabBarStyle: { display: 'none' }, // Completely hide the tab bar
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="donate-tab" />
        <Tabs.Screen name="schedule" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="donation-details" options={{ href: null }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  // Styles removed as they're no longer needed
});