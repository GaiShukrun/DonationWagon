import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
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

  const handleSchedulePickupForAll = () => {
    // Check if there are any pending donations
    const pendingDonations = donations.filter(donation => donation.status === 'pending');
    
    if (pendingDonations.length === 0) {
      setAlertTitle('No Pending Donations');
      setAlertMessage('You don\'t have any pending donations to schedule for pickup.');
      setAlertVisible(true);
      return;
    }
    
    // Navigate to schedule pickup screen with all pending donation IDs
    const donationIds = pendingDonations.map(donation => donation._id).join(',');
    router.push({
      pathname: '/(tabs)/schedule',
      params: { donationIds }
    });
  };

  // Function to handle donation deletion
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
              <Trash2 color="#BE3E28" size={18} />
            </TouchableOpacity>
          </View>
          <View style={styles.donationTypeContainer}>
            {getDonationTypeIcon(item.donationType)}
            <Text style={styles.donationType}>
              {item.donationType === 'clothes' ? 'Clothing' : 'Toys'} Donation
            </Text>
          </View>
        </View>
        
        <View style={styles.donationContent}>
          <View style={styles.donationDetails}>
            <Text style={styles.donationDate}>
              Created on {formatDate(item.createdAt)}
            </Text>
            <Text style={styles.itemCount}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            
            {item.pickupDate && (
              <Text style={styles.pickupDate}>
                Pickup: {formatDate(item.pickupDate)}
              </Text>
            )}
          </View>
        </View>
        
        {/* Content Container - Images and Items Side by Side */}
        <View style={styles.contentContainer}>
          {/* Image Gallery */}
          {allImages.length > 0 && (
            <View style={styles.imageGalleryContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageGallery}
                contentContainerStyle={styles.imageGalleryContent}
              >
                {allImages.map((image, index) => (
                  <Image 
                    key={`${item._id}-image-${index}`}
                    source={{ uri: image }} 
                    style={styles.galleryImage} 
                  />
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Item Details */}
          <View style={styles.itemDetailsContainer}>
            {item.donationType === 'clothes' && item.clothingItems && (
              <>
                <Text style={styles.itemDetailsTitle}>Clothing Items:</Text>
                {item.clothingItems.map((clothingItem, index) => (
                  <View key={`clothing-${index}`} style={styles.itemDetail}>
                    <Text style={styles.itemDetailText}>
                      • {clothingItem.quantity}x {clothingItem.type}
                    </Text>
                  </View>
                ))}
              </>
            )}
            
            {item.donationType === 'toys' && item.toyItems && (
              <>
                <Text style={styles.itemDetailsTitle}>Toy Items:</Text>
                {item.toyItems.map((toyItem, index) => (
                  <View key={`toy-${index}`} style={styles.itemDetail}>
                    <Text style={styles.itemDetailText}>
                      • {toyItem.quantity}x {toyItem.name}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D5A27" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : donations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={48} color="#CCCCCC" />
          <Text style={styles.emptyText}>No donations yet</Text>
          <TouchableOpacity 
            style={styles.donateButton}
            onPress={() => router.push('/(tabs)/donate')}
          >
            <Text style={styles.donateButtonText}>Make a Donation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {donations.map((donation, index) => (
            <View key={donation._id} style={index < donations.length - 1 ? { marginBottom: 16 } : null}>
              {renderDonationItem({ item: donation })}
            </View>
          ))}
          
          {donations.some(donation => donation.status === 'pending') && (
            <TouchableOpacity 
              style={styles.scheduleAllButton}
              onPress={handleSchedulePickupForAll}
            >
              <Calendar size={18} color="white" />
              <Text style={styles.scheduleAllButtonText}>Schedule Pickup for All Pending Donations</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      
      {/* Custom Alert Message */}
      <CustomAlertMessage
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        onConfirm={() => {
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  donateButton: {
    backgroundColor: '#2D5A27',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  donateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  scheduleAllButton: {
    backgroundColor: '#2D5A27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  donationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
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
  donationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  donationType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
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
  donationContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  donationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  donationDate: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },
  itemCount: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  pickupDate: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '500',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  imageGalleryContainer: {
    flex: 1,
    marginRight: 16,
    maxWidth: '50%',
  },
  imageGallery: {
    marginBottom: 12,
  },
  imageGalleryContent: {
    paddingRight: 8,
  },
  galleryImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 8,
  },
  itemDetailsContainer: {
    flex: 1,
    marginBottom: 12,
    paddingTop: 0,
    borderTopWidth: 0,
    borderTopColor: '#F0F0F0',
  },
  itemDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2D5A27',
  },
  itemDetail: {
    marginBottom: 4,
  },
  itemDetailText: {
    fontSize: 15,
    color: '#666',
  },
  scheduleButton: {
    backgroundColor: '#2D5A27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  scheduleButtonText: {
    color: 'white',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  emptyCartContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DonationCart;
