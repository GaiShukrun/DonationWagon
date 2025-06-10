import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import * as Location from 'expo-location';
import { api } from '@/lib/api';
import { MapPin, Package, CheckCircle, AlertCircle } from 'lucide-react-native';

interface Pickup {
  _id: string;
  donationType: string;
  status: string;
  pickupAddress: string;
  pickupDate: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  userId: {
    firstname: string;
    lastname: string;
  };
}

interface User {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userType: 'donor' | 'driver';
}

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const [availablePickups, setAvailablePickups] = useState<Pickup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const typedUser = user as User | null;
    if (!typedUser || typedUser.userType !== 'driver') {
      return;
    }
    getCurrentLocation();
    fetchPickups();
  }, [user]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for this feature');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });

      // Update driver's location in the backend
      await api.post('/driver/location', { latitude, longitude });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const fetchPickups = async () => {
    try {
      setRefreshing(true);
      const params = currentLocation
        ? `?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}`
        : '';
      const response = await api.get<Pickup[]>(`/driver/available-pickups${params}`);
      setAvailablePickups(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching pickups:', error);
      Alert.alert('Error', 'Failed to fetch available pickups');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAssignPickup = async (pickupId: string) => {
    try {
      await api.post(`/driver/assign-pickup/${pickupId}`);
      Alert.alert('Success', 'Pickup assigned successfully');
      fetchPickups();
    } catch (error) {
      console.error('Error assigning pickup:', error);
      Alert.alert('Error', 'Failed to assign pickup');
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Distance unknown';
    return `${distance.toFixed(1)} km`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchPickups} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Available Pickups</Text>
      </View>

      {availablePickups.length === 0 ? (
        <Text style={styles.emptyText}>No available pickups</Text>
      ) : (
        availablePickups.map((pickup) => (
          <View key={pickup._id} style={styles.pickupCard}>
            <View style={styles.pickupHeader}>
              <Package size={24} color="#4A90E2" />
              <Text style={styles.pickupType}>
                {pickup.donationType.charAt(0).toUpperCase() + pickup.donationType.slice(1)}
              </Text>
            </View>
            <View style={styles.pickupDetails}>
              <View style={styles.detailRow}>
                <MapPin size={16} color="#666" />
                <Text style={styles.detailText}>{pickup.pickupAddress}</Text>
              </View>
              <Text style={styles.detailText}>
                Donor: {pickup.userId.firstname} {pickup.userId.lastname}
              </Text>
              <Text style={styles.detailText}>
                Date: {formatDate(pickup.pickupDate)}
              </Text>
              <Text style={styles.detailText}>
                Distance: {formatDistance(pickup.distance)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => handleAssignPickup(pickup._id)}
            >
              <Text style={styles.assignButtonText}>Assign to Me</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pickupCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickupType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  pickupDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  assignButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 32,
  },
}); 