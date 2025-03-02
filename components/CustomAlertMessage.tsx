import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, Animated, TouchableOpacity } from 'react-native';

interface CustomAlertMessageProps {
  visible: boolean;
  title: string;
  message: string;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  showCancelButton?: boolean;
  cancelText?: string;
}

const { width } = Dimensions.get('window');

export const CustomAlertMessage: React.FC<CustomAlertMessageProps> = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  showCancelButton = false,
  cancelText = 'Cancel',
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(visible);

  // Reset modal visibility when visible prop changes
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // When visible becomes false, animate out and close
      handleClose();
    }
  }, [visible]);

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

  const handleConfirm = () => {
    handleClose();
    if (onConfirm) onConfirm();
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
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {showCancelButton && (
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
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
  titleText: {
    fontSize: 18,
    color: '#2D5A27',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    color: '#2D5A27',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#BE3E28',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#8C8C8C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CustomAlertMessage;
