import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Home, TruckIcon, Calendar, User,HeartHandshake } from 'lucide-react-native';

const windowWidth = Dimensions.get('window').width;

export default function TabLayout() {
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
      </Tabs>

      {/* Bottom Navigation Bar - Exactly as it was in DonationScreen */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push("/LandingPage")}>
          
          <Home color="#2D5A27" size={24} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push("/Donate")}
        >
          <HeartHandshake color="#2D5A27" size={24} />
          <Text style={styles.navText}>Donate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Calendar color="#2D5A27" size={24} />
          <Text style={styles.navText}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
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
    borderTopWidth: 1, // Made border slightly thicker
    borderTopColor: '#2D5A27', // Changed to your red color
    shadowColor: '#000', // Added shadow for better definition
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#2D5A27',
  },
});