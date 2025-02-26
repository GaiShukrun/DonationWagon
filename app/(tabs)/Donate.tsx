import React, { useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function Donate() {
  const { isUserLoggedIn, requireAuth } = useAuth();

  useEffect(() => {
    // Check authentication when component mounts
    if (!isUserLoggedIn) {
      router.push('/(auth)/Sign-In');
    }
  }, [isUserLoggedIn]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FCF2E9' }}>  
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Donate Screen</Text>
      </View>
    </SafeAreaView>
  );
}