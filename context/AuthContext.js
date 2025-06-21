import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { AuthRedirectMessage } from '@/components/AuthRedirectMessage';
import { useApi } from '@/hooks/useApi';
import { useApiUpload } from '@/hooks/useApiUpload';

// API base URL
const API_URL = 'http://10.0.0.10:3000'; // Updated to correct IP address

// Vlad
// const API_URL = 'http://10.0.0.41:3000';

// Create the Auth Context
export const AuthContext = createContext({
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
  const [redirectPath, setRedirectPath] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthMessage, setShowAuthMessage] = useState(false);
  const apiUpload = useApiUpload();
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
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setToken(storedToken);
          setIsUserLoggedIn(true);
          
          // Handle pending actions
          const pendingAction = await AsyncStorage.getItem('pendingAuthAction');
          if (pendingAction) {
            const action = JSON.parse(pendingAction);
            if (action.pathname && action.params) {
              setTimeout(() => {
                router.push({
                  pathname: action.pathname,
                  params: action.params
                });
                AsyncStorage.removeItem('pendingAuthAction');
              }, 500);
            }
          } else {
            // Redirect to appropriate dashboard based on userType
            setTimeout(() => {
              if (parsedUser.userType === 'driver') {
                router.replace('/driver-dashboard');
              } else {
                router.replace('/');
              }
            }, 500);
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
      const response = await api.post('/signup', userData);
      
      if (!response) {
        throw new Error(api.error || 'Failed to create account');
      }

      const { token, user } = response;
      
      // Store authentication data
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(token);
      setUser(user);
      setIsUserLoggedIn(true);
      
      // Redirect to appropriate dashboard based on userType
      setTimeout(() => {
        if (user.userType === 'driver') {
          router.replace('/driver-dashboard');
        } else {
          router.replace('/');
        }
      }, 500);
      
      return true;
    } catch (error) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      if (!credentials.username || !credentials.password) {
        throw new Error('Username and password are required');
      }

      const response = await api.post('/login', {
        username: credentials.username,
        password: credentials.password
      });

      if (!response) {
        throw new Error(api.error || 'Invalid credentials');
      }

      const { token, user } = response;
      
      // Store authentication data
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(token);
      setUser(user);
      setIsUserLoggedIn(true);
      
      // Handle pending actions
      const pendingAction = await AsyncStorage.getItem('pendingAuthAction');
      if (pendingAction) {
        const action = JSON.parse(pendingAction);
        if (action.pathname && action.params) {
          setTimeout(() => {
            router.push({
              pathname: action.pathname,
              params: action.params
            });
            AsyncStorage.removeItem('pendingAuthAction');
          }, 500);
        }
      } else {
        // Redirect to appropriate dashboard based on userType
        setTimeout(() => {
          if (user.userType === 'driver') {
            router.replace('/driver-dashboard');
          } else {
            router.replace('/');
          }
        }, 500);
      }
      
      return true;
    } catch (error) {
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
      // Make a copy of the current user to prevent state loss
      const currentUser = { ...user };
      
      if (!currentUser || !currentUser.id) {
        console.error('Cannot update profile image: User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Updating profile image for user:', currentUser.id);
      
      // If imageUri is null, clear the profile image
      if (imageUri === null) {
        console.log('Clearing profile image...');
        const response = await api.post('/update-profile-image', {
          userId: currentUser.id,
          clearImage: true
        });

        if (!response) {
          console.error('Failed to clear profile image:', api.error);
          return { success: false, error: api.error || 'Failed to clear profile image' };
        }

        // Update user in state and AsyncStorage only if we have a valid response
        if (response.user) {
          const updatedUser = response.user;
          console.log('Updating user state with:', updatedUser);
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          return { success: true, user: updatedUser };
        } else {
          console.error('Invalid response when clearing profile image:', response);
          return { success: false, error: 'Invalid server response' };
        }
      }

      // Upload the image file
      console.log('Uploading profile image...');
      const response = await apiUpload.uploadFile('/update-profile-image', imageUri, {
        userId: currentUser.id
      });

      if (!response || !response.success) {
        console.error('Failed to upload profile image:', apiUpload.error);
        return { success: false, error: apiUpload.error || 'Failed to upload profile image' };
      }

      // Update user in state and AsyncStorage only if we have a valid response
      if (response.user) {
        const updatedUser = response.user;
        console.log('Updating user state with:', updatedUser);
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        console.error('Invalid response when uploading profile image:', response);
        return { success: false, error: 'Invalid server response' };
      }
    } catch (error) {
      console.error('Error updating profile image via API:', error);
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
        requestPasswordReset,
        verifySecurityQuestion,
        signUp,
        updateProfileImage,
      }}
    >
      {children}
      {showAuthRedirect && (
        <AuthRedirectMessage
          message={authMessage}
          onClose={() => {
            setShowAuthRedirect(false);
            setAuthMessage('');
            setRedirectPath(null);
          }}
          onSignIn={() => {
            setShowAuthRedirect(false);
            setAuthMessage('');
            setRedirectPath(null);
            router.push('/Sign-In');
          }}
        />
      )}
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
