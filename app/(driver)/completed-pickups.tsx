import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { MapPin, Package, CheckCircle } from 'lucide-react-native';
import DonationDetailsPopup from '@/components/DonationDetailsPopup';

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
  userId: {
    firstname: string;
    lastname: string;
  };
}

export default function CompletedPickups() {
  const { user } = useAuth();
  const [completedPickups, setCompletedPickups] = useState<Pickup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [loadingDonation, setLoadingDonation] = useState(false);

  useEffect(() => {
    fetchCompletedPickups();
  }, []);

  const fetchCompletedPickups = async () => {
    try {
      setRefreshing(true);
      const response = await api.get<Pickup[]>('/driver/completed-donations');
      setCompletedPickups(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching completed pickups:', error);
      Alert.alert('Error', 'Failed to fetch completed pickups');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePickupPress = async (pickup: Pickup) => {
    try {
      setLoadingDonation(true);
      const donation = await api.get(`/driver/donation/${pickup._id}`);
      setSelectedDonation(donation);
      setShowPopup(true);
    } catch (error) {
      console.error('Error fetching donation details:', error);
      Alert.alert('Error', 'Failed to load donation details');
    } finally {
      setLoadingDonation(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchCompletedPickups} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Completed Pickups</Text>
        </View>

        {completedPickups.length === 0 ? (
          <Text style={styles.emptyText}>No completed pickups</Text>
        ) : (
          completedPickups.map((pickup) => (
            <TouchableOpacity
              key={pickup._id}
              style={styles.pickupCard}
              onPress={() => handlePickupPress(pickup)}
              activeOpacity={0.7}
            >
              <View style={styles.pickupHeader}>
                <CheckCircle size={24} color="#4A90E2" />
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
            </TouchableOpacity>
          ))
        )}
        {loadingDonation && (
          <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={{ color: '#4A90E2', marginTop: 8 }}>Loading details...</Text>
          </View>
        )}
      </ScrollView>
      <DonationDetailsPopup
        visible={showPopup}
        onClose={() => {
          setShowPopup(false);
          setSelectedDonation(null);
        }}
        donation={selectedDonation}
      />
    </>
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
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 32,
  },
}); 