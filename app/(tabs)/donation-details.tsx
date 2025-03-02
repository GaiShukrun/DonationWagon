import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Camera, ArrowLeft, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function DonationDetails() {
  const { isUserLoggedIn, requireAuth, user } = useAuth();
  const params = useLocalSearchParams();
  const donationType = params.type as string || 'clothes';
  
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Clothes specific state
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [clothingType, setClothingType] = useState('shirt');
  const [gender, setGender] = useState('any');
  
  // Toys specific state
  const [ageGroup, setAgeGroup] = useState('infant');
  const [condition, setCondition] = useState('new');

  useEffect(() => {
    // Check authentication when component mounts
    if (!isUserLoggedIn) {
      router.push({
        pathname: '/(auth)/Sign-In',
        params: { message: 'Please sign in to donate items' }
      });
    }
  }, [isUserLoggedIn]);
  
  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos of donation items.');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        setImages([...images, selectedImage]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload donation images.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...selectedImages].slice(0, 5)); // Limit to 5 images
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    if (!itemName) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image of your donation');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Here you would implement the actual API call to submit the donation
      // For now, we'll just simulate a successful submission
      
      setTimeout(() => {
        setIsLoading(false);
        
        Alert.alert(
          'Donation Submitted',
          'Thank you for your donation! You\'ve earned 50 points.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)')
            }
          ]
        );
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to submit donation. Please try again.');
    }
  };
  
  const goBack = () => {
    router.back();
  };

  if (!isUserLoggedIn) {
    return null; // Don't render anything if not logged in (will redirect)
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <ArrowLeft color="#2D5A27" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {donationType === 'clothes' ? 'Donate Clothes' : 'Donate Toys'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.content}>
            {/* Item Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Item Name*</Text>
              <TextInput
                style={styles.input}
                value={itemName}
                onChangeText={setItemName}
                placeholder="What are you donating?"
                placeholderTextColor="#999"
              />
            </View>
            
            {/* Item Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us more about your donation..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Type-specific fields */}
            {donationType === 'clothes' ? (
              <>
                {/* Clothes specific fields */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Clothing Type</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={clothingType}
                      onValueChange={(itemValue) => setClothingType(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Shirt" value="shirt" />
                      <Picker.Item label="Pants" value="pants" />
                      <Picker.Item label="Dress" value="dress" />
                      <Picker.Item label="Jacket" value="jacket" />
                      <Picker.Item label="Sweater" value="sweater" />
                      <Picker.Item label="Other" value="other" />
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={gender}
                      onValueChange={(itemValue) => setGender(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Any/Unisex" value="any" />
                      <Picker.Item label="Men" value="men" />
                      <Picker.Item label="Women" value="women" />
                      <Picker.Item label="Boys" value="boys" />
                      <Picker.Item label="Girls" value="girls" />
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Size</Text>
                  <TextInput
                    style={styles.input}
                    value={size}
                    onChangeText={setSize}
                    placeholder="e.g. M, L, XL, 10, 12..."
                    placeholderTextColor="#999"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Color</Text>
                  <TextInput
                    style={styles.input}
                    value={color}
                    onChangeText={setColor}
                    placeholder="e.g. Blue, Red, Green"
                    placeholderTextColor="#999"
                  />
                </View>
              </>
            ) : (
              <>
                {/* Toys specific fields */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Age Group</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={ageGroup}
                      onValueChange={(itemValue) => setAgeGroup(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Infant (0-1 years)" value="infant" />
                      <Picker.Item label="Toddler (1-3 years)" value="toddler" />
                      <Picker.Item label="Preschool (3-5 years)" value="preschool" />
                      <Picker.Item label="School Age (5-12 years)" value="school-age" />
                      <Picker.Item label="Teenagers (13+ years)" value="teenagers" />
                      <Picker.Item label="All Ages" value="all-ages" />
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Condition</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={condition}
                      onValueChange={(itemValue) => setCondition(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="New (in packaging)" value="new" />
                      <Picker.Item label="Like New" value="like-new" />
                      <Picker.Item label="Gently Used" value="gently-used" />
                      <Picker.Item label="Used (good condition)" value="used" />
                    </Picker>
                  </View>
                </View>
              </>
            )}
            
            {/* Image Upload */}
            <View style={styles.imagesSection}>
              <Text style={styles.label}>Photos of Item*</Text>
              <Text style={styles.helperText}>Add up to 5 photos of your item</Text>
              
              <View style={styles.imageRow}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <X color="white" size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {images.length < 5 && (
                  <View style={styles.addImageButtons}>
                    <TouchableOpacity 
                      style={styles.imageButton}
                      onPress={takePhoto}
                    >
                      <Camera color="#2D5A27" size={24} />
                      <Text style={styles.buttonText}>Take Photo</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.imageButton}
                      onPress={pickImage}
                    >
                      <Text style={styles.buttonText}>From Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Donation</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D0B3',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5A27',
  },
  content: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerWrapper: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  imagesSection: {
    marginVertical: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  imageButton: {
    backgroundColor: '#F0E5D8',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#2D5A27',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2D5A27',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
