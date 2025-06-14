import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Calendar, Clock, ChevronLeft, MapPin, Truck } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApi } from '@/hooks/useApi';
import { CustomAlertMessage } from '@/components/CustomAlertMessage';
import { useAuth } from '@/context/AuthContext';
import DonationCart from '@/components/DonationCart';
import * as Location from 'expo-location';

interface User {
  id: string;
}

const ScheduleScreen = () => {
  const router = useRouter();
  const api = useApi();
  const { user } = useAuth() as { user: User | null };
  console.log('User object:', user);
  const params = useLocalSearchParams();

  const [donationIds, setDonationIds] = useState<string[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced location state
  const [location, setLocation] = useState<{city?: string, street?: string, apartment?: string, coordinates?: {latitude: number, longitude: number}, gpsAddress?: string}>({});
  const [useGPS, setUseGPS] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState('');

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState<(() => void) | undefined>(undefined);

  // Fetch pending donations for the current user
  const fetchPendingDonations = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(`/donations/user/${user.id}`);
      if (response && response.success && Array.isArray(response.donations)) {
        // Filter for pending donations and get their IDs
        const pendingDonationIds = response.donations
          .filter(donation => donation.status === 'pending')
          .map(donation => donation._id);
        console.log('response@@@@', pendingDonationIds);


          

        
        setDonationIds(pendingDonationIds);
        if (pendingDonationIds.length >= 0) {
          fetchDonations(pendingDonationIds);
        }
      }
    } catch (error) {
      console.error('Error fetching pending donations:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to load pending donations. Please try again.');
      setAlertVisible(true);
    }
  };

  useEffect(() => {
    if (!user) {
      console.warn('User is not logged in or user object is null');
    } else {
      console.log('User is logged in:', user);
      // Fetch pending donations when user is available
      fetchPendingDonations();
    }
  }, [user]);

  useEffect(() => {
    // Get donationIds from URL params
    if (params && params.donationIds) {
      // Handle both single ID and comma-separated IDs
      const ids = params.donationIds.toString().split(',');
      setDonationIds(ids);
      
      // Fetch donation details for each ID
      fetchDonations(ids);
    }
  }, [params]);

  const fetchDonations = async (ids: string[]) => {
    setIsLoading(true);
    try {
      const fetchedDonations = [];
      
      for (const id of ids) {
        const response = await api.get(`/donation/${id}`);
        if (response && response.donation) {
          fetchedDonations.push(response.donation);
        }
      }
      
      setDonations(fetchedDonations);
      console.log('fetchedDonations@@@@', donations);
    } catch (error) {
      console.error('Error fetching donations:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to load donation details. Please try again.');
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    if (currentDate) {
      setSelectedDate(currentDate);
    }
  };

  const handleGPSLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertTitle('Permission Required');
        setAlertMessage('Please enable location services to use GPS.');
        setAlertVisible(true);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setUseGPS(true);
      setLocation(prev => ({...prev, coordinates: currentLocation.coords}));

      // Use expo-location's reverseGeocodeAsync to get address
      const geocode = await Location.reverseGeocodeAsync(currentLocation.coords);
      if (geocode.length > 0) {
        const { city, street, name } = geocode[0];
        const address = `${name}, ${street}, ${city}`;
        // Display address instead of filling input fields
        setLocation(prev => ({...prev, gpsAddress: address}));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setAlertTitle('Location Error');
      setAlertMessage('Failed to get current location. Please try again or enter manually.');
      setAlertVisible(true);
    }
  };

  const validateManualLocation = () => {
    if (!location.city || !location.street || !location.apartment) {
      setAlertTitle('Missing Information');
      setAlertMessage('Please fill in all required fields (city, street, apartment number) when entering location manually.');
      setAlertVisible(true);
      return false;
    }
    return true;
  };

  const handleSchedulePickup = async () => {
    if (isSubmitting) return;

    if (!useGPS && !validateManualLocation()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Validate date is in the future
      const now = new Date();
      if (selectedDate <= now) {
        setAlertTitle('Invalid Date');
        setAlertMessage('Please select a future date for pickup.');
        setAlertVisible(true);
        setIsSubmitting(false);
        return;
      }
      
      // Schedule pickup for all donations
      const results = [];
      console.log("@@@@@@",donationIds);
      for (const donationId of donationIds) {
        console.log('Scheduling pickup for donation:', donationId);
        const response = await api.post('/schedule-pickup', {
          donationId,
          pickupDate: selectedDate.toISOString(),
          userId: user?.id,
          location: useGPS ? 'GPS Location' : `${location.city}, ${location.street}, ${location.apartment}`,
          deliveryMessage,
        });
        console.log('Response:', response);
        
        results.push({
          donationId,
          success: !!response?.success,
          message: response?.message || 'Unknown error'
        });
      }
      
      // Check if all were successful
      const allSuccessful = results.every(result => result.success);
      console.log('All successful:', allSuccessful);
      console.log('Results handleSchedulePickup:', results); 
      
      if (allSuccessful) {
        setAlertTitle('Success!');
        setAlertMessage('Your donations have been scheduled for pickup. We will contact you soon to confirm the details.');
        setAlertCallback(() => () => router.push('/(tabs)/profile'));
        setAlertVisible(true);
      } else {
        // Some failed
        const failedCount = results.filter(result => !result.success).length;
        setAlertTitle('Partial Success');
        setAlertMessage(`${donationIds.length - failedCount} out of ${donationIds.length} donations were scheduled successfully. Please try again for the failed ones.`);
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to schedule pickup. Please try again.');
      setAlertVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh donation data
    if (donationIds.length > 0) {
      await fetchDonations(donationIds);
    }
    setRefreshing(false);
  };

  // Add focus effect to fetch donations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Schedule screen focused, fetching pending donations...');
      fetchPendingDonations();
    }, [user])
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Schedule Pickup</Text>
          <View style={{ width: 24 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2D5A27" />
            <Text style={styles.loadingText}>Loading donation details...</Text>
          </View>
        ) : (
          <>
            {/* Donation Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>Donation Summary</Text>
              {user && user.id ? (
                <View style={styles.donationCartContainer}>
                  <DonationCart userId={user.id} />
                </View>
              ) : (
                <Text style={styles.errorText}>Unable to load user information</Text>
              )}
            </View>

            {/* Date Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Select Pickup Date</Text>
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#2D5A27" />
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Location Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Pickup Location</Text>
              <View style={styles.locationButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.locationButton, useGPS && styles.activeButton]}
                  onPress={handleGPSLocation}
                >
                  <MapPin size={20} color={useGPS ? '#fff' : '#2D5A27'} />
                  <Text style={[styles.buttonText, useGPS && styles.activeButtonText]}>Use GPS Location</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.locationButton, !useGPS && styles.activeButton]}
                  onPress={() => setUseGPS(false)}
                >
                  <Text style={[styles.buttonText, !useGPS && styles.activeButtonText]}>Enter Manually</Text>
                </TouchableOpacity>
              </View>

              {!useGPS && (
                <View style={styles.manualInputContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter city"
                      value={location.city}
                      onChangeText={(text: string) => setLocation(prev => ({...prev, city: text}))}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Street <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter street"
                      value={location.street}
                      onChangeText={(text: string) => setLocation(prev => ({...prev, street: text}))}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Apartment Number <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter apartment number"
                      value={location.apartment}
                      onChangeText={(text: string) => setLocation(prev => ({...prev, apartment: text}))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {useGPS && location.gpsAddress && (
                <View style={styles.addressDisplay}>
                  <Text style={styles.addressText}>Address: {location.gpsAddress}</Text>
                </View>
              )}
            </View>

            {/* Delivery Message */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Delivery Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter special instructions for the delivery person"
                value={deliveryMessage}
                onChangeText={setDeliveryMessage}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Pickup Instructions */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Pickup Instructions</Text>
              <View style={styles.instructionItem}>
                <Clock size={20} color="#2D5A27" />
                <Text style={styles.instructionText}>
                  Our pickup team will arrive between 9:00 AM and 5:00 PM on the scheduled date.
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <MapPin size={20} color="#2D5A27" />
                <Text style={styles.instructionText}>
                  Please ensure someone is available to hand over the donations at your registered address.
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Truck size={20} color="#2D5A27" />
                <Text style={styles.instructionText}>
                  Have your donations packed and ready for pickup.
                </Text>
              </View>
            </View>

            {/* Schedule Button */}
            <TouchableOpacity 
              style={[
                styles.scheduleButton,
                isSubmitting && styles.disabledButton
              ]}
              onPress={handleSchedulePickup}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.scheduleButtonText}>Confirm Pickup Schedule</Text>
              )}
            </TouchableOpacity>
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
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FCF2E9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D5A27',
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5A27',
    marginBottom: 12,
  },
  sectionContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F4F0',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  scheduleButton: {
    backgroundColor: '#65a765',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#A0AFA0',
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  locationButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeButton: {
    backgroundColor: '#e8f5e9',
  },
  activeButtonText: {
    color: '#2D5A27',
  },
  buttonText: {
    marginLeft: 10,
    color: '#2D5A27',
    fontWeight: '500',
  },
  manualInputContainer: {
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: '#2D5A27',
    fontWeight: '500',
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addressDisplay: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  addressText: {
    color: '#2D5A27',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 10,
  },
  donationCartContainer: {
    height: 300,
    overflow: 'hidden',
  },
});

export default ScheduleScreen;
