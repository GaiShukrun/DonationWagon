import { Image, StyleSheet, Platform } from 'react-native';
import { View, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import LandingPage from './LandingPage'; // adjust the import path as needed


export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={{ 
      flex: 1
      }}>
    <LandingPage />
  </View>
  );
}

