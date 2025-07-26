import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Leaderboard from '@/components/Leaderboard';
import { api } from '@/lib/api';

interface UserType {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userType: 'donor' | 'driver';
  profileImage?: string | null;
}

export default function DriverProfile() {
  const { user, logout, updateProfileImage } = useAuth();
  const typedUser = user as UserType | null;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typedUser && typedUser.profileImage) {
      // If profileImage is a GridFS ID, construct the full URL
      if (typeof typedUser.profileImage === 'string' && typedUser.profileImage.match(/^[0-9a-fA-F]{24}$/)) {
        setProfileImage(`${api}/${typedUser.profileImage}`);
      } else {
        setProfileImage(typedUser.profileImage);
      }
    } else {
      setProfileImage(null);
    }
  }, [typedUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setIsLoading(true);
      const uploadResult = await updateProfileImage(uri);
      setIsLoading(false);
      if (uploadResult.success) {
        setProfileImage(uri);
      } else {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to update profile image.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <User size={64} color="#4A90E2" />
          )}
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>
          {typedUser?.firstname} {typedUser?.lastname}
        </Text>
        <Text style={styles.username}>@{typedUser?.username}</Text>
        {isLoading && <ActivityIndicator size="small" color="#4A90E2" style={{ marginTop: 8 }} />}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.leaderboardSection}>
        <Leaderboard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  leaderboardSection: {
    flex: 1,
    marginTop: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 0,
  },
}); 