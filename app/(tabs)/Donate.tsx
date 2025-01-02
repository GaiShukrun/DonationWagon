import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function Donate() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FCF2E9' }}>  
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Donate Screen</Text>
      </View>
    </SafeAreaView>
  );
}