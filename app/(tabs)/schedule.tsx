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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, Clock, ChevronLeft, MapPin, Truck } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApi } from '@/hooks/useApi';
import { CustomAlertMessage } from '@/components/CustomAlertMessage';
import { useAuth } from '@/contexts/AuthContext';

const ScheduleScreen = () => {
  const router = useRouter();
  const api = useApi();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // State
  const [donationIds, setDonationIds] = useState<string[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState<(() => void) | undefined>(undefined);

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

  const handleSchedulePickup = async () => {
    if (isSubmitting) return;
    
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
      
      for (const donationId of donationIds) {
        const response = await api.post('/schedule-pickup', {
          donationId,
          pickupDate: selectedDate.toISOString(),
          userId: user?.id
        });
        
        results.push({
          donationId,
          success: !!response?.success,
          message: response?.message || 'Unknown error'
        });
      }
      
      // Check if all were successful
      const allSuccessful = results.every(result => result.success);
      
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#2D5A27" />
        </TouchableOpacity>
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
            <Text style={styles.summaryText}>
              You are scheduling pickup for {donationIds.length} donation{donationIds.length !== 1 ? 's' : ''}.
            </Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D5A27',
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
  summaryText: {
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#2D5A27',
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
});

export default ScheduleScreen;
