import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react-native';

interface User {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userType: 'donor' | 'driver';
}

export default function DriverProfile() {
  const { user, logout } = useAuth();
  const typedUser = user as User | null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <User size={48} color="#4A90E2" />
        <Text style={styles.name}>
          {typedUser?.firstname} {typedUser?.lastname}
        </Text>
        <Text style={styles.username}>@{typedUser?.username}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
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
}); 