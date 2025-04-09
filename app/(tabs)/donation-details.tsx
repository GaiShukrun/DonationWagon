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
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, X, Plus, Minus, Image as ImageIcon } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { CustomAlertMessage } from '@/components/CustomAlertMessage';
import DonationCart from '@/components/DonationCart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenAI } from "@google/genai";
import { createUserContent, createPartFromUri } from '@google/genai';


export default function DonationDetails() {
  const { isUserLoggedIn, requireAuth, user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const api = useApi();
  const donationType = params.type as string || '';
  
  const [showDonationCart, setShowDonationCart] = useState(!donationType);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [detectingNow, setDetectingNow] = useState(false);

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

  const [toyItems, setToyItems] = useState([
    {
      id: 1,
      name: '',
      description: '',
      ageGroup: '',
      condition: '',
      quantity: 1,
      images: [] as string[],
    },
  ]);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState<(() => void) | undefined>(undefined);

  const [ai, setAI] = useState(null);
  
  useEffect(() => {
    async function loadKey() {
      try {
        const response = await api.get("/gemini-api-key"); // Axios-style
        const apiKey = response.apiKey;
        const aiInstance = new GoogleGenAI({ apiKey });
        setAI(aiInstance);
      } catch (err) {
        console.error("Error loading API key:", err);
      }
    }

    loadKey();
  }, []);



  useEffect(() => {
    if (!isUserLoggedIn) {
      router.push({
        pathname: '/(auth)/Sign-In',
        params: { message: 'Please sign in to donate items' },
      });
    }
  }, [isUserLoggedIn]);

  const handleStartNewDonation = (type: string) => {
    setShowDonationCart(false);
    // Reset form state for the new donation
    if (type === 'clothes') {
      setClothingItems([{
        id: 1,
        type: '',
        size: '',
        color: '',
        gender: '',
        quantity: 1,
        images: [] as string[],
      }]);
    } else {
      setToyItems([{
        id: 1,
        name: '',
        description: '',
        ageGroup: '',
        condition: '',
        quantity: 1,
        images: [] as string[],
      }]);
    }
    setImages([]);
  };


  async function detectAICloth(imageUri: string, itemId: number) {
    // Set loading state
    setDetectingNow(true);
    
    try {
      // For React Native, we need to work with Blob or base64 data directly
      // instead of file paths since we're in a mobile environment
      
      // Create a Blob from your image data
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create a File object from the Blob
      const imageFile = new File([blob], "image.jpg", { type: "image/jpeg" });
      
      // Upload the file
      const myfile = await ai.files.upload({
        file: imageFile,
        config: { mimeType: "image/jpeg" }
      });
      
      console.log("Uploaded file:", myfile);
      
      // Then use the file URI in the content generation request
      const generationResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-thinking-exp-01-21",
        contents: [
          {
            role: "user",
            parts: [
              { fileData: { fileUri: myfile.uri, mimeType: myfile.mimeType } },
              { text: "Name the clothing category (e.g., top, bottom, footwear) and its color? Return only the \"category,color\" no other words." }
            ]
          }
        ]
      });
      
      const aiText = generationResponse.text?.trim().toLowerCase();
      console.log("AI response:", aiText);

      if (aiText && aiText.includes(',')) {
        const [type, color] = aiText.split(',').map(part => part.trim());
        console.log("Detected type:", type, "Detected color:", color);
        // Update the item with type and color
        setClothingItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, type: type , color: color}
              : item
          )
        );
      }
    } catch (error) {
      console.error("Error detecting AI:", error);
    } finally {
      setDetectingNow(false);
    }
  }

  async function detectAIToy(imageUri: string, itemId: number) {
    // Set loading state
    setDetectingNow(true);
    
    try {
      // For React Native, we need to work with Blob or base64 data directly
      // instead of file paths since we're in a mobile environment
      
      // Create a Blob from your image data
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create a File object from the Blob
      const imageFile = new File([blob], "image.jpg", { type: "image/jpeg" });
      
      // Upload the file
      const myfile = await ai.files.upload({
        file: imageFile,
        config: { mimeType: "image/jpeg" }
      });
      
      console.log("Uploaded file:", myfile);
      
      // Then use the file URI in the content generation request
      const generationResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-thinking-exp-01-21",
        contents: [
          {
            role: "user",
            parts: [
              { fileData: { fileUri: myfile.uri, mimeType: myfile.mimeType } },
              { text: "Name the toy and description, age group. Return only the \"toy\ndescription\nage group\" no other words." }
            ]
          }
        ]
      });
      
      const aiText = generationResponse.text?.trim().toLowerCase();
      console.log("AI response:", aiText);

      if (aiText) {
        const sections = aiText.split('\n').map(line => line.trim()).filter(Boolean);
        console.log("Detected sections:", sections);
        if (sections.length >= 3) {
          const toy = sections[0]; // $toy
          const description = sections[1]; // $description
          const ageGroup = sections[2]; // $age group
      
          console.log("Toy:", toy);
          console.log("Description:", description);
          console.log("Age Group:", ageGroup);        // Update the item with type and color
        setToyItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, name: toy , description: description, ageGroup:ageGroup}
              : item
          )
        ); 
      }
    }

      
    } catch (error) {
      console.error("Error detecting AI:", error);
    } finally {
      setDetectingNow(false);
    }
  }

  
  // // Helper function to convert image to base64
  // async function convertImageToBase64(uri) {
  //   // Implementation depends on your React Native setup
  //   // Example using react-native-fs:
  //   const RNFS = require('react-native-fs');
  //   const base64 = await RNFS.readFile(uri, 'base64');
  //   return base64;
  // }


  const pickImage = async (itemId?: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      setAlertTitle('Permission Required');
      setAlertMessage('We need access to your photos to upload images.');
      setAlertVisible(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {      
      if (itemId) {
        if (donationType === 'clothes') {
          setClothingItems(clothingItems.map(item => 
            item.id === itemId 
              ? { ...item, images: [...item.images, result.assets[0].uri] } 
              : item
          ));
          setDetectingNow(true);
          detectAICloth(result.assets[0].uri,itemId);
        } else {
          setToyItems(toyItems.map(item => 
            item.id === itemId 
              ? { ...item, images: [...item.images, result.assets[0].uri] } 
              : item
          ));
          setDetectingNow(true);
          detectAIToy(result.assets[0].uri,itemId);
        }
      } else {
        setImages([...images, result.assets[0]]);
      }
    }
  };

  const takePhoto = async (itemId?: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      setAlertTitle('Permission Required');
      setAlertMessage('We need access to your camera to take photos.');
      setAlertVisible(true);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      if (itemId) {
        if (donationType === 'clothes') {
          setClothingItems(clothingItems.map(item => 
            item.id === itemId 
              ? { ...item, images: [...item.images, result.assets[0].uri] } 
              : item
          ));
          setDetectingNow(true);
          detectAICloth(result.assets[0].uri,itemId);
        } else {
          setToyItems(toyItems.map(item => 
            item.id === itemId 
              ? { ...item, images: [...item.images, result.assets[0].uri] } 
              : item
          ));
          setDetectingNow(true);
          detectAIToy(result.assets[0].uri,itemId);
        }
      } else {
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
    if (donationType === 'clothes') {
      setClothingItems(clothingItems.map(item => {
        if (item.id === itemId) {
          const newImages = [...item.images];
          newImages.splice(imageIndex, 1);
          return { ...item, images: newImages };
        }
        return item;
      }));
    } else {
      setToyItems(toyItems.map(item => {
        if (item.id === itemId) {
          const newImages = [...item.images];
          newImages.splice(imageIndex, 1);
          return { ...item, images: newImages };
        }
        return item;
      }));
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Validate required fields based on donation type
      const invalidItems = donationType === 'clothes' 
        ? clothingItems.filter(item => !item.type || !item.size || !item.gender || item.images.length === 0)
        : toyItems.filter(item => !item.name || !item.description || !item.ageGroup || !item.condition || item.images.length === 0);
      
      if (invalidItems.length > 0) {
        setAlertTitle('Missing Information');
        setAlertMessage(`Please complete all required fields and add at least one image for each ${donationType} item.`);
        setAlertVisible(true);
        setIsLoading(false);
        return;
      }

      // Make sure we have a valid user ID
      if (!user || !user.id) {
        setAlertTitle('Authentication Error');
        setAlertMessage('You must be logged in to submit a donation.');
        setAlertVisible(true);
        setIsLoading(false);
        return;
      }

      console.log('Submitting donation with user ID:', user.id);

      // Prepare data for API
      const donationData = {
        userId: user.id,
        donationType,
        clothingItems: donationType === 'clothes' ? clothingItems.map(item => ({
          type: item.type,
          size: item.size,
          color: item.color,
          gender: item.gender,
          quantity: item.quantity,
          images: item.images
        })) : [],
        toyItems: donationType === 'toys' ? toyItems.map(item => ({
          name: item.name,
          description: item.description,
          ageGroup: item.ageGroup,
          condition: item.condition,
          quantity: item.quantity,
          images: item.images
        })) : []
      };

      // Save donation to backend
      const response = await api.post('/donations', donationData);
      console.log('Donation submission response:', response);

      // Set a flag in AsyncStorage to indicate that the donation cart needs refreshing
      await AsyncStorage.setItem('donationCartNeedsRefresh', 'true');

      // Clear donation items after saving
      if (donationType === 'clothes') {
        setClothingItems([]);
      } else {
        setToyItems([]);
      }

      setAlertTitle('Success!');
      setAlertMessage(`Your ${donationType} donation has been saved to your donation cart! You can schedule a pickup later.`);
      setAlertCallback(() => () => router.back());
      setAlertVisible(true);
    } catch (error) {
      console.error('Error saving donation:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to save donation. Please try again.');
      setAlertVisible(true);
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
      setAlertTitle('Cannot Remove');
      setAlertMessage('You must have at least one clothing item.');
      setAlertVisible(true);
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

  const addToyItem = () => {
    setToyItems([
      ...toyItems,
      {
        id: Date.now(),
        name: '',
        description: '',
        ageGroup: '',
        condition: '',
        quantity: 1,
        images: [],
      },
    ]);
  };

  const removeToyItem = (id) => {
    if (toyItems.length === 1) {
      setAlertTitle('Cannot Remove');
      setAlertMessage('You must have at least one toy item.');
      setAlertVisible(true);
      return;
    }
    setToyItems(toyItems.filter((item) => item.id !== id));
  };

  const updateToyItem = (id, field, value) => {
    setToyItems(
      toyItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const increaseToyQuantity = (id) => {
    setToyItems(
      toyItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseToyQuantity = (id) => {
    setToyItems(
      toyItems.map((item) =>
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
          {detectingNow && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Detecting item details...</Text>
            </View>
          )}
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
                <ImageIcon size={18} color="#333" />
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
              {item.type.length > 0 && (
                <Picker.Item
                  label={`Chosen: ${item.type}`}
                  value={item.type}
                />
              )}
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
              {item.size.length > 0 && (
                <Picker.Item
                  label={`Chosen: ${item.size}`}
                  value={item.size}
                />
              )}
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
              {item.gender.length > 0 && (
                <Picker.Item
                  label={`Chosen: ${item.gender}`}
                  value={item.gender}
                />
              )}
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

      {toyItems.map((item, index) => (
        <View key={item.id} style={styles.clothingItemContainer}>
          {detectingNow && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Detecting item details...</Text>
            </View>
          )}
          <View style={styles.clothingItemHeader}>
            <Text style={styles.clothingItemTitle}>Item #{index + 1}</Text>
            {toyItems.length > 1 && (
              <TouchableOpacity
                onPress={() => removeToyItem(item.id)}
                style={styles.removeItemButton}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Image upload section for each toy item */}
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
                <ImageIcon size={18} color="#333" />
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

          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            value={item.name}
            onChangeText={(value) => updateToyItem(item.id, 'name', value)}
            placeholder="Enter item name"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={item.description}
            onChangeText={(value) => updateToyItem(item.id, 'description', value)}
            placeholder="Enter description"
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Age Group 👶👧👦</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.ageGroup}
              onValueChange={(value) => updateToyItem(item.id, 'ageGroup', value)}
              style={styles.picker}
            >
              
              <Picker.Item label="Select age group" value="" />
              <Picker.Item label="Infant (0-1 year)" value="infant" />
              <Picker.Item label="Toddler (1-3 years)" value="toddler" />
              <Picker.Item label="Preschool (3-5 years)" value="preschool" />
              <Picker.Item label="School Age (5-12 years)" value="school" />
              <Picker.Item label="Teen (12+ years)" value="teen" />
              <Picker.Item label="All Ages" value="all" />
              {item.ageGroup.length > 0 && (
                <Picker.Item
                  label={`Chosen: ${item.ageGroup}`}
                  value={item.ageGroup}
                />
              )}
              
            </Picker>
          </View>

          <Text style={styles.label}>Condition ✨</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.condition}
              onValueChange={(value) => updateToyItem(item.id, 'condition', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select condition" value="" />
              <Picker.Item label="New (with tags)" value="new" />
              <Picker.Item label="Like New" value="like_new" />
              <Picker.Item label="Good" value="good" />
              <Picker.Item label="Fair" value="fair" />
              {item.condition.length > 0 && (
                <Picker.Item
                  label={`Chosen: ${item.condition}`}
                  value={item.condition}
                />
              )}
            </Picker>
          </View>

          <View style={styles.quantityContainer}>
            <View style={styles.quantityRow}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={() => decreaseToyQuantity(item.id)}
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
                  onPress={() => increaseToyQuantity(item.id)}
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
        onPress={addToyItem}
      >
        <Plus size={16} color="white" />
        <Text style={styles.addItemButtonText}>Add Another Item</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          {showDonationCart && (
            <DonationCart
              onDonationTypeSelected={(type) => handleStartNewDonation(type)}
            />
          )}
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
                Save Donation for Pickup {donationType === 'clothes' ? '👚' : '🧸'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Custom Alert Message */}
      <CustomAlertMessage
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        onConfirm={() => {
          setAlertVisible(false);
          if (alertCallback) alertCallback();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 0,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 18,
    color: '#555',
  },
});
