import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { LogOutIcon, User, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const windowWidth = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { user, logout, isUserLoggedIn, updateProfileImage } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load profile image when user changes
  useEffect(() => {
    if (isUserLoggedIn && user) {
      console.log('User object:', user);
      if (user.profileImage) {
        setProfileImage(user.profileImage);
      } else {
        loadProfileImage(); // Fallback to AsyncStorage if not in user object
      }
    }
  }, [isUserLoggedIn, user]);

  // Load profile image from storage (fallback)
  const loadProfileImage = async () => {
    try {
      if (!user || !user.id) return;
      
      const savedImage = await AsyncStorage.getItem(`profile_image_${user.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
        // Also update in backend if found locally
        saveProfileImageToBackend(savedImage);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  // Save profile image to storage and backend
  const saveProfileImage = async (uri) => {
    try {
      if (!user || !user.id) return;
      
      // Save locally as fallback
      await AsyncStorage.setItem(`profile_image_${user.id}`, uri);
      
      // Save to backend
      await saveProfileImageToBackend(uri);
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  };
  
  // Save image to backend
  const saveProfileImageToBackend = async (uri) => {
    try {
      const result = await updateProfileImage(uri);
      if (!result.success) {
        console.error('Error updating profile in backend:', result.error);
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        
        // Save image
        setIsLoading(true);
        
        // Just store the URI directly
        setProfileImage(selectedImage);
        await saveProfileImage(selectedImage);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Reset profile image
  const resetProfileImage = async () => {
    try {
      if (!user || !user.id) return;
      
      // Clear from local storage
      await AsyncStorage.removeItem(`profile_image_${user.id}`);
      setProfileImage(null);
      
      // Clear from backend
      await updateProfileImage(null);
      
      Alert.alert('Success', 'Profile image has been reset.');
    } catch (error) {
      console.error('Error resetting profile image:', error);
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    logout();
  };

  // If not logged in, show a simple message
  if (!isUserLoggedIn || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, styles.centerContent]}>
          <Text style={styles.headerTitle}>Please sign in to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Profile Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <LogOutIcon color="white" size={16} style={styles.signOutIcon} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={pickImage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#2D5A27" />
              ) : profileImage ? (
                <>
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  <View style={styles.cameraIconOverlay}>
                    <Camera color="#fff" size={20} />
                  </View>
                </>
              ) : (
                <>
                  <User color="#2D5A27" size={64} />
                  <View style={styles.cameraIconOverlay}>
                    <Camera color="#fff" size={20} />
                  </View>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.firstname} {user.lastname}</Text>
              <Text style={styles.userPoints}>{user.points || 0} Points</Text>
            </View>
          </View>

          {/* Additional Profile Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>First Name</Text>
              <Text style={styles.infoValue}>{user.firstname}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Name</Text>
              <Text style={styles.infoValue}>{user.lastname}</Text>
            </View>
            
            {/* Removed username display for security */}
          </View>
          
          {/* User Stats Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Your Donation Stats</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{user.itemsDonated || '0'}</Text>
                <Text style={styles.statLabel}>Items Donated</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{user.points || '0'}</Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{user.pickups || '0'}</Text>
                <Text style={styles.statLabel}>Pickups</Text>
              </View>
            </View>
          </View>
          
          {/* Debug/Testing Section */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetProfileImage}
            >
              <Text style={styles.resetButtonText}>Reset Profile Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5A27',
  },
  signOutButton: {
    backgroundColor: '#BE3E28',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  signOutIcon: {
    marginRight: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FCF2E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2D5A27',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 5,
  },
  userPoints: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionSection: {
    padding: 20,
  },
  resetButton: {
    backgroundColor: '#888',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    backgroundColor: '#FCF2E9',
    padding: 16,
    borderRadius: 12,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
