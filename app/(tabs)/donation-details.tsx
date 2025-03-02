import React, { useState, useEffect, useContext } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, X, Plus, Minus } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';

export default function DonationDetails() {
  const { isUserLoggedIn, requireAuth, user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const api = useApi();
  const donationType = params.type as string || 'clothes';

  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [clothingItems, setClothingItems] = useState([
    {
      id: 1,
      type: '',
      size: '',
      color: '',
      gender: '',
      quantity: 1,
      images: [] as string[],
    },
  ]);

  const [toyName, setToyName] = useState('');
  const [toyDescription, setToyDescription] = useState('');
  const [toyAgeGroup, setToyAgeGroup] = useState('');
  const [toyCondition, setToyCondition] = useState('');

  useEffect(() => {
    if (!isUserLoggedIn) {
      router.push({
        pathname: '/(auth)/Sign-In',
        params: { message: 'Please sign in to donate items' },
      });
    }
  }, [isUserLoggedIn]);

  const pickImage = async (itemId?: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (itemId) {
        // Add image to specific clothing item
        setClothingItems(clothingItems.map(item => 
          item.id === itemId 
            ? { ...item, images: [...item.images, result.assets[0].uri] } 
            : item
        ));
      } else {
        // For toys, add to general images
        setImages([...images, result.assets[0].uri]);
      }
    }
  };

  const takePhoto = async (itemId?: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (itemId) {
        // Add image to specific clothing item
        setClothingItems(clothingItems.map(item => 
          item.id === itemId 
            ? { ...item, images: [...item.images, result.assets[0].uri] } 
            : item
        ));
      } else {
        // For toys, add to general images
        setImages([...images, result.assets[0].uri]);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removeItemImage = (itemId: number, imageIndex: number) => {
    setClothingItems(clothingItems.map(item => {
      if (item.id === itemId) {
        const newImages = [...item.images];
        newImages.splice(imageIndex, 1);
        return { ...item, images: newImages };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const formData = new FormData();

      formData.append('donationType', donationType);

      if (donationType === 'clothes') {
        // Convert clothing items to a format that includes image URIs
        const itemsWithImagePaths = clothingItems.map(item => ({
          id: item.id,
          type: item.type,
          size: item.size,
          color: item.color,
          gender: item.gender,
          quantity: item.quantity,
          imagePaths: item.images.map((_, index) => `item_${item.id}_image_${index}.jpg`)
        }));
        
        formData.append('clothingItems', JSON.stringify(itemsWithImagePaths));
        
        // Add all clothing item images to formData
        clothingItems.forEach(item => {
          item.images.forEach((imageUri, imageIndex) => {
            formData.append('images', {
              uri: imageUri,
              type: 'image/jpeg',
              name: `item_${item.id}_image_${imageIndex}.jpg`,
            });
          });
        });
      } else {
        formData.append('name', toyName);
        formData.append('description', toyDescription);
        formData.append('ageGroup', toyAgeGroup);
        formData.append('condition', toyCondition);
        
        // Add toy images to formData
        images.forEach((image, index) => {
          formData.append('images', {
            uri: image,
            type: 'image/jpeg',
            name: `image_${index}.jpg`,
          });
        });
      }

      const response = await api.post('/donations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Success!',
        `Your ${donationType} donation has been submitted successfully!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting donation:', error);
      Alert.alert('Error', 'Failed to submit donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addClothingItem = () => {
    setClothingItems([
      ...clothingItems,
      {
        id: Date.now(),
        type: '',
        size: '',
        color: '',
        gender: '',
        quantity: 1,
        images: [],
      },
    ]);
  };

  const removeClothingItem = (id) => {
    if (clothingItems.length === 1) {
      Alert.alert('Cannot Remove', 'You must have at least one clothing item.');
      return;
    }
    setClothingItems(clothingItems.filter((item) => item.id !== id));
  };

  const updateClothingItem = (id, field, value) => {
    setClothingItems(
      clothingItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const increaseQuantity = (id) => {
    setClothingItems(
      clothingItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setClothingItems(
      clothingItems.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const renderClothesForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>👚 Clothing Details</Text>

      {clothingItems.map((item, index) => (
        <View key={item.id} style={styles.clothingItemContainer}>
          <View style={styles.clothingItemHeader}>
            <Text style={styles.clothingItemTitle}>Item #{index + 1}</Text>
            {clothingItems.length > 1 && (
              <TouchableOpacity
                onPress={() => removeClothingItem(item.id)}
                style={styles.removeItemButton}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Image upload section for each clothing item */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Upload Images 📸</Text>
            <Text style={styles.imageHelpText}>
              Please add photos of this item
            </Text>

            {/* Display images for this item */}
            {item.images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {item.images.map((imageUri, imageIndex) => (
                  <View key={imageIndex} style={styles.imagePreview}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeItemImage(item.id, imageIndex)}
                    >
                      <X size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage(item.id)}
              >
                <Camera size={18} color="#333" />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => takePhoto(item.id)}
              >
                <Camera size={18} color="#333" />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Clothing Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.type}
              onValueChange={(value) => updateClothingItem(item.id, 'type', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select type" value="" />
              <Picker.Item label="T-Shirt" value="t-shirt" />
              <Picker.Item label="Shirt" value="shirt" />
              <Picker.Item label="Pants" value="pants" />
              <Picker.Item label="Jeans" value="jeans" />
              <Picker.Item label="Dress" value="dress" />
              <Picker.Item label="Skirt" value="skirt" />
              <Picker.Item label="Sweater" value="sweater" />
              <Picker.Item label="Jacket" value="jacket" />
              <Picker.Item label="Coat" value="coat" />
              <Picker.Item label="Socks" value="socks" />
              <Picker.Item label="Underwear" value="underwear" />
              <Picker.Item label="Pajamas" value="pajamas" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>

          <Text style={styles.label}>Size</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.size}
              onValueChange={(value) => updateClothingItem(item.id, 'size', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select size" value="" />
              <Picker.Item label="XS" value="XS" />
              <Picker.Item label="S" value="S" />
              <Picker.Item label="M" value="M" />
              <Picker.Item label="L" value="L" />
              <Picker.Item label="XL" value="XL" />
              <Picker.Item label="XXL" value="XXL" />
              <Picker.Item label="3XL" value="3XL" />
              <Picker.Item label="4XL" value="4XL" />
              <Picker.Item label="5XL" value="5XL" />
            </Picker>
          </View>

          <Text style={styles.label}>Color 🎨</Text>
          <TextInput
            style={styles.input}
            value={item.color}
            onChangeText={(value) => updateClothingItem(item.id, 'color', value)}
            placeholder="Enter color"
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.gender}
              onValueChange={(value) => updateClothingItem(item.id, 'gender', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select gender" value="" />
              <Picker.Item label="Men" value="men" />
              <Picker.Item label="Women" value="women" />
              <Picker.Item label="Boys" value="boys" />
              <Picker.Item label="Girls" value="girls" />
              <Picker.Item label="Unisex" value="unisex" />
            </Picker>
          </View>

          <View style={styles.quantityContainer}>
            <View style={styles.quantityRow}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={() => decreaseQuantity(item.id)}
                  style={[
                    styles.quantityButton,
                    item.quantity <= 1 && styles.quantityButtonDisabled,
                  ]}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={16} color={item.quantity <= 1 ? "#999" : "#333"} />
                </TouchableOpacity>

                <Text style={styles.quantityText}>{item.quantity}</Text>

                <TouchableOpacity
                  onPress={() => increaseQuantity(item.id)}
                  style={styles.quantityButton}
                >
                  <Plus size={16} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addItemButton}
        onPress={addClothingItem}
      >
        <Plus size={16} color="white" />
        <Text style={styles.addItemButtonText}>Add Another Item</Text>
      </TouchableOpacity>
    </View>
  );

  const renderToysForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>🧸 Toy Details</Text>

      <Text style={styles.label}>Item Name</Text>
      <TextInput
        style={styles.input}
        value={toyName}
        onChangeText={setToyName}
        placeholder="Enter item name"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={toyDescription}
        onChangeText={setToyDescription}
        placeholder="Enter description"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Age Group 👶👧👦</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={toyAgeGroup}
          onValueChange={setToyAgeGroup}
          style={styles.picker}
        >
          <Picker.Item label="Select age group" value="" />
          <Picker.Item label="Infant (0-1 year)" value="infant" />
          <Picker.Item label="Toddler (1-3 years)" value="toddler" />
          <Picker.Item label="Preschool (3-5 years)" value="preschool" />
          <Picker.Item label="School Age (5-12 years)" value="school" />
          <Picker.Item label="Teen (12+ years)" value="teen" />
          <Picker.Item label="All Ages" value="all" />
        </Picker>
      </View>

      <Text style={styles.label}>Condition ✨</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={toyCondition}
          onValueChange={setToyCondition}
          style={styles.picker}
        >
          <Picker.Item label="Select condition" value="" />
          <Picker.Item label="New (with tags)" value="new" />
          <Picker.Item label="Like New" value="like_new" />
          <Picker.Item label="Good" value="good" />
          <Picker.Item label="Fair" value="fair" />
        </Picker>
      </View>

      {/* Image upload section for toys */}
      <View style={styles.imageSection}>
        <Text style={styles.label}>Upload Images 📸</Text>
        <Text style={styles.imageHelpText}>
          Please add photos of the toy
        </Text>

        {images.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            {images.map((imageUri, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <X size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.imageButtonsContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={() => pickImage()}>
            <Camera size={18} color="#333" />
            <Text style={styles.imageButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imageButton} onPress={() => takePhoto()}>
            <Camera size={18} color="#333" />
            <Text style={styles.imageButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft color="#333" size={24} />
            </TouchableOpacity>
            <Text
              style={[
                styles.headerTitle,
                donationType === 'clothes' ? styles.clothesTitle : {},
              ]}
            >
              {donationType === 'clothes'
                ? '👚 Donate Clothing'
                : '🧸 Donate Toys'}
            </Text>
          </View>

          {donationType === 'clothes' ? renderClothesForm() : renderToysForm()}

          <TouchableOpacity
            style={[
              styles.submitButton,
              donationType === 'clothes' ? styles.clothesButton : {},
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit Donation {donationType === 'clothes' ? '👚' : '🧸'}
              </Text>
            )}
          </TouchableOpacity>
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
    alignItems: 'center',
    padding: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clothesTitle: {
    color: '#BE3E28',
    fontSize: 28,
  },
  formSection: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  picker: {
    height: 60,
    width: '100%',
  },
  helperText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 16,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
    flexDirection: 'row',
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  imagePreviewContainer: {
    marginTop: 8,
  },
  imagePreviewScroll: {
    flexDirection: 'row',
  },
  imagePreview: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#BE3E28',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#2D5A27',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 16,
    marginTop: 24,
  },
  clothesButton: {
    backgroundColor: '#BE3E28',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clothingItemContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clothingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clothingItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeItemButton: {
    backgroundColor: '#BE3E28',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemButton: {
    backgroundColor: '#2D5A27',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  addItemButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  quantityContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginLeft: 16,
    flex: 0.6,
  },
  quantityButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageHelpText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
