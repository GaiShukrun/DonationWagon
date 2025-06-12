import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Trophy, Medal, Package, Truck } from 'lucide-react-native';
import useApi from '@/hooks/useApi';

type LeaderboardEntry = {
  rank: number;
  name: string;
  points: number;
  profileImage: string | null;
  userType: 'donor' | 'driver';
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const api = useApi();

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard');
      if (response.success) {
        setLeaderboard(response.leaderboard);
      } else {
        setError('Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#2D5A27'; // Default green
    }
  };

  const getUserTypeColor = (userType: string) => {
    return userType === 'donor' ? '#BE3E28' : '#2D5A27';
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        {item.rank <= 3 ? (
          <Trophy size={24} color={getRankColor(item.rank)} />
        ) : (
          <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
            #{item.rank}
          </Text>
        )}
      </View>
      
      <View style={styles.userInfo}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImageText}>
              {item.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
        )}
        <View style={styles.nameContainer}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={[styles.userTypeBadge, { backgroundColor: getUserTypeColor(item.userType) }]}>
            {item.userType === 'donor' ? (
              <Package size={12} color="white" />
            ) : (
              <Truck size={12} color="white" />
            )}
            <Text style={styles.userTypeText}>
              {item.userType === 'donor' ? 'Donor' : 'Driver'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.pointsContainer}>
        <Medal size={20} color="#2D5A27" />
        <Text style={styles.pointsText}>{item.points}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D5A27" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Contributors</Text>
      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.rank.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2D5A27']}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5A27',
    textAlign: 'center',
    marginVertical: 16,
  },
  listContent: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  nameContainer: {
    flex: 1,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileImageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5A27',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});

export default Leaderboard; 