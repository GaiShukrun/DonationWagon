import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  StatusBar,

} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { AuthRedirectMessage } from '@/components/AuthRedirectMessage';
import { Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const windowWidth = Dimensions.get('window').width;

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectText, setRedirectText] = useState('Redirecting to home page...');
  const { login } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const backAction = () => {
      router.replace('/');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handleSignIn = async () => {
    if (!username || !password) {
      setErrorMessage('Please enter both username and password');
      setShowErrorMessage(true);
      return;
    }

    setIsLoading(true);

    try {
      await login({
        username,
        password
      });
      
      // Check if there's a pending action
      const pendingAction = await AsyncStorage.getItem('pendingAuthAction');
      if (pendingAction) {
        const action = JSON.parse(pendingAction);
        if (action.pathname) {
          setRedirectText(`Redirecting to ${action.pathname.includes('donation') ? 'donation page' : 'requested page'}...`);
        }
      }
      
      setShowSuccessMessage(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign in failed. Please try again.');
      setShowErrorMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLanding = () => {
    router.replace('/');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
       
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue donating</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              selectionColor="#BE3E28"
              color = "#222"
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={togglePasswordVisibility}
            >
              {showPassword ? 
                <EyeOff color="#666" size={20} /> : 
                <Eye color="#666" size={20} />
              }
            </TouchableOpacity>
          </View>
        </View>

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

        <TouchableOpacity 
          style={styles.registerLink}
          onPress={() => router.push("/(auth)/Sign-Up")}
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => router.push('/(auth)/ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <AuthRedirectMessage
        visible={showSuccessMessage}
        message="Sign in successful!"
        redirectPath="/"
        redirectText={redirectText}
        onClose={() => setShowSuccessMessage(false)}
      />

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
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 90,
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backButtonText: {
    fontSize: 16,
    color: '#2D5A27',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 5,
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
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    paddingRight: 50, // Make room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    height: 20,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#BE3E28',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  errorMessage: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxWidth: 400,
    flexDirection: 'column',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});