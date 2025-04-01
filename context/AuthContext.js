import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { AuthRedirectMessage } from '@/components/AuthRedirectMessage';
import { useApi } from '@/hooks/useApi';

// API base URL
const API_URL = 'http://3.122.68.211:3000'; // Updated to correct IP address


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
      
      return true;
    } catch (error) {
      console.error('Error signing up:', error.message);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      // Check if credentials are provided
      if (!credentials.username || !credentials.password) {
        throw new Error('Username and password are required');
      }

      console.log('Attempting to login with username:', credentials.username);
      
      const response = await api.post('/login', {
        username: credentials.username,
        password: credentials.password
      });

      if (!response) {
        throw new Error(api.error || 'Invalid credentials');
      }

      console.log('Login successful');
      const { token, user } = response;
      
      // Store token and user data
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(token);
      setUser(user);
      setIsUserLoggedIn(true);
      
      // Check if there's a pending action after login
      const pendingAction = await AsyncStorage.getItem('pendingAuthAction');
      if (pendingAction) {
        const action = JSON.parse(pendingAction);
        if (action.pathname && action.params) {
          // Execute the pending action after a short delay
          setTimeout(() => {
            router.push({
              pathname: action.pathname,
              params: action.params
            });
            AsyncStorage.removeItem('pendingAuthAction');
          }, 500);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error logging in:', error.message);
      throw new Error(error.message || 'Invalid credentials');
    }
  };

  const logout = async () => {
    try {
      setIsSigningOut(true);
      
      setTimeout(async () => {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setIsUserLoggedIn(false);
        
        router.replace('/');
        
        setTimeout(() => {
          setIsSigningOut(false);
        }, 500);
      }, 2000);
    } catch (error) {
      console.error('Error logging out:', error);
      setIsSigningOut(false);
    }
  };

  // Request password reset function
  const requestPasswordReset = async (username) => {
    try {
      const response = await api.post('/request-password-reset', { username });
      
      if (!response) {
        throw new Error(api.error || 'User not found');
      }
      
      return response.securityQuestion;
    } catch (error) {
      console.error('Error requesting password reset:', error.message);
      throw new Error(error.message || 'User not found');
    }
  };

  // Verify security question answer
  const verifySecurityQuestion = async (username, answer) => {
    try {
      const response = await api.post('/verify-security-answer', { 
        username, 
        answer 
      });
      
      if (!response) {
        throw new Error(api.error || 'Incorrect security answer');
      }
      
      // Store the reset token temporarily
      await AsyncStorage.setItem('resetToken', response.resetToken);
      
      return true;
    } catch (error) {
      console.error('Error verifying security answer:', error.message);
      throw new Error(error.message || 'Incorrect security answer');
    }
  };

  // Reset password function
  const resetPassword = async (newPassword) => {
    try {
      const resetToken = await AsyncStorage.getItem('resetToken');
      
      if (!resetToken) {
        throw new Error('Reset token not found');
      }
      
      const response = await api.post('/reset-password', {
        resetToken,
        newPassword
      });
      
      if (!response) {
        throw new Error(api.error || 'Failed to reset password');
      }
      
      // Clear the reset token
      await AsyncStorage.removeItem('resetToken');
      
      return true;
    } catch (error) {
      console.error('Error resetting password:', error.message);
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  // Update profile image in backend and local storage
  const updateProfileImage = async (imageUri) => {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/update-profile-image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profileImage: imageUri
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile image');
      }

      // Update user in state and AsyncStorage
      const updatedUser = data.user;
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error updating profile image:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to check if user is authenticated and redirect if not
  const requireAuth = (callback, message = 'You need to sign in to access this feature', destination = null, params = null) => {
    if (!isUserLoggedIn) {
      // Prevent multiple redirects
      if (isRedirecting) {
        return false;
      }
      
      setIsRedirecting(true);
      
      // Show auth message
      setAuthMessage(message);
      setShowAuthMessage(true);
      
      // Store the callback information if provided
      if (destination) {
        const pendingAction = {
          pathname: destination,
          params: params || {}
        };
        AsyncStorage.setItem('pendingAuthAction', JSON.stringify(pendingAction));
      }
      
      // Use a single timeout for showing the message
      setTimeout(() => {
        // Use router.replace instead of router.push to avoid stacking screens
        router.replace('/(auth)/Sign-In');
        
        // Reset the redirection flag after a delay
        setTimeout(() => {
          setIsRedirecting(false);
          setShowAuthMessage(false);
        }, 500);
      }, 1000);
      
      return false;
    }
    
    // User is logged in, execute the callback
    if (callback && typeof callback === 'function') {
      callback();
    }
    return true;
  };

  // Hide the auth redirect message
  const handleAuthMessageClose = () => {
    setShowAuthMessage(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isUserLoggedIn,
        login,
        logout,
        requireAuth,
        signUp,
        requestPasswordReset,
        verifySecurityQuestion,
        updateProfileImage,
      }}
    >
      {children}
      <AuthRedirectMessage 
        visible={showAuthRedirect} 
        redirectPath={redirectPath}
        onClose={() => setShowAuthRedirect(false)}
      />
      <AuthRedirectMessage 
        visible={isSigningOut} 
        message="Signing out..." 
        redirectPath="/"
        onClose={() => setIsSigningOut(false)}
        redirectText="Redirecting to the landing page..."
      />
      <AuthRedirectMessage 
        visible={showAuthMessage} 
        message={authMessage} 
        onClose={handleAuthMessageClose}
      />
    </AuthContext.Provider>
  );
};
