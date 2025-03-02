import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Home, TruckIcon, Calendar, User, HeartHandshake } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const windowWidth = Dimensions.get('window').width;

export default function TabLayout() {
  const { requireAuth } = useAuth();

  // Add proper type annotations for parameters
  const handleNavigation = (route: string, message?: string) => {
    if (route === '/') {
      // Allow direct navigation to home
      router.push('/');
      return;
    }
    
    // For other routes, check authentication with custom message
    requireAuth(() => {
      router.push(route);
    }, message);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="donate" />
        <Tabs.Screen name="schedule" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="donation-details" options={{ href: null }} />
      </Tabs>

      {/* Bottom Navigation Bar - Exactly as it was in DonationScreen */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleNavigation('/')}
        >
          <Home color="#2D5A27" size={24} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => requireAuth(
            () => router.push({
              pathname: '/(tabs)/donation-details'
            }),
            'Please sign in to access donation features'
          )}
        >
          <HeartHandshake color="#2D5A27" size={24} />
          <Text style={styles.navText}>Donate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => requireAuth(
            () => router.push('schedule'), 
            'Please sign in to access your donation schedule'
          )}
        >
          <Calendar color="#2D5A27" size={24} />
          <Text style={styles.navText}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => requireAuth(
            () => router.push('profile'),
            'Please sign in to view your profile'
          )}
        >
          <User color="#2D5A27" size={24} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: windowWidth / 4 - 10,
  },
  navText: {
    fontSize: 12,
    color: '#2D5A27',
    marginTop: 4,
  },
});