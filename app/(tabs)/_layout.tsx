import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { Home, TruckIcon, Calendar, User } from 'lucide-react-native';
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
        <Tabs.Screen name="donate-tab" />
        <Tabs.Screen name="schedule" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="donation-details" options={{ href: null }} />
      </Tabs>

      {/* Bottom Navigation Bar - Exactly as it was in DonationScreen */}
      <View style={styles.bottomNav}>
      <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleNavigation('profile', 'Please sign in to view your profile')}
        >
          <Image 
            source={require('../../assets/images/bussiness-man.png')} 
            style={styles.navIcon} 
          />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleNavigation('/(tabs)/donate-tab', 'Please sign in to access donation features')}
        >
          <Image 
            source={require('../../assets/images/Donate.png')} 
            style={styles.navIcon} 
          />
          <Text style={styles.navText}>Donate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleNavigation('schedule', 'Please sign in to access your donation schedule')}
        >
          <Image 
            source={require('../../assets/images/calendar.png')} 
            style={styles.navIcon} 
          />
          <Text style={styles.navText}>Schedule</Text>
        </TouchableOpacity>
        
   
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleNavigation('/')}
        >
          <Image 
            source={require('../../assets/images/house.png')} 
            style={styles.navIcon} 
          />
          <Text style={styles.navText}>Home</Text>
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
  navIcon: {
    width: 30,
    height: 30,
    
  },
 
});