import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { View, LogBox, StatusBar } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import TopBar from '@/components/TopBar';

// Disable yellow box warnings
LogBox.ignoreAllLogs();

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  // Force hide status bar completely at app startup
  useEffect(() => {
    StatusBar.setHidden(true, 'none');
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('#00000000');
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Hide status bar globally with multiple methods to ensure it works
      StatusBar.setHidden(true, 'none');
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('#00000000');
    }
  }, [loaded]);

  // Disable error handling in global scope
  useEffect(() => {
    // Override the console.error to prevent error overlay
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out specific errors that trigger the overlay
      const errorMessage = args.join(' ');
      if (
        errorMessage.includes('Warning:') ||
        errorMessage.includes('React state update') ||
        errorMessage.includes('Cannot update a component') ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('Invalid credentials')
      ) {
        // Suppress these errors from the overlay
        return;
      }
      originalConsoleError(...args);
    };

    return () => {
      // Restore original console.error when component unmounts
      console.error = originalConsoleError;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? 'black' : '#FAF3F0', padding: 0 }}>
            <TopBar />
            <Stack 
              screenOptions={{
                headerShown: false,
                navigationBarHidden: true,
                contentStyle: { backgroundColor: '#FAF3F0' },
                statusBarHidden: true,
                statusBarStyle: 'light',
                statusBarTranslucent: true,
                statusBarAnimation: 'none',
                presentation: 'transparentModal',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }}/>
              <Stack.Screen name="+not-found" options={{ headerShown: false }}/>
            </Stack>
          </View>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}