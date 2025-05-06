import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { View, LogBox } from 'react-native';
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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
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
          <View style={{ flex: 1, backgroundColor: 'black'}}>
            <StatusBar backgroundColor="black" style="light" />
            <TopBar />
            <Stack 
              screenOptions={{
                headerShown: false,
                navigationBarHidden: true,
                contentStyle: { backgroundColor: '#FAF3F0' }
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