import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, StatusBar, Platform, TouchableOpacity, Animated } from 'react-native';
import { Menu } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const windowWidth = Dimensions.get('window').width;

interface TopBarProps {
  // Add any props you might need in the future
}

export default function TopBar({}: TopBarProps) {
  // Get status bar height for proper positioning
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;

  // Initialize menu position off-screen
  useEffect(() => {
    menuAnimation.setValue(0);
  }, []);

  const toggleMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: menuVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(!menuVisible);
    });
  };

  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [180, 0], // Slide in from right
  });

  const { requireAuth } = useAuth();
  
  // Navigation handler
  const handleNavigation = (route: string, message?: string) => {
    // Close menu first
    toggleMenu();
    
    // Then navigate
    if (route === 'index' || route === 'home') {
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
      <View style={[styles.container, { paddingTop: statusBarHeight }]}>
        <Image 
          source={require('../assets/images/Logo4.png')} 
          style={styles.logo} 
          resizeMode="cover"
        />
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={toggleMenu}
        >
          <Menu color="#2D5A27" size={24} />
        </TouchableOpacity>
      </View>
      
      {/* Hamburger Menu Overlay */}
      {menuVisible && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={toggleMenu}
        />
      )}
      
      {/* Slide-in Navigation Menu with enhanced styling */}
      <Animated.View 
        style={[
          styles.menuContainer,
          { 
            transform: [{ translateX: menuTranslateX }],
            shadowColor: menuVisible ? '#000' : 'transparent'
          }
        ]}
      >
        <View style={styles.navItems}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigation('profile', 'Please sign in to view your profile')}
          >
            <Image 
              source={require('../assets/images/bussiness-man.png')} 
              style={styles.navIcon} 
            />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigation('/(tabs)/donate-tab', 'Please sign in to access donation features')}
          >
            <Image 
              source={require('../assets/images/Donate.png')} 
              style={styles.navIcon} 
            />
            <Text style={styles.navText}>Donate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigation('schedule', 'Please sign in to access your donation schedule')}
          >
            <Image 
              source={require('../assets/images/caravan.png')} 
              style={styles.navIcon} 
            />
            <Text style={styles.navText}>MyWagon</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigation('/')}
          >
            <Image 
              source={require('../assets/images/plot.png')} 
              style={styles.navIcon} 
            />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: windowWidth,
    height: 50 + (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0),
    backgroundColor: '#FCF2E9', //  app's background color 
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    overflow: 'hidden', // This ensures the image doesn't overflow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 10,
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
  menuButton: {
    padding: 12,
    marginRight: 15,
    zIndex: 1001,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1001,
  },
  menuContainer: {
    position: 'absolute',
    top: 50 + (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0),
    right: 0,
    width: 180,
    height: 'auto', // Auto height based on content
    maxHeight: 350, // Maximum height constraint
    backgroundColor: '#FCF2E9',
    zIndex: 1002,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.5)',
  },
  navItems: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    marginTop: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 90, 39, 0.15)',
    width: '90%',
    borderRadius: 12,
  },
  navIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
    opacity: 0.9,
  },
  navText: {
    fontSize: 16,
    color: '#2D5A27',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
