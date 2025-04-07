import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView 
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { BabyIcon, ShirtIcon } from 'lucide-react-native';

export default function Donate() {
  const { isUserLoggedIn, requireAuth } = useAuth();
  const params = useLocalSearchParams();
  const fromNav = params.fromNav === 'true';

  useEffect(() => {
    // Check authentication when component mounts
    if (!isUserLoggedIn) {
      router.push('/(auth)/Sign-In');
      return;
    }

    // If coming from navbar click, redirect directly to donation-details
    if (fromNav) {
      router.replace('/(tabs)/donation-details');
    }
  }, [isUserLoggedIn, fromNav]);

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

  if (!isUserLoggedIn) {
    return null; // Don't render anything if not logged in (will redirect)
  }

  return (
    <SafeAreaView style={styles.container}>  
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>What would you like to donate?</Text>
          <Text style={styles.subtitle}>Choose a donation category to begin</Text>
          
          <View style={styles.categories}>
            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: '#2D5A27' }]}
              onPress={() => handleCategoryPress('toys')}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: '#2D5A27' }]}>
                <BabyIcon color="white" size={40
                } />
              </View>
              <Text style={[styles.categoryTitle, { color: 'white' }]}>Infant Toys</Text>
              <Text style={[styles.categoryDescription, { color: 'white' }]}>Educational toys, stuffed animals</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: '#BE3E28' }]}
              onPress={() => handleCategoryPress('clothes')}
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    width: '100%',
  },
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D5A27',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
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