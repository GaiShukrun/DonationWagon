import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { AuthRedirectMessage } from '@/components/AuthRedirectMessage';
import { useApi } from '@/hooks/useApi';

// Create the Auth Context
const AuthContext = createContext({
  user: null,
  isUserLoggedIn: false,
  login: async (userData) => {},
  logout: async () => {},
  requireAuth: (callback, message) => false,
  requestPasswordReset: async (username) => {},
  verifySecurityQuestion: async (username, answer) => {},
  signUp: async (userData) => {},
  updateProfileImage: async (imageUri) => {},
});

// Custom hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [showAuthRedirect, setShowAuthRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/(auth)/Sign-In');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthMessage, setShowAuthMessage] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [token, setToken] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState(null);
  
  // Use our custom API hook
  const api = useApi();

  // Check for existing user on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        if (userData && storedToken) {
          setUser(JSON.parse(userData));
          setToken(storedToken);
          setIsUserLoggedIn(true);
          
          // Check if there's a pending action after login
          const pendingAction = await AsyncStorage.getItem('pendingAuthAction');
          if (pendingAction) {
            const action = JSON.parse(pendingAction);
            if (action.pathname && action.params) {
              // Execute the pending action
              setTimeout(() => {
                router.push({
                  pathname: action.pathname,
                  params: action.params
                });
                AsyncStorage.removeItem('pendingAuthAction');
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Sign up function
  const signUp = async (userData) => {
    try {
      const response = await api.post('/signup', {
        username: userData.username,
        password: userData.password,
        firstname: userData.firstname,
        lastname: userData.lastname,
        securityQuestion: userData.securityQuestion,
        securityAnswer: userData.securityAnswer
      });

      if (!response) {
        throw new Error('Failed to sign up');
      }

      const { token, user } = response;
      
      // Store token and user data
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(token);
      setUser(user);
      setIsUserLoggedIn(true);
      
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to sign up'
      };
    }
  };

  // Login function
  const login = async (userData) => {
    try {
      const response = await api.post('/login', {
        username: userData.username,
        password: userData.password
      });

      if (!response) {
        throw new Error('Failed to login');
      }

      const { token, user } = response;
      
      // Store token and user data
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(token);
      setUser(user);
      setIsUserLoggedIn(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to login'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsSigningOut(true);
      
      // Clear stored data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Update state
      setToken(null);
      setUser(null);
      setIsUserLoggedIn(false);
      
      // Navigate to sign in
      router.replace('/(auth)/Sign-In');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to logout'
      };
    } finally {
      setIsSigningOut(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (username) => {
    try {
      const response = await api.post('/request-reset', { username });
      
      if (!response) {
        throw new Error('Failed to request password reset');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to request password reset'
      };
    }
  };

  // Verify security question
  const verifySecurityQuestion = async (username, answer) => {
    try {
      const response = await api.post('/verify-security-question', { 
        username, 
        answer 
      });
      
      if (!response) {
        throw new Error('Failed to verify security question');
      }
      
      return { 
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Security question verification error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to verify security question'
      };
    }
  };

  // Update profile image
  const updateProfileImage = async (imageUri) => {
    if (!user || !user.id) {
      return { success: false, error: 'User not logged in' };
    }

    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
      });
      formData.append('userId', user.id);

      // Make API request
      const response = await api.post('/update-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to update profile image');
      }

      // Update user in state and storage with new image URL
      const updatedUser = { ...user, profileImage: response.imageUrl };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, imageUrl: response.imageUrl };
    } catch (error) {
      console.error('Profile image update error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile image',
      };
    }
  };

  // Function to require authentication
  const requireAuth = (callback, message = 'Please sign in to continue') => {
    if (isUserLoggedIn) {
      // User is logged in, proceed with callback
      if (typeof callback === 'function') {
        return callback();
      }
      return true;
    } else {
      // User is not logged in, show auth message and redirect
      setAuthMessage(message);
      setShowAuthMessage(true);
      
      // Store the callback for after login if it's a navigation action
      if (callback && typeof callback === 'object' && callback.pathname) {
        AsyncStorage.setItem('pendingAuthAction', JSON.stringify(callback));
      }
      
      // Prevent multiple redirects
      if (!isRedirecting) {
        setIsRedirecting(true);
        setTimeout(() => {
          router.push('/(auth)/Sign-In');
          setIsRedirecting(false);
        }, 1500);
      }
      
      return false;
    }
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        isUserLoggedIn,
        login,
        logout,
        requireAuth,
        requestPasswordReset,
        verifySecurityQuestion,
        signUp,
        updateProfileImage,
      }}
    >
      {children}
      
      {/* Auth redirect message component */}
      {showAuthMessage && (
        <AuthRedirectMessage
          message={authMessage}
          onClose={() => setShowAuthMessage(false)}
        />
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
