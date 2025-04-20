import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';

const windowWidth = Dimensions.get('window').width;

interface TopBarProps {
  // Add any props you might need in the future
}

export default function TopBar({}: TopBarProps) {
  // Get status bar height for proper positioning
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
  
  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      <Image 
        source={require('../assets/images/Logo4.png')} 
        style={styles.logo} 
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: windowWidth,
    height: 60 + (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0),
    backgroundColor: '#FCF2E9', // Using the app's background color from memories
    borderBottomWidth: 1,
    borderBottomColor: 'black', // Using the accent color from memories
    overflow: 'hidden', // This ensures the image doesn't overflow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:10,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
    borderRadius: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderStartColor: '#FCF2E9',
    borderEndColor: '#FCF2E9',
    borderTopColor: '#FCF2E9',
    borderBottomColor: '#FCF2E9',
  },
  logo: {
    width: windowWidth,
    height: '190%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    position: 'absolute',
    left: 16,
    bottom: 12,
  },
});
