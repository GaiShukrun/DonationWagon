import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { AuthRedirectMessage } from '@/components/AuthRedirectMessage';

const windowWidth = Dimensions.get('window').width;

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { login } = useAuth();

  const handleSignIn = async () => {
    if (!username || !password) {
      setErrorMessage('Please enter both username and password');
      setShowErrorMessage(true);
      return;
    }

    setIsLoading(true);

    try {
      // Call the login function with credentials
      await login({
        username,
        password
      });
      
      // Show success message and redirect
      setShowSuccessMessage(true);
      // Router.replace will be handled by the AuthRedirectMessage component
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign in failed. Please try again.');
      setShowErrorMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue donating</Text>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity 
          style={styles.registerLink}
          onPress={() => router.push("/(auth)/Sign-Up")}
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
          </Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => router.push('/(auth)/ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Success Message */}
      <AuthRedirectMessage
        visible={showSuccessMessage}
        message="Sign in successful!"
        redirectPath="/"
        redirectText="Redirecting to home page..."
        onClose={() => setShowSuccessMessage(false)}
      />

      {/* Error Message */}
      <View style={styles.errorContainer}>
        {showErrorMessage && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowErrorMessage(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: '#BE3E28',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginBottom: 20,
  },
  registerText: {
    fontSize: 16,
    color: '#666',
  },
  registerTextBold: {
    fontWeight: 'bold',
    color: '#2D5A27',
  },
  forgotPassword: {
    marginTop: 10,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#BE3E28',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    padding: 20,
  },
  errorMessage: {
    backgroundColor: '#FFC080',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#BE3E28',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});