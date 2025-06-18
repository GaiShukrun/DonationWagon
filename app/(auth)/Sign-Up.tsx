import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { AuthRedirectMessage } from '@/components/AuthRedirectMessage';
import { Eye, EyeOff } from 'lucide-react-native';

const windowWidth = Dimensions.get('window').width;

// Security question options
const securityQuestions = [
  "What was your first pet's name?",
  "What was the name of your first school?",
  "What was the make of your first car?",
  "What is your mother's maiden name?",
  "In what city were you born?",
  "What was your childhood nickname?",
];

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  firstname: string;
  lastname: string;
  securityQuestion: string;
  securityAnswer: string;
  userType: 'donor' | 'driver';
}

const SignUp = () => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    securityQuestion: securityQuestions[0],
    securityAnswer: '',
    userType: 'donor'
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    } else if (!/^[a-zA-Z]/.test(formData.username)) {
      newErrors.username = 'Username must begin with a letter';
    }
  
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstname.trim()) {
      newErrors.firstname = 'First name is required';
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Last name is required';
    }

    if (!formData.securityAnswer.trim()) {
      newErrors.securityAnswer = 'Security answer is required';
    }

    if (!formData.userType) {
      newErrors.userType = 'Please select a user type' as any;
    }
   
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        username: formData.username,
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
        userType: formData.userType
      });
      
      setShowSuccessMessage(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create account');
      setShowErrorMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSecurityQuestion = (question: string) => {
    setFormData({ ...formData, securityQuestion: question });
    setShowQuestionPicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start donating or driving</Text>

          <View style={styles.inputContainer}>
            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.sectionTitle}>I want to:</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    formData.userType === 'donor' && styles.userTypeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, userType: 'donor' })}
                >
                  <Text style={[
                    styles.userTypeButtonText,
                    formData.userType === 'donor' && styles.userTypeButtonTextActive
                  ]}>Donate Items</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    formData.userType === 'driver' && styles.userTypeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, userType: 'driver' })}
                >
                  <Text style={[
                    styles.userTypeButtonText,
                    formData.userType === 'driver' && styles.userTypeButtonTextActive
                  ]}>Pick Up Donations</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#666"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              autoCapitalize="none"
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <EyeOff color="#666" size={20} /> : 
                  <Eye color="#666" size={20} />
                }
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#666"
                secureTextEntry={!showConfirmPassword}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
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
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#666"
              value={formData.firstname}
              onChangeText={(text) => setFormData({ ...formData, firstname: text })}
            />
            {errors.firstname && <Text style={styles.errorText}>{errors.firstname}</Text>}

            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#666"
              value={formData.lastname}
              onChangeText={(text) => setFormData({ ...formData, lastname: text })}
            />
            {errors.lastname && <Text style={styles.errorText}>{errors.lastname}</Text>}

            {/* Security Question Section */}
            <Text style={styles.sectionTitle}>Security Question</Text>
            <Text style={styles.sectionSubtitle}>This will help you recover your password</Text>
            
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowQuestionPicker(true)}
            >
              <Text style={styles.dropdownButtonText}>{formData.securityQuestion}</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Your Answer"
              placeholderTextColor="#666"
              value={formData.securityAnswer}
              onChangeText={(text) => setFormData({ ...formData, securityAnswer: text })}
            />
            {errors.securityAnswer && <Text style={styles.errorText}>{errors.securityAnswer}</Text>}
          </View>

          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.push("/(auth)/Sign-In")}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Security Question Picker Modal */}
      <Modal
        visible={showQuestionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuestionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Security Question</Text>
            
            <FlatList
              data={securityQuestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.questionItem}
                  onPress={() => selectSecurityQuestion(item)}
                >
                  <Text style={styles.questionItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowQuestionPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Message */}
      <AuthRedirectMessage
        visible={showSuccessMessage}
        message="Account created successfully!"
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 0,

  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
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
    marginBottom: 30,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
    marginBottom: 12,
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
  errorText: {
    color: '#BE3E28',
    marginBottom: 10,
    marginTop: -5,
    fontSize: 14,
  },
  signUpButton: {
    backgroundColor: '#BE3E28',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginTextBold: {
    fontWeight: 'bold',
    color: '#2D5A27',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginTop: 15,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionItem: {
    paddingVertical: 15,
  },
  questionItemText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  errorMessage: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  closeButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  userTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A90E2',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#4A90E2',
  },
  userTypeButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  userTypeButtonTextActive: {
    color: '#fff',
  },
});

export default SignUp;