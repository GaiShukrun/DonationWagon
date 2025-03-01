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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { AuthRedirectMessage } from '@/components/AuthRedirectMessage';
import { Eye, EyeOff } from 'lucide-react-native';

const windowWidth = Dimensions.get('window').width;

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Username, Step 2: Security Question, Step 3: New Password
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { requestPasswordReset, verifySecurityQuestion, resetPassword } = useAuth();

  const handleUsernameSubmit = async () => {
    if (!username) {
      setErrorMessage('Please enter your username');
      setShowErrorMessage(true);
      return;
    }

    setIsLoading(true);

    try {
      // Get the security question for this username
      const question = await requestPasswordReset(username);
      setSecurityQuestion(question);
      setStep(2); // Move to security question step
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to find account with that username. Please try again.');
      setShowErrorMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityAnswerSubmit = async () => {
    if (!securityAnswer) {
      setErrorMessage('Please enter your answer');
      setShowErrorMessage(true);
      return;
    }

    setIsLoading(true);

    try {
      // Verify the security answer
      await verifySecurityQuestion(username, securityAnswer);
      setStep(3); // Move to new password step
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Incorrect answer. Please try again.');
      setShowErrorMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword) {
      setErrorMessage('Please enter a new password');
      setShowErrorMessage(true);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setShowErrorMessage(true);
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setErrorMessage('Password must contain at least one special character');
      setShowErrorMessage(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setShowErrorMessage(true);
      return;
    }

    setIsLoading(true);

    try {
      // Reset the password
      await resetPassword(newPassword);
      setSuccessMessage('Your password has been reset successfully. You can now sign in with your new password.');
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to reset password. Please try again.');
      setShowErrorMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Forgot Password</Text>
        
        {step === 1 ? (
          <>
            <Text style={styles.subtitle}>Enter your username to reset your password</Text>

            {/* Input Field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity 
              style={styles.button}
              onPress={handleUsernameSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        ) : step === 2 ? (
          <>
            <Text style={styles.subtitle}>Answer your security question</Text>
            
            <View style={styles.securityQuestionContainer}>
              <Text style={styles.securityQuestion}>{securityQuestion}</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Your Answer"
                placeholderTextColor="#666"
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
              />
            </View>

            {/* Verify Button */}
            <TouchableOpacity 
              style={styles.button}
              onPress={handleSecurityAnswerSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Verify Answer</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Create a new password</Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="New Password"
                  placeholderTextColor="#666"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? 
                    <EyeOff color="#666" size={20} /> : 
                    <Eye color="#666" size={20} />
                  }
                </TouchableOpacity>
              </View>
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 
                    <EyeOff color="#666" size={20} /> : 
                    <Eye color="#666" size={20} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity 
              style={styles.button}
              onPress={handlePasswordReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Back to Sign In */}
        <TouchableOpacity 
          style={styles.backLink}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>

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

      {/* Success Message */}
      <AuthRedirectMessage
        visible={showSuccessMessage}
        message={successMessage}
        redirectPath="/(auth)/Sign-In"
        redirectText="Redirecting to Sign In..."
        onClose={() => setShowSuccessMessage(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingRight: 50, // Make room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
    height: 20,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#BE3E28',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  backText: {
    fontSize: 14,
    color: '#2D5A27',
    textDecorationLine: 'underline',
  },
  securityQuestionContainer: {
    marginBottom: 24,
  },
  securityQuestion: {
    fontSize: 18,
    color: '#2D5A27',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
  },
  errorMessage: {
    backgroundColor: '#FFC080',
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: '#BE3E28',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
  },
});
