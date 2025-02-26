// DonationScreen.js
import React , {useState} from 'react';
import { router } from 'expo-router';  
import { MaterialCommunityIcons } from '@expo/vector-icons';


import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
  
} from 'react-native';
import {GiftIcon, BabyIcon,ShirtIcon } from 'lucide-react-native';

const windowWidth = Dimensions.get('window').width;

const DonationScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          
        {/* <MaterialCommunityIcons name="horse-variant" size={24} color="black" /> */}

          {/* <TouchableOpacity style={styles.rewardsButton}>
            <Text style={styles.rewardsText}>300 Points</Text>
          </TouchableOpacity> */}
        </View>

        {/* Quick Donation Section */}
        <View style={styles.donationSection}>
        <Text style={styles.title}></Text>
        <Text style={styles.title}></Text>
          <Text style={styles.title}>Ready to Donate?</Text>
          
          {/* <Text style={styles.subtitle}>Choose a donation category</Text> */}

          {/* Donation Categories */}
          <View style={styles.categories}>
            <TouchableOpacity style={[styles.categoryCard, { backgroundColor: '#2D5A27' }]}>
              <View style={[styles.categoryIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <BabyIcon color="white" size={32} />
              </View>
              <Text style={[styles.categoryTitle, { color: 'white' }]}>Infant Toys</Text>
              <Text style={[styles.categoryDescription, { color: 'white' }]}>Educational toys, stuffed animals</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.categoryCard, { backgroundColor: '#BE3E28' }]}>
              <View style={[styles.categoryIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <ShirtIcon color="white" size={32} />
              </View>
              {/* <Text style={[styles.categoryTitle, { color: 'white' }]}>Earn Rewards</Text>
              <Text style={[styles.categoryDescription, { color: 'white' }]}>Points for every donation</Text> */}
              <Text style={[styles.categoryTitle, { color: 'white' }]}>Clothes</Text>
              <Text style={[styles.categoryDescription, { color: 'white' }]}>Shirts, pants, dresses</Text>
              
            </TouchableOpacity>
          </View>

          {/* Schedule Pickup Button */}
          <TouchableOpacity style={styles.scheduleButton}
          // onPress={handleSchedulePickup}>
          onPress={() => router.push("/(auth)/Sign-In")}>
            <Text style={styles.scheduleButtonText}> Schedule a Pickup  </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FCF2E9',

  },
  rewardsButton: {
    backgroundColor: '#BE3E28',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rewardsText: {
    color: 'white',
    fontWeight: '600',
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
  scheduleButton: {
    backgroundColor: '#BE3E28',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 12,
    color: '#666',
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
  
});

export default DonationScreen;