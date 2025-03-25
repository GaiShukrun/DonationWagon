import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { BabyIcon, ShirtIcon } from 'lucide-react-native';

export default function DonateTab() {
  const { isUserLoggedIn } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleCategoryPress = (category: string) => {
    if (!isUserLoggedIn) {
      router.push({
        pathname: '/(auth)/Sign-In',
        params: { message: `Please sign in to donate ${category}` }
      });
      return;
    }
    
    router.push({
      pathname: '/(tabs)/donation-details',
      params: { type: category }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Add any data refresh logic here
    // For example, if you need to refresh categories or user data
    
    // Simulate a delay for demonstration purposes
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

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
          <Text style={styles.title}>What would you like to donate?</Text>
          <Text style={styles.subtitle}>Choose a donation category to begin</Text>
          
          <View style={styles.categories}>
            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: '#2D5A27' }]}
              onPress={() => handleCategoryPress('infant toys')}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <BabyIcon color="white" size={24} />
              </View>
              <Text style={[styles.categoryTitle, { color: 'white' }]}>Infant Toys</Text>
              <Text style={[styles.categoryDescription, { color: 'white' }]}>Educational toys, stuffed animals</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: '#BE3E28' }]}
              onPress={() => handleCategoryPress('infant clothes')}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <ShirtIcon color="white" size={24} />
              </View>
              <Text style={[styles.categoryTitle, { color: 'white' }]}>Infant Clothes</Text>
              <Text style={[styles.categoryDescription, { color: 'white' }]}>Shirts, pants, dresses</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>How Donation Works</Text>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Take Photos & Provide Details</Text>
                <Text style={styles.stepDescription}>
                  Take clear photos of your item and fill in details so we know what you're donating.
                </Text>
              </View>
            </View>
            
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Submit Your Donation</Text>
                <Text style={styles.stepDescription}>
                  Submit your donation information and our team will review it.
                </Text>
              </View>
            </View>
            
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Earn Points & Schedule Pickup</Text>
                <Text style={styles.stepDescription}>
                  Once approved, you'll earn points and can schedule a convenient pickup time.
                </Text>
              </View>
            </View>
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
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 0,

  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    flex: 1,
    margin: 10,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoContainer: {
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 20,
  },
  infoStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#2D5A27',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5A27',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
