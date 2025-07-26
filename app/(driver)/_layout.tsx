import { Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Home, Package, User } from 'lucide-react-native';

interface User {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userType: 'donor' | 'driver';
}

export default function DriverLayout() {
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to sign in if not a driver
    const typedUser = user as User | null;
    if (!typedUser || typedUser.userType !== 'driver') {
      router.replace('/(auth)/Sign-In');
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="driver-dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="active-pickups"
        options={{
          title: 'My Pickups',
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}