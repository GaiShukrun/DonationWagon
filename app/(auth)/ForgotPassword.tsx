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

const windowWidth = Dimensions.get('window').width;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: Security Question
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { requestPasswordReset, verifySecurityQuestion } = useAuth();

  const handleEmailSubmit = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      setShowErrorMessage(true);
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      setShowErrorMessage(true);
      return;
    }

    setIsLoading(true);

    try {
      // Get the security question for this email
      await requestPasswordReset(email);
      
      // Hardcode a security question for now
      // In a real app, this would come from your backend
      setSecurityQuestion("What was your first pet's name?");
      setStep(2); // Move to security question step
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to find account with that email. Please try again.');
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
      await verifySecurityQuestion(email, securityAnswer);
      setSuccessMessage(`We've sent password reset instructions to ${email}. Please check your inbox.`);
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Incorrect answer. Please try again.');
      setShowErrorMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Forgot Password</Text>
        
        {step === 1 ? (
          <>
            <Text style={styles.subtitle}>Enter your email to reset your password</Text>

            {/* Input Field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity 
              style={styles.button}
              onPress={handleEmailSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
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

            {/* Reset Button */}
            <TouchableOpacity 
              style={styles.button}
              onPress={handleSecurityAnswerSubmit}
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
