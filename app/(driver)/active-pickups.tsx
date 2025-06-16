import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { MapPin, Package, CheckCircle } from 'lucide-react-native';

interface Pickup {
  _id: string;
  donationType: string;
  status: string;
  pickupAddress: string;
  pickupDate: string;
  pickupNotes: string;
  size: number;
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

export default function ActivePickups() {
  const { user } = useAuth();
  const [activePickups, setActivePickups] = useState<Pickup[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivePickups();
  }, []);

  const fetchActivePickups = async () => {
    try {
      setRefreshing(true);
      const response = await api.get<Pickup[]>('/driver/active-pickups');
      setActivePickups(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching active pickups:', error);
      Alert.alert('Error', 'Failed to fetch active pickups');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCompletePickup = async (pickupId: string) => {
    try {
      await api.post(`/driver/complete-pickup/${pickupId}`);
      Alert.alert('Success', 'Pickup completed successfully');
      fetchActivePickups();
    } catch (error) {
      console.error('Error completing pickup:', error);
      Alert.alert('Error', 'Failed to complete pickup');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchActivePickups} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Active Pickups</Text>
      </View>

      {activePickups.length === 0 ? (
        <Text style={styles.emptyText}>No active pickups</Text>
      ) : (
        activePickups.map((pickup) => (
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
                Size: {pickup.size}
              </Text>
              <Text style={styles.detailText}>
                Note: {pickup.pickupNotes}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleCompletePickup(pickup._id)}
            >
              <Text style={styles.completeButtonText}>Mark as Completed</Text>
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
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonText: {
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