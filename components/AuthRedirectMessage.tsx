import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

interface AuthRedirectMessageProps {
  visible: boolean;
  message?: string;
  redirectPath?: string;
  onClose?: () => void;
  redirectText?: string;
}

const { width, height } = Dimensions.get('window');

export const AuthRedirectMessage: React.FC<AuthRedirectMessageProps> = ({
  visible,
  message = 'You need to sign in to access this feature',
  redirectPath = '/(auth)/Sign-In',
  onClose,
  redirectText = 'Redirecting to sign in...',
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(visible);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRedirected = useRef(false);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // Ensure modal is closed when component unmounts
      setModalVisible(false);
      if (onClose) onClose();
      // Reset the redirection flag when component unmounts
      hasRedirected.current = false;
    };
  }, []);

  // Reset modal visibility when visible prop changes
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Only auto redirect if redirectText is provided and hasn't redirected yet
      if (redirectText && !hasRedirected.current) {
        hasRedirected.current = true; // Set flag to prevent multiple redirects
        timerRef.current = setTimeout(() => {
          handleClose();
          if (redirectPath) {
            // Use replace instead of push to avoid stacking screens
            router.replace(redirectPath);
          }
        }, 1500);

        return () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        };
      }
    } else {
      // When visible becomes false, animate out and close
      handleClose();
      // Reset the redirection flag when modal is closed
      hasRedirected.current = false;
    }
  }, [visible, redirectPath, redirectText]);

  const handleClose = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      if (onClose) onClose();
    });
  };

  const handleCloseAndRedirect = () => {
    handleClose();
    if (redirectPath && redirectText && !hasRedirected.current) {
      hasRedirected.current = true;
      // Use replace instead of push to avoid stacking screens
      router.replace(redirectPath);
    }
  };

  if (!modalVisible) return null;

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
          {redirectText ? (
            <Text style={styles.redirectingText}>{redirectText}</Text>
          ) : (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    backgroundColor: '#FCF2E9',
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#BE3E28',
  },
  messageText: {
    fontSize: 18,
    color: '#2D5A27',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  redirectingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#BE3E28',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
