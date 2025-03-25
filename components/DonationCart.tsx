import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Trash2, Calendar, Package, Clock, Check, AlertTriangle, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import useApi from '@/hooks/useApi';
import CustomAlertMessage from './CustomAlertMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DonationItem = {
  _id: string;
  donationType: 'clothes' | 'toys';
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  clothingItems?: Array<{
    type: string;
    quantity: number;
    images: string[];
  }>;
  toyItems?: Array<{
    name: string;
    quantity: number;
    images: string[];
  }>;
  pickupDate?: string;
};

type DonationCartProps = {
  userId: string;
};

const DonationCart = ({ userId }: { userId: string }) => {
  const api = useApi();
  const router = useRouter();
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (userId) {
      fetchDonations();
      
      // Set up a refresh check interval
      const checkRefreshInterval = setInterval(checkForRefresh, 500);
      
      // Clean up interval on unmount
      return () => clearInterval(checkRefreshInterval);
    }
  }, [userId]);
  
  // Check if the cart needs to be refreshed
  const checkForRefresh = async () => {
    try {
      const needsRefresh = await AsyncStorage.getItem('donationCartNeedsRefresh');
      if (needsRefresh === 'true') {
        console.log('Refreshing donation cart...');
        fetchDonations();
        await AsyncStorage.setItem('donationCartNeedsRefresh', 'false');
      }
    } catch (error) {
      console.error('Error checking refresh status:', error);
    }
  };

  // Fetch donations from API
  const fetchDonations = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log(`Fetching donations for user: ${userId}`);
      const response = await api.get(`/donations/user/${userId}`);
      console.log('Donations response:', response);
      
      if (response && response.success && Array.isArray(response.donations)) {
        console.log(`Found ${response.donations.length} donations`);
        setDonations(response.donations);
      } else {
        console.error('Invalid donations response format:', response);
        setDonations([]);
        if (!response || !response.success) {
          setError('Failed to load donations');
        }
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError('Failed to load donations');
      setDonations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#F59E0B" />;
      case 'scheduled':
        return <Calendar size={16} color="#3B82F6" />;
      case 'completed':
        return <Check size={16} color="#10B981" />;
      case 'cancelled':
        return <AlertTriangle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#F59E0B" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FEF3C7';
      case 'scheduled':
        return '#DBEAFE';
      case 'completed':
        return '#D1FAE5';
      case 'cancelled':
        return '#FEE2E2';
      default:
        return '#FEF3C7';
    }
  };

  const getDonationTypeIcon = (type: string) => {
    return type === 'clothes' ? 
      <ShoppingBag size={20} color="#BE3E28" /> : 
      <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16 }}>🧸</Text>
      </View>;
  };

  const getItemCount = (donation: DonationItem) => {
    if (donation.donationType === 'clothes' && donation.clothingItems) {
      return donation.clothingItems.reduce((total, item) => total + item.quantity, 0);
    } else if (donation.donationType === 'toys' && donation.toyItems) {
      return donation.toyItems.reduce((total, item) => total + item.quantity, 0);
    }
    return 0;
  };

  const getAllImages = (donation: DonationItem) => {
    let images: string[] = [];
    
    if (donation.donationType === 'clothes' && donation.clothingItems) {
      donation.clothingItems.forEach(item => {
        if (item.images && item.images.length > 0) {
          images = [...images, ...item.images];
        }
      });
    } else if (donation.donationType === 'toys' && donation.toyItems) {
      donation.toyItems.forEach(item => {
        if (item.images && item.images.length > 0) {
          images = [...images, ...item.images];
        }
      });
    }
    
    return images;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDeleteDonation = (donationId: string) => {
    setAlertTitle('Confirm Deletion');
    setAlertMessage('Are you sure you want to delete this donation?');
    setAlertVisible(true);
    
    // Set callback for confirmation
    setAlertCallback(async () => {
      setIsLoading(true);
      try {
        // Log the full URL for debugging
        console.log(`Attempting to delete donation with ID: ${donationId}`);
        
        const response = await api.delete(`/donation/${donationId}`);
        console.log('Delete response:', response);
        
        if (response && response.success) {
          // Remove the deleted donation from state
          setDonations(donations.filter(donation => donation._id !== donationId));
          setAlertTitle('Success');
          setAlertMessage('Donation has been deleted successfully.');
          setAlertCallback(undefined); // Clear the callback
          setAlertVisible(true);
        } else {
          throw new Error('Failed to delete donation');
        }
      } catch (error) {
        console.error('Error deleting donation:', error);
        setAlertTitle('Error');
        setAlertMessage('Failed to delete donation. Please try again.');
        setAlertCallback(undefined); // Clear the callback
        setAlertVisible(true);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const renderDonationItem = ({ item }: { item: DonationItem }) => {
    const itemCount = getItemCount(item);
    const allImages = getAllImages(item);
    
    return (
      <View style={styles.donationItem}>
        <View style={styles.donationHeader}>
          <View style={styles.headerTopRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              {getStatusIcon(item.status)}
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteDonation(item._id)}
              disabled={isLoading}
            >
              <Trash2 color="#BE3E28" size={16} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Compact Item Info Row */}
        <View style={styles.compactInfoRow}>
          {/* Donation Type */}
          <View style={styles.infoItem}>
            {getDonationTypeIcon(item.donationType)}
            <Text style={styles.infoText}>
              {item.donationType === 'clothes' ? 'Clothes' : 'Toys'}
            </Text>
          </View>
          
          {/* Item Count */}
          <View style={styles.infoItem}>
            <Package size={16} color="#2D5A27" />
            <Text style={styles.infoText}>
              {itemCount}
            </Text>
          </View>
          
          {/* Status */}
          <View style={styles.infoItem}>
            <Clock size={16} color="#2D5A27" />
            <Text style={styles.infoText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        {/* Image Preview - Only if images exist */}
        {allImages.length > 0 && (
          <Image 
            source={{ uri: allImages[0] }} 
            style={styles.previewImage} 
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D5A27" />
          <Text style={styles.loadingText}>Loading donations...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDonations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : donations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You don't have any donations yet.</Text>
        </View>
      ) : (
        <FlatList
          data={donations}
          renderItem={renderDonationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          pagingEnabled={true}
        />
      )}

      <CustomAlertMessage
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => {
          setAlertVisible(false);
          if (alertCallback) alertCallback();
        }}
        confirmText={alertCallback ? "Yes, Delete" : "OK"}
        showCancelButton={!!alertCallback}
        cancelText="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2D5A27',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  donationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 250,
  },
  donationHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    color: '#333',
  },
  deleteButton: {
    padding: 8,
  },
  compactInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 6,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 12,
  },
});

export default DonationCart;
