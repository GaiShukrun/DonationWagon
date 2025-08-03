import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import { LogOutIcon, User, Camera } from 'lucide-react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Pattern, Polygon, Rect, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DonationCart from '@/components/DonationCart';
import { useApi } from '@/hooks/useApi';

const windowWidth = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { user, logout, isUserLoggedIn, updateProfileImage } = useAuth();
  const api = useApi();
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploadingFromStorage, setIsUploadingFromStorage] = useState(false);
  const [stats, setStats] = useState({
    itemsDonated: 0,
    points: 0,
    pickups: 0
  });

  // Trigger refresh of donation cart and stats when screen is focused
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        if (isUserLoggedIn && user && user.id) {
          console.log('Profile screen focused, refreshing donation cart and stats...');
          await AsyncStorage.setItem('donationCartNeedsRefresh', 'true');
          // Also refresh user stats to update "In Progress" count
          fetchUserStats();
        }
      };
      
      refreshData();
      
      return () => {}; // Cleanup function
    }, [isUserLoggedIn, user])
  );

  // Load profile image when user changes
  useEffect(() => {
    if (isUserLoggedIn && user) {
      console.log('User object:', user);
      if (user.profileImage) {
        // If profileImage is a GridFS ID, construct the full URL
        if (typeof user.profileImage === 'string' && user.profileImage.match(/^[0-9a-fA-F]{24}$/)) {
          // This is a MongoDB ObjectId format, so it's a GridFS reference
          const imageUrl = `https://donationwagon-2.onrender.com/profile-image/${user.profileImage}`;
          console.log('Setting profile image URL:', imageUrl);
          setProfileImage(imageUrl);
        } else {
          // It's already a full URL or URI
          console.log('Setting profile image to existing URL/URI:', user.profileImage);
          setProfileImage(user.profileImage);
        }
      } else {
        console.log('No profile image in user object, falling back to AsyncStorage');
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
        console.log('Found saved image in AsyncStorage:', savedImage.substring(0, 30) + '...');
        // Check if it's a local file URI or a backend URL
        if (savedImage.startsWith('http')) {
          // It's already a backend URL, just set it
          console.log('Using saved backend URL for profile image');
          setProfileImage(savedImage);
        } else if (savedImage.startsWith('file://') || savedImage.startsWith('content://')) {
          // It's a local file URI that needs to be uploaded
          console.log('Found local file URI in AsyncStorage, will upload it');
          setProfileImage(savedImage); // Set it temporarily for display
          
          // Only upload if we're not already in the process of uploading
          if (!isUploadingFromStorage) {
            setIsUploadingFromStorage(true);
            // Clear the local URI from AsyncStorage to prevent future upload attempts
            await AsyncStorage.removeItem(`profile_image_${user.id}`);
            // Upload it to the backend
            saveProfileImage(savedImage);
          }
        } else {
          // It might be just the GridFS ID
          const imageUrl = `https://donationwagon-2.onrender.com/profile-image/${savedImage}`;
          setProfileImage(imageUrl);
        }
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  // Save profile image to storage and backend
  const saveProfileImage = async (uri) => {
    try {
      if (!user || !user.id) {
        console.error('Cannot save profile image: User not logged in');
        Alert.alert('Error', 'You must be logged in to update your profile image');
        return;
      }
      
      console.log('==== SAVE PROFILE IMAGE STARTED ====');
      console.log('Image URI:', uri);
      setIsLoading(true);
      
      // Save to AsyncStorage first
      if (uri) {
        console.log('Saving image URI to AsyncStorage...');
        await AsyncStorage.setItem(`profile_image_${user.id}`, uri);
        // Save profile image to backend and update user state
        await saveProfileImageToBackend(uri);
      }
      
      // Reset the upload flag when done
      setIsUploadingFromStorage(false);
    } catch (error) {
      console.error('Error saving profile image:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'Failed to save profile image. Please try again.');
    }
  };
  
  // Save image to backend
  const saveProfileImageToBackend = async (uri) => {
    try {
      console.log('==== SAVE TO BACKEND STARTED ====');
      console.log('Calling updateProfileImage with URI:', uri);
      
      // Check if user is still logged in
      if (!user || !user.id) {
        console.error('User not logged in or missing ID');
        Alert.alert('Sign in Required', 'Please sign in to update your profile image');
        return { success: false, error: 'User not authenticated' };
      }
      
      // Check file size before uploading
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('File info:', fileInfo);
        
        if (fileInfo.exists && fileInfo.size) {
          const fileSizeMB = fileInfo.size / (1024 * 1024);
          console.log('File size:', fileSizeMB.toFixed(2), 'MB');
          
          // Warn if file is large but still allow upload attempt
          if (fileSizeMB > 5) {
            Alert.alert(
              'Large Image Warning', 
              `The selected image is ${fileSizeMB.toFixed(1)}MB which may be too large. For best results, please select an image under 5MB.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Try Anyway', onPress: () => console.log('User chose to try uploading large image anyway') }
              ]
            );
            return { success: false, error: 'Image too large' };
          }
        }
      } catch (fileError) {
        console.error('Error checking file info:', fileError);
        // Continue with upload even if file info check fails
      }
      
      setIsLoading(true);
      const result = await updateProfileImage(uri);
      console.log('updateProfileImage result:', result);
      
      if (!result.success) {
        console.error('Error updating profile in backend:', result.error);
        Alert.alert('Upload Failed', result.error || 'Failed to update profile image. Please try again.');
      } else {
        console.log('Profile image updated successfully in backend');
        console.log('Updated user data:', result.user);
        
        // If the backend returns a profile image ID, construct the full URL with cache busting
        if (result.user && result.user.profileImage) {
          const timestamp = new Date().getTime();
          const imageUrl = `https://donationwagon-2.onrender.com/profile-image/${result.user.profileImage}?t=${timestamp}`;
          console.log('Setting profile image with cache busting URL:', imageUrl);
          setProfileImage(imageUrl);
          await AsyncStorage.setItem('profileImageUri', imageUrl);
        }
      }
      
      // Always set loading to false here
      setIsLoading(false);
      
      return result;
    } catch (error) {
      console.error('Error in saveProfileImageToBackend:', error);
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    try {
      console.log('==== PROFILE IMAGE SELECTION STARTED ====');
      console.log('User ID:', user?.id);
     
      // Request permission
      console.log('Requesting photo library permission...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        console.log('Permission denied');
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }
      
      // Launch image picker with improved cropping options
      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
        base64: false,
        allowsMultipleSelection: false,
      });
      
      console.log('Image picker result:', {
        canceled: result.canceled,
        assets: result.assets ? `${result.assets.length} assets` : 'none'
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        console.log('Selected image URI:', selectedImage);
        
        // Save image
        console.log('Setting loading state to true');
        setIsLoading(true);
        
        // Just store the URI directly for immediate feedback
        console.log('Setting profile image in state');
        setProfileImage(selectedImage);
        
        console.log('Saving profile image to backend...');
        await saveProfileImage(selectedImage);
        
        console.log('Image upload process completed');
        setIsLoading(false);
      } else {
        console.log('Image selection canceled or no image selected');
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

  // Handle refresh action
  const onRefresh = async () => {
    setRefreshing(true);
    
    AsyncStorage.setItem('donationCartNeedsRefresh', 'true');
    fetchUserStats();
    setTimeout(() => {
      setRefreshing(false);
    }, 300);
  };

  // Fetch user's donation stats
  const fetchUserStats = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Fetching user stats once for user ID:', user.id);
      const response = await api.get(`/donations/user/${user.id}`);
      if (response && response.success && Array.isArray(response.donations)) {
        // Count picked up donations
        const completedDonations = response.donations.filter(
          donation => donation.status === 'completed'
        );
        
        const assignedDonations = response.donations.filter(
          donation => ['assigned', 'scheduled'].includes(donation.status)
        );
        

        // const schuduledDonations = response.donations.filter(
        //   donation => donation.status === 'scheduled'
        // );

        // Sum sizes
        const sumSizes = (donationList) =>
          donationList.reduce((total, donation) => total + (donation.size || 0), 0);

        setStats({
          itemsDonated: sumSizes(completedDonations),
          points: user.points || 0,
          pickups: sumSizes(assignedDonations)
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Only fetch stats when component mounts or user ID changes
useEffect(() => {
    let isMounted = true;
    if (isMounted && user?.id) {
      fetchUserStats();
    }
    return () => { isMounted = false; };
  }, [user?.id]); // Only depend on user.id, not the entire user object

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
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3498db', '#9b59b6']} // Android: Spinning colors
            tintColor="#e74c3c" // iOS: Spinner color
            title="Refreshing..." // iOS: Text under spinner
            titleColor="#e74c3c"
        />
        }
      >
        <View style={styles.content}>
          {/* Profile Header */}
          <View style={styles.header}>
            
            {/* <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <LogOutIcon color="black" size={20} style={styles.signOutIcon} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity> */}
          </View>

          {/* Profile Card */}
          <View style={styles.card}>
              <View style={styles.card__img}>
                <Image 
                  source={require('@/assets/images/background2.png')} 
                  style={{
                    width: '100%', 
                    height: '100%', 
                    borderTopLeftRadius: 16, 
                    borderTopRightRadius: 16
                  }} 
                  resizeMode="cover" 
                />
              </View>
              <TouchableOpacity style={styles.card__avatar} onPress={pickImage} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#2D5A27" />
                ) : profileImage ? (
                  <>
                    <Image 
                      source={{ uri: profileImage, cache: 'reload' }} 
                      style={styles.profileImage}
                      resizeMode="cover"
                      onLoadStart={() => console.log('Image load started:', profileImage)}
                      onLoad={() => console.log('Image loaded successfully:', profileImage)}
                      onError={(e) => {
                        console.error('Error loading profile image:', e.nativeEvent.error);
                        console.error('Failed image URL:', profileImage);
                        // If image fails to load, fall back to default avatar
                        setProfileImage(null);
                      }} 
                    />
                  </>
                ) : (
                  <Svg viewBox="0 0 128 128" width="100px" height="100px">
                    <Circle cx="64" cy="64" fill="#ff8475" r="60" />
                    <Circle cx="64" cy="64" fill="#f85565" opacity=".4" r="48" />
                    <Path d="m64 14a32 32 0 0 1 32 32v41a6 6 0 0 1 -6 6h-52a6 6 0 0 1 -6-6v-41a32 32 0 0 1 32-32z" fill="#7f3838" />
                    {/* Truncated SVG for brevity */}
                    <Path d="m64 84c5 0 7-3 7-3h-14s2 3 7 3z" fill="#f85565" opacity=".4" />
                    <Path d="m65.07 78.93-.55.55a.73.73 0 0 1 -1 0l-.55-.55c-1.14-1.14-2.93-.93-4.27.47l-1.7 1.6h14l-1.66-1.6c-1.34-1.4-3.13-1.61-4.27-.47z" fill="#f85565" />
                  </Svg>
                )}
              </TouchableOpacity>
              <Text style={styles.card__title}>{user.firstname} {user.lastname}</Text>
              
              <View style={styles.card__wrapper}>
                <TouchableOpacity style={styles.card__btn} onPress={pickImage}>
                  <Text>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.card__btn, styles.card__btn_solid]} onPress={handleSignOut}>
                  <Text style={{color: '#fff'}}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>

          {/* Additional Profile Information */}
        
          
          {/* User Stats Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Your Donation Stats</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.itemsDonated}</Text>
                <Text style={styles.statLabel}>Items Donated</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.points}</Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.pickups}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
            </View>
          </View>
          
          {/* Donation Cart Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Your Donation Cart</Text>
            {user && user.id ? (
              <DonationCart userId={user.id} />
            ) : (
              <Text style={styles.errorText}>Unable to load user information</Text>
            )}
          </View>
          
          {/* Debug/Testing Section */}
          <View style={styles.actionSection}>
            {/* <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetProfileImage}
            >
              <Text style={styles.resetButtonText}>Reset Profile Image</Text>
            </TouchableOpacity> */}
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
    backgroundColor: '#FCF2E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    color: 'black',
    fontWeight: '600',
    marginLeft: 4,
  },
  signOutIcon: {
    marginRight: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  card: {
    position: 'relative',
    width: '100%',
    height: 384,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
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
  card__img: {
    height: 192,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  card__avatar: {
    position: 'absolute',
    width: 114,
    height: 114,
    backgroundColor: '#fff',
    borderRadius: 57,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    top: 135,
  },
  card__title: {
    marginTop: 60,
    fontWeight: '500',
    fontSize: 18,
    color: '#000',
  },
  card__subtitle: {
    marginTop: 10,
    fontWeight: '400',
    fontSize: 15,
    color: '#78858F',
  },
  card__wrapper: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  card__btn: {
    marginTop: 15,
    width: 76,
    height: 31,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card__btn_solid: {
    backgroundColor: '#000',
    color: '#fff',
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
    backgroundColor: '#e8f5e9',
    padding: 10,
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
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
