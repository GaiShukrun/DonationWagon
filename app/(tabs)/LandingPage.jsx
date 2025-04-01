import React, { useState } from 'react';
import { router } from 'expo-router';  
import { useAuth } from '@/context/AuthContext';

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { GiftIcon, BabyIcon, ShirtIcon, LogOutIcon, CalendarIcon } from 'lucide-react-native';

const windowWidth = Dimensions.get('window').width;

const DonationScreen = () => {
  const { requireAuth, isUserLoggedIn, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleCategoryPress = (category) => {
    if (category === 'Clothing') {
      requireAuth(
        () => {
          // Navigate to the donation flow with the selected category
          console.log(`Selected category: ${category}`);
          router.push({
            pathname: '/(tabs)/donation-details',
            params: { type: 'clothes' }
          });
        },
        `Please sign in to donate ${category.toLowerCase()}`,
        '/(tabs)/donation-details',
        { type: 'clothes' }
      );
    } else if (category === 'Infant Toys') {
      requireAuth(
        () => {
          // Navigate to the donation flow with the selected category
          console.log(`Selected category: ${category}`);
          router.push({
            pathname: '/(tabs)/donation-details',
            params: { type: 'toys' }
          });
        },
        `Please sign in to donate ${category.toLowerCase()}`,
        '/(tabs)/donation-details',
        { type: 'toys' }
      );
    }
  };

  const handleRewardsPress = () => {
    requireAuth(
      () => {
        // Navigate to rewards page
        console.log('Navigate to rewards page');
      },
      'Sign in to view and manage your rewards'
    );
  };

  const handleSignOut = () => {
    logout();
  };

  const handleSchedulePickup = () => {
    requireAuth(
      () => {
        // Navigate to schedule pickup page
        console.log('Navigate to schedule pickup page');
        router.push('/(tabs)/schedule');
      },
      'Please sign in to schedule a pickup',
      '/(tabs)/schedule'
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Add any data refresh logic here
    // For example, if you need to refresh user data or donation categories
    
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
        {/* Main Content */}
        <View style={styles.content}>
          {/* Header - removed */}
          <View style={styles.header}>
          </View>

          {/* Quick Donation Section */}
          <View style={styles.donationSection}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Ready to Donate?</Text>
              {/* {isUserLoggedIn && (
                <TouchableOpacity 
                  style={styles.signOutButton}
                  onPress={handleSignOut}
                >
                  <LogOutIcon color="white" size={16} style={styles.signOutIcon} />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              )} */}
            </View>
            <Text style={styles.subtitle}>Choose a donation category</Text>

            {/* Donation Categories */}
            <View style={styles.categories}>
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: '#2D5A27' }]}
                onPress={() => handleCategoryPress('Infant Toys')}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <BabyIcon color="white" size={32} />
                </View>
                <Text style={[styles.categoryTitle, { color: 'white' }]}>Infant Toys</Text>
                <Text style={[styles.categoryDescription, { color: 'white' }]}>Educational toys, stuffed animals</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: '#BE3E28' }]}
                onPress={() => handleCategoryPress('Clothing')}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <ShirtIcon color="white" size={32} />
                </View>
                <Text style={[styles.categoryTitle, { color: 'white' }]}>Clothes</Text>
                <Text style={[styles.categoryDescription, { color: 'white' }]}>Shirts, pants, dresses</Text>
              </TouchableOpacity>
            </View>

            {/* Schedule Pickup Button - now as a category card */}
            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: '#F5A623', width: '100%', marginBottom: 24 }]}
              onPress={handleSchedulePickup}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <CalendarIcon color="white" size={32} />
              </View>
              <Text style={[styles.categoryTitle, { color: 'white' }]}>Schedule a Pickup</Text>
              <Text style={[styles.categoryDescription, { color: 'white' }]}>Request a convenient pickup time</Text>
            </TouchableOpacity>

            {/* Leaderboard Section */}
            <View style={styles.leaderboardContainer}>
              <View style={styles.leaderboardHeader}>
                <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {/* Leaderboard Rankings */}
              <View style={styles.leaderboardList}>
                {/* First Place */}
                <View style={[styles.leaderboardItem, styles.firstPlace]}>
                  <Text style={styles.rankNumber}>1</Text>
                  <View style={[styles.userAvatar, styles.firstPlaceAvatar]}>
                    <Text style={styles.avatarText}>👑</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>John Smith</Text>
                    <View style={styles.pointsContainer}>
                      <GiftIcon color="#BE3E28" size={14} />
                      <Text style={styles.points}>2,540 points</Text>
                    </View>
                  </View>
                </View>

                {/* Second Place */}
                <View style={[styles.leaderboardItem, styles.secondPlace]}>
                  <Text style={styles.rankNumber}>2</Text>
                  <View style={[styles.userAvatar, styles.secondPlaceAvatar]}>
                    <Text style={styles.avatarText}>🥈</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>Sarah Jones</Text>
                    <View style={styles.pointsContainer}>
                      <GiftIcon color="#BE3E28" size={14} />
                      <Text style={styles.points}>1,820 points</Text>
                    </View>
                  </View>
                </View>

                {/* Third Place */}
                <View style={[styles.leaderboardItem, styles.thirdPlace]}>
                  <Text style={styles.rankNumber}>3</Text>
                  <View style={[styles.userAvatar, styles.thirdPlaceAvatar]}>
                    <Text style={styles.avatarText}>🥉</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>Mike Brown</Text>
                    <View style={styles.pointsContainer}>
                      <GiftIcon color="#BE3E28" size={14} />
                      <Text style={styles.points}>1,245 points</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>50+</Text>
                <Text style={styles.statLabel}>Items Donated</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>300</Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Pickups</Text>
              </View>
            </View>

            {/* How Donation Works Section */}
            <View style={styles.howItWorksContainer}>
              <Text style={styles.howItWorksTitle}>How Donation Works</Text>
              
              <View style={styles.stepContainer}>
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
              
              <View style={styles.stepContainer}>
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
              
              <View style={styles.stepContainer}>
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

            {/* Mission Statement Section - Added as requested */}
            <View style={styles.missionContainer}>
              <Text style={styles.missionTitle}>Donate Your Used Clothes Today</Text>
              <Text style={styles.missionText}>
                Welcome to Donation Wagon, where you can donate your used clothes and receive points and prizes in return. 
                Our mission is to create a sustainable future by giving your pre-loved items a new life.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
  },
 
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FCF2E9',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signOutButton: {
    backgroundColor: '#BE3E28',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  signOutIcon: {
    marginRight: 4,
  },
  donationSection: {
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
  },
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    width: windowWidth * 0.44,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: windowWidth * 0.28,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  leaderboardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5A27',
  },
  viewAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FCF2E9',
    borderRadius: 20,
  },
  viewAllText: {
    color: '#BE3E28',
    fontSize: 14,
    fontWeight: '600',
  },
  leaderboardList: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FCF2E9',
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  firstPlace: {
    borderLeftColor: '#FFD700',
  },
  secondPlace: {
    borderLeftColor: '#C0C0C0',
  },
  thirdPlace: {
    borderLeftColor: '#CD7F32',
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5A27',
    width: 30,
  },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  firstPlaceAvatar: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFDE7',
  },
  secondPlaceAvatar: {
    borderColor: '#C0C0C0',
    backgroundColor: '#F5F5F5',
  },
  thirdPlaceAvatar: {
    borderColor: '#CD7F32',
    backgroundColor: '#FFF3E0',
  },
  avatarText: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5A27',
    marginBottom: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  points: {
    color: '#BE3E28',
    fontSize: 14,
    fontWeight: '500',
  },
  missionContainer: {
    backgroundColor: '#FCF2E9',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8D0B3',
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 10,
    textAlign: 'center',
  },
  missionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'center',
  },
  howItWorksContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5A27',
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
  },
  scrollView: {
    flex: 1,
  },
});

export default DonationScreen;