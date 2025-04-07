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
import Svg, { Path, Circle, G, Rect, Line } from 'react-native-svg';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, X, Plus, Minus, Image as ImageIcon, Cpu } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { CustomAlertMessage } from '@/components/CustomAlertMessage';
import DonationCart from '@/components/DonationCart';
import ClothingAnalyzer from '@/components/ClothingAnalyzer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InferenceClient } from '@huggingface/inference';
import { PanResponder, Animated } from 'react-native';

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
  const [showClothingAnalyzer, setShowClothingAnalyzer] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);

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

  // State for AI analysis results - Clothing
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clothingAiPredictions, setClothingAiPredictions] = useState<Array<{label: string, score: number}> | null>(null);
  const [aiColors, setAiColors] = useState<Array<{hex: string, score: number}> | null>(null);
  const [selectedClothingAiType, setSelectedClothingAiType] = useState<string | null>(null);
  const [selectedAiColor, setSelectedAiColor] = useState<string | null>(null);
  const [showClothingTypeOptions, setShowClothingTypeOptions] = useState(false);
  const [showColorOptions, setShowColorOptions] = useState(false);
  
  // State for AI analysis results - Toys
  const [isToyAnalyzing, setIsToyAnalyzing] = useState(false);
  const [toyAiPredictions, setToyAiPredictions] = useState<Array<{label: string, score: number}> | null>(null);
  const [selectedToyAiType, setSelectedToyAiType] = useState<string | null>(null);
  const [showToyTypeOptions, setShowToyTypeOptions] = useState(false);

  const [activeForm, setActiveForm] = useState<'clothing' | 'toys'>('clothing');
  const [pan] = useState(new Animated.ValueXY());

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) { 
          // Swipe right - faster animation
          Animated.timing(pan, {
            toValue: { x: 300, y: 0 },
            duration: 100, 
            useNativeDriver: true,
          }).start(() => {
            setActiveForm('toys');
            pan.setValue({ x: -300, y: 0 });
            Animated.timing(pan, {
              toValue: { x: 0, y: 0 },
              duration: 100,
              useNativeDriver: true,
            }).start();
          });
        } else if (gestureState.dx < -50) { 
          // Swipe left - faster animation
          Animated.timing(pan, {
            toValue: { x: -300, y: 0 },
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            setActiveForm('clothing');
            pan.setValue({ x: 300, y: 0 });
            Animated.timing(pan, {
              toValue: { x: 0, y: 0 },
              duration: 150,
              useNativeDriver: true,
            }).start();
          });
        } else {
          // Reset - faster
          Animated.timing(pan, {
            toValue: { x: 0, y: 0 },
            duration: 100,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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

      quality: 0.8,
    });

    if (!result.canceled) {
      if (itemId) {
        if (donationType === 'clothes') {
          setClothingItems(clothingItems.map(item => 
            item.id === itemId 
              ? { ...item, images: [result.assets[0].uri] } 
              : item
          ));
        } else {
          setToyItems(toyItems.map(item => 
            item.id === itemId 
              ? { ...item, images: [result.assets[0].uri] } 
              : item
          ));
        }
      } else {
        setImages([...images, result.assets[0].uri]);
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

      quality: 0.8,
    });

    if (!result.canceled) {
      if (itemId) {
        if (donationType === 'clothes') {
          setClothingItems(clothingItems.map(item => 
            item.id === itemId 
              ? { ...item, images: [result.assets[0].uri] } 
              : item
          ));
        } else {
          setToyItems(toyItems.map(item => 
            item.id === itemId 
              ? { ...item, images: [result.assets[0].uri] } 
              : item
          ));
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

  // Function to open the AI clothing analyzer for a specific item
  const openClothingAnalyzer = (itemId: number) => {
    setCurrentItemId(itemId);
    setShowClothingAnalyzer(true);
  };
  
  // Function to analyze toys with AI directly in the form
  const analyzeToyWithAI = async (itemId: number) => {
    setCurrentItemId(itemId);
    setIsToyAnalyzing(true);
    setToyAiPredictions(null);
    setSelectedToyAiType(null);
    setShowToyTypeOptions(false);
    // Clear any clothing predictions to avoid confusion
    setClothingAiPredictions(null);
    setAiColors(null);
    setSelectedClothingAiType(null);
    setSelectedAiColor(null);
    setShowClothingTypeOptions(false);
    setShowColorOptions(false);
    
    const item = toyItems.find(item => item.id === itemId);
    if (!item || !item.images || item.images.length === 0) {
      setAlertTitle('No Image');
      setAlertMessage('Please upload an image first before using AI identification.');
      setAlertVisible(true);
      setIsAnalyzing(false);
      return;
    }
    
    try {
      // Get API key from backend
      const apiKeyResponse = await fetch('http://10.0.0.20:3000/api/config');
      const apiKeyData = await apiKeyResponse.json();
      const apiKey = apiKeyData.huggingFaceApiKey;
      
      if (!apiKey) {
        throw new Error('API key not available');
      }
      
      // Classify the image
      const imageUri = item.images[0];
      
      // Create a blob from the image URI
      const response = await fetch(imageUri);
      const imageBlob = await response.blob();
      
      // Initialize the Hugging Face inference client with the API key
      const inference = new InferenceClient(apiKey);
      
      // Use the Microsoft ResNet-50 model for image classification
      // For toys, we'll only use the Microsoft model
      const result = await inference.imageClassification({
        model: 'microsoft/resnet-50',
        data: imageBlob,
      });
      
      // Filter out results with low confidence
      const filteredResults = result.filter((item: {label: string, score: number}) => 
        item.score > 0.1 // Only keep predictions with more than 10% confidence
      );
      
      setClothingAiPredictions(filteredResults.slice(0, 3));
      setShowClothingTypeOptions(true);
      
    } catch (error) {
      console.error('Error analyzing toy image:', error);
      setAlertTitle('Analysis Failed');
      setAlertMessage('Failed to analyze the image. Please try again.');
      setAlertVisible(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to handle the results from the AI clothing analyzer
  const handleAIResults = (type: string, color: string) => {
    console.log('AI Results received:', { type, color });
    
    if (currentItemId && type) {
      // Update clothing type
      setClothingItems(prevItems => prevItems.map(item => {
        if (item.id === currentItemId) {
          return { ...item, type };
        }
        return item;
      }));
    }
    
    if (currentItemId && color) {
      // Update color
      setClothingItems(prevItems => prevItems.map(item => {
        if (item.id === currentItemId) {
          return { ...item, color };
        }
        return item;
      }));
    }
    
    setShowClothingAnalyzer(false);
  };

  // Function to analyze clothing with AI directly in the form
  const analyzeClothingWithAI = async (itemId: number) => {
    setCurrentItemId(itemId);
    setIsAnalyzing(true);
    setClothingAiPredictions(null);
    setAiColors(null);
    setSelectedClothingAiType(null);
    setSelectedAiColor(null);
    setShowClothingTypeOptions(false);
    setShowColorOptions(false);
    // Clear any toy predictions to avoid confusion
    setToyAiPredictions(null);
    setSelectedToyAiType(null);
    setShowToyTypeOptions(false);
    
    const item = clothingItems.find(item => item.id === itemId);
    if (!item || !item.images || item.images.length === 0) {
      setAlertTitle('No Image');
      setAlertMessage('Please upload an image first before using AI identification.');
      setAlertVisible(true);
      setIsAnalyzing(false);
      return;
    }
    
    try {
      // Get API key from backend
      const apiKeyResponse = await fetch('http://10.0.0.20:3000/api/config');
      const apiKeyData = await apiKeyResponse.json();
      const apiKey = apiKeyData.huggingFaceApiKey;
      
      if (!apiKey) {
        throw new Error('API key not available');
      }
      
      // Classify the image
      const imageUri = item.images[0];
      
      // Create a blob from the image URI
      const response = await fetch(imageUri);
      const imageBlob = await response.blob();
      
      // Initialize the Hugging Face inference client with the API key
      const inference = new InferenceClient(apiKey);
      
      // Use the Microsoft ResNet-50 model for image classification
      const result = await inference.imageClassification({
        model: 'dima806/clothes_image_detection',
        data: imageBlob,
      });
      
      // Filter out non-clothing items
      const EXCLUDED_ITEMS = [
        'sleeping bag', 'sleeping-bag', 'sleepingbag', 'bedding', 'blanket', 'quilt', 'comforter',
        'pillow', 'cushion', 'mattress', 'bed sheet', 'duvet',
        'bulletproof vest','ski mask','gas mask','gas helmet', 'bullet proof vest', 'bulletproof', 'bullet-proof vest', 'body armor', 'body armour', 'armor vest', 'armour vest'
      ];
      
      const filteredResults = result.filter((item: {label: string, score: number}) => 
        !EXCLUDED_ITEMS.some(excluded => 
          item.label.toLowerCase().includes(excluded.toLowerCase())
        )
      );
      
      setClothingAiPredictions(filteredResults.slice(0, 3));
      setShowClothingTypeOptions(true);
      
      // Extract dominant colors
      // Convert image URI to base64 before sending to the backend
      const colorImageResponse = await fetch(imageUri);
      const colorImageBlob = await colorImageResponse.blob();
      
      // Convert blob to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix (e.g., 'data:image/jpeg;base64,')
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(colorImageBlob);
      });
      
      // Now send the base64 data to the backend
      const colorResponse = await fetch('http://10.0.0.20:3000/api/analyze-color', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64
        }),
      });
      
      if (!colorResponse.ok) {
        throw new Error(`Color analysis failed: ${colorResponse.status}`);
      }
      
      const colorData = await colorResponse.json();
      setAiColors(colorData.dominantColors);
      setShowColorOptions(true);
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAlertTitle('Analysis Failed');
      setAlertMessage('Failed to analyze the image. Please try again.');
      setAlertVisible(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to apply selected AI results to the form
  const applyAiResults = () => {
    if (currentItemId) {
      if (selectedClothingAiType) {
        // Update clothing type
        setClothingItems(prevItems => prevItems.map(item => {
          if (item.id === currentItemId) {
            return { ...item, type: selectedClothingAiType };
          }
          return item;
        }));
      }
      
      if (selectedAiColor) {
        // Update color
        setClothingItems(prevItems => prevItems.map(item => {
          if (item.id === currentItemId) {
            return { ...item, color: selectedAiColor };
          }
          return item;
        }));
      }
      
      // Reset AI states
      setClothingAiPredictions(null);
      setToyAiPredictions(null);
      setAiColors(null);
      setSelectedClothingAiType(null);
      setSelectedToyAiType(null);
      setSelectedAiColor(null);
      setCurrentItemId(null);
    }
  };

  // Function to map AI prediction labels to Picker values
  const mapAiLabelToPickerValue = (label: string): string => {
    // Convert label to lowercase for easier comparison
    const lowerLabel = label.toLowerCase();
    
    // Map common AI labels to our picker values
    if (lowerLabel.includes('t-shirt') || lowerLabel.includes('tshirt') || lowerLabel.includes('t shirt')) {
      return 't-shirt';
    } else if (lowerLabel.includes('shirt') && !lowerLabel.includes('t-shirt')) {
      return 'shirt';
    } else if (lowerLabel.includes('pant') && !lowerLabel.includes('jean')) {
      return 'pants';
    } else if (lowerLabel.includes('jean') || lowerLabel.includes('denim')) {
      return 'jeans';
    } else if (lowerLabel.includes('dress')) {
      return 'dress';
    } else if (lowerLabel.includes('skirt')) {
      return 'skirt';
    } else if (lowerLabel.includes('sweater') || lowerLabel.includes('pullover') || lowerLabel.includes('jumper')) {
      return 'sweater';
    } else if (lowerLabel.includes('jacket')) {
      return 'jacket';
    } else if (lowerLabel.includes('coat')) {
      return 'coat';
    } else if (lowerLabel.includes('sock')) {
      return 'socks';
    } else if (lowerLabel.includes('underwear') || lowerLabel.includes('brief')) {
      return 'underwear';
    } else if (lowerLabel.includes('pajama') || lowerLabel.includes('pyjama')) {
      return 'pajamas';
    } else {
      // Default to 'other' if no match found
      return 'other';
    }
  };

  const renderClothesForm = () => (
    <View style={styles.formSection}>
        <Image 
                                    source={require('../../assets/images/donation.png')} 
                                    style={styles.navIcon} 
                                  />

      {clothingItems.map((item, index) => (
        <View key={item.id} style={styles.clothingItemContainer}>
          <View style={styles.clothingItemHeader}>
            <Text style={styles.clothingItemTitle}>Item #{index + 1}</Text>
            {clothingItems.length > 1 && (
              <TouchableOpacity
                onPress={() => removeClothingItem(item.id)}
                style={styles.removeItemButton}
              >
                <X size={10} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Image upload section for each clothing item */}
          <View style={styles.imageSection}>
            {/* <Text style={styles.label}>Upload Images 📸</Text> */}
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
              
                onPress={() => pickImage(item.id)}
              >
                <Image 
                source={require('../../assets/images/picture.png')} 
                style={styles.navIcon} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                
                onPress={() => takePhoto(item.id)}
              >
                <Image 
                source={require('../../assets/images/camera.png')} 
                style={styles.navIcon} 
                />
              </TouchableOpacity>
            
              </View>
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity
                  style={styles.aiButtonContainer}
                  onPress={() => analyzeClothingWithAI(item.id)}
                >
                  <Image 
                    source={require('../../assets/images/ai.png')} 
                    style={styles.navIcon} 
                  />
                  <View style={styles.aiButtonTextContainer}>
                    <Text style={styles.aiButtonTitle}>AI Identify</Text>
                    <Text style={styles.aiButtonDescription}>Let AI detect clothing type and color</Text>
                  </View>
                </TouchableOpacity>
              </View>
            {isAnalyzing && (
              <ActivityIndicator size="small" color="#333" />
            )}

            {clothingAiPredictions && showClothingTypeOptions && (
              <View>
                <Text style={styles.label}>AI Clothing Type Suggestions</Text>
                <View style={styles.aiPredictionsContainer}>
                  {clothingAiPredictions.map((prediction: {label: string, score: number}) => (
                    <TouchableOpacity
                      key={prediction.label}
                      style={[styles.aiPredictionButton, selectedClothingAiType === prediction.label && styles.aiPredictionButtonSelected]}
                      onPress={() => {
                        setSelectedClothingAiType(mapAiLabelToPickerValue(prediction.label));
                        // Immediately update the clothing type in the form
                        if (currentItemId) {
                          setClothingItems(prevItems => prevItems.map(item => {
                            if (item.id === currentItemId) {
                              return { ...item, type: mapAiLabelToPickerValue(prediction.label) };
                            }
                            return item;
                          }));
                        }
                        // Hide the options after selection
                        setShowClothingTypeOptions(false);
                      }}
                    >
                      <Text style={[styles.aiPredictionText, selectedClothingAiType === prediction.label && styles.aiPredictionTextSelected]}>
                        {prediction.label} ({Math.round(prediction.score * 100)}%)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {aiColors && showColorOptions && (
              <View>
                <Text style={styles.label}>AI Color Suggestions</Text>
                <View style={styles.aiColorsRowContainer}>
                  {aiColors.slice(0, 3).map((color, index) => (
                    <TouchableOpacity
                      key={color.hex}
                      style={[styles.aiColorCircleButton, selectedAiColor === color.hex && styles.aiColorCircleButtonSelected]}
                      onPress={() => {
                        setSelectedAiColor(color.hex);
                        // Immediately update the color in the form
                        if (currentItemId) {
                          setClothingItems(prevItems => prevItems.map(item => {
                            if (item.id === currentItemId) {
                              return { ...item, color: color.hex };
                            }
                            return item;
                          }));
                        }
                        // Hide the options after selection
                        setShowColorOptions(false);
                      }}
                    >
                      <View style={[styles.aiColorCircle, { backgroundColor: color.hex }]} />
                      <Text style={styles.aiColorPercentage}>
                        {Math.round(color.score * 100)}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

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
            <Text style={styles.label}>Color 🎨</Text>
            <View style={styles.colorContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorOptionsRow}>
                  {/* Black */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#000000' },
                      item.color === 'black' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'black')}
                  />
                  
                  {/* White */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDDDDD' },
                      item.color === 'white' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'white')}
                  />
                  
                  {/* Red */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#FF0000' },
                      item.color === 'red' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'red')}
                  />
                  
                  {/* Green */}
                  
                  
                  {/* Blue */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#0000FF' },
                      item.color === 'blue' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'blue')}
                  />
                  
                  {/* Grey */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#808080' },
                      item.color === 'grey' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'grey')}
                  />
                  
                  {/* Custom Color from AI */}
                  {item.color && !['black', 'white', 'red', 'green', 'blue', 'grey'].includes(item.color) && (
                    <View style={styles.aiColorContainer}>
                      <TouchableOpacity 
                        style={[
                          styles.colorCircle,
                          { backgroundColor: item.color.startsWith('#') ? item.color : `#${item.color}` },
                          styles.colorCircleSelected
                        ]}
                      />
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>

            <Text style={styles.label}>Size</Text>
            <View style={styles.colorContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sizeOptionsRow}>
                  {/* XS Size */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.size === 'XS' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'size', 'XS')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.size === 'XS' && styles.sizeCircleTextSelected
                    ]}>XS</Text>
                  </TouchableOpacity>
                  
                  {/* S Size */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.size === 'S' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'size', 'S')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.size === 'S' && styles.sizeCircleTextSelected
                    ]}>S</Text>
                  </TouchableOpacity>
                  
                  {/* M Size */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.size === 'M' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'size', 'M')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.size === 'M' && styles.sizeCircleTextSelected
                    ]}>M</Text>
                  </TouchableOpacity>
                  
                  {/* L Size */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.size === 'L' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'size', 'L')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.size === 'L' && styles.sizeCircleTextSelected
                    ]}>L</Text>
                  </TouchableOpacity>
                  
                  {/* XL Size */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.size === 'XL' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'size', 'XL')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.size === 'XL' && styles.sizeCircleTextSelected
                    ]}>XL</Text>
                  </TouchableOpacity>
                  
                  {/* XXL Size */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.size === 'XXL' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'size', 'XXL')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.size === 'XXL' && styles.sizeCircleTextSelected
                    ]}>XXL</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

           
            <Text style={styles.label}>Gender</Text>
            
              
              <View style={styles.genderOptionsRow}>
                {/* Men Option */}
                <TouchableOpacity 
                  style={styles.genderRadioOption}
                  onPress={() => updateClothingItem(item.id, 'gender', 'men')}
                >
                  <View style={[
                    styles.genderIconContainer,
                    { backgroundColor: item.gender === 'men' ? '#e6f2ff' : '#e6f2ff50' }
                  ]}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path 
                        fillRule="evenodd" 
                        clipRule="evenodd" 
                        d="M14.9415 8.60977C14.6486 8.90266 14.6486 9.37754 14.9415 9.67043C15.2344 9.96332 15.7093 9.96332 16.0022 9.67043L14.9415 8.60977ZM18.9635 6.70907C19.2564 6.41617 19.2564 5.9413 18.9635 5.64841C18.6706 5.35551 18.1958 5.35551 17.9029 5.64841L18.9635 6.70907ZM16.0944 5.41461C15.6802 5.41211 15.3424 5.74586 15.3399 6.16007C15.3374 6.57428 15.6711 6.91208 16.0853 6.91458L16.0944 5.41461ZM18.4287 6.92872C18.8429 6.93122 19.1807 6.59747 19.1832 6.18326C19.1857 5.76906 18.8519 5.43125 18.4377 5.42875L18.4287 6.92872ZM19.1832 6.17421C19.1807 5.76001 18.8429 5.42625 18.4287 5.42875C18.0145 5.43125 17.6807 5.76906 17.6832 6.18326L19.1832 6.17421ZM17.6973 8.52662C17.6998 8.94082 18.0377 9.27458 18.4519 9.27208C18.8661 9.26958 19.1998 8.93177 19.1973 8.51756L17.6973 8.52662ZM16.0022 9.67043L18.9635 6.70907L17.9029 5.64841L14.9415 8.60977L16.0022 9.67043ZM16.0853 6.91458L18.4287 6.92872L18.4377 5.42875L16.0944 5.41461L16.0853 6.91458ZM17.6832 6.18326L17.6973 8.52662L19.1973 8.51756L19.1832 6.17421L17.6832 6.18326Z"
                        fill="#4285F4"
                      />
                      <Path 
                        d="M15.5631 16.1199C14.871 16.81 13.9885 17.2774 13.0288 17.462C12.0617 17.6492 11.0607 17.5459 10.1523 17.165C8.29113 16.3858 7.07347 14.5723 7.05656 12.5547C7.04683 11.0715 7.70821 9.66348 8.8559 8.72397C10.0036 7.78445 11.5145 7.4142 12.9666 7.71668C13.9237 7.9338 14.7953 8.42902 15.4718 9.14008C16.4206 10.0503 16.9696 11.2996 16.9985 12.6141C17.008 13.9276 16.491 15.1903 15.5631 16.1199Z" 
                        stroke="#4285F4" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </Svg>
                  </View>
                  <Text style={styles.genderLabel}>Men</Text>
                </TouchableOpacity>

                {/* Women Option */}
                <TouchableOpacity 
                  style={styles.genderRadioOption}
                  onPress={() => updateClothingItem(item.id, 'gender', 'women')}
                >
                  <View style={[
                    styles.genderIconContainer,
                    { backgroundColor: item.gender === 'women' ? '#ffebf0' : '#ffebf050' }
                  ]}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path 
                        fillRule="evenodd" 
                        clipRule="evenodd" 
                        d="M20 9C20 13.0803 16.9453 16.4471 12.9981 16.9383C12.9994 16.9587 13 16.9793 13 17V19H14C14.5523 19 15 19.4477 15 20C15 20.5523 14.5523 21 14 21H13V22C13 22.5523 12.5523 23 12 23C11.4477 23 11 22.5523 11 22V21H10C9.44772 21 9 20.5523 9 20C9 19.4477 9.44772 19 10 19H11V17C11 16.9793 11.0006 16.9587 11.0019 16.9383C7.05466 16.4471 4 13.0803 4 9C4 4.58172 7.58172 1 12 1C16.4183 1 20 4.58172 20 9ZM6.00365 9C6.00365 12.3117 8.68831 14.9963 12 14.9963C15.3117 14.9963 17.9963 12.3117 17.9963 9C17.9963 5.68831 15.3117 3.00365 12 3.00365C8.68831 3.00365 6.00365 5.68831 6.00365 9Z" 
                        fill="#FF4081"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.genderLabel}>Women</Text>
                </TouchableOpacity>

                {/* Unisex Option */}
                <TouchableOpacity 
                  style={styles.genderRadioOption}
                  onPress={() => updateClothingItem(item.id, 'gender', 'unisex')}
                >
                  <View style={[
                    styles.genderIconContainer,
                    { backgroundColor: item.gender === 'unisex' ? '#f0e6ff' : '#f0e6ff50' }
                  ]}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path 
                        d="M12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10Z" 
                        stroke="#9C27B0" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      <Path 
                        d="M12 10V16M9 13H15" 
                        stroke="#9C27B0" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      <Path 
                        d="M17.5 20.5L12 16L6.5 20.5" 
                        stroke="#9C27B0" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </Svg>
                  </View>
                  <Text style={styles.genderLabel}>Unisex</Text>
                </TouchableOpacity>
              

              {/* <View style={styles.genderOptionsRow}> */}
                {/* Boys Option */}
                {/* <TouchableOpacity 
                  style={styles.genderRadioOption}
                  onPress={() => updateClothingItem(item.id, 'gender', 'boys')}
                >
                  <View style={[
                    styles.genderRadioCircle, 
                    item.gender === 'boys' && styles.genderRadioCircleSelected,
                    { backgroundColor: item.gender === 'boys' ? '#e6f7ff' : '#e6f7ff50' }
                  ]}>
                    {item.gender === 'boys' && <View style={styles.genderRadioInnerCircle} />}
                  </View>
                  <View style={[
                    styles.genderIconContainer,
                    { backgroundColor: item.gender === 'boys' ? '#e6f7ff' : '#e6f7ff50' }
                  ]}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path 
                        d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" 
                        stroke="#2196F3" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      <Path 
                        d="M16 8L20 4M18 4H20V6" 
                        stroke="#2196F3" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      <Path 
                        d="M8 16L4 20M6 20H4V18" 
                        stroke="#2196F3" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </Svg>
                  </View>
                  <Text style={styles.genderLabel}>Boys</Text>
                </TouchableOpacity> */}

                {/* Girls Option */}
                {/* <TouchableOpacity 
                  style={styles.genderRadioOption}
                  onPress={() => updateClothingItem(item.id, 'gender', 'girls')}
                >
                  <View style={[
                    styles.genderRadioCircle, 
                    item.gender === 'girls' && styles.genderRadioCircleSelected,
                    { backgroundColor: item.gender === 'girls' ? '#fff0f5' : '#fff0f550' }
                  ]}>
                    {item.gender === 'girls' && <View style={styles.genderRadioInnerCircle} />}
                  </View>
                  <View style={[
                    styles.genderIconContainer,
                    { backgroundColor: item.gender === 'girls' ? '#fff0f5' : '#fff0f550' }
                  ]}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path 
                        d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" 
                        stroke="#E91E63" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      <Path 
                        d="M12 16V20M10 18H14" 
                        stroke="#E91E63" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      <Path 
                        d="M15 5L17 3M16 3H17V4" 
                        stroke="#E91E63" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      <Path 
                        d="M9 5L7 3M8 3H7V4" 
                        stroke="#E91E63" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </Svg>
                  </View>
                  <Text style={styles.genderLabel}>Girls</Text>
                </TouchableOpacity> */}

                {/* None Option */}
                {/* <TouchableOpacity 
                  style={styles.genderRadioOption}
                  onPress={() => updateClothingItem(item.id, 'gender', '')}
                >
                  <View style={[
                    styles.genderRadioCircle, 
                    item.gender === '' && styles.genderRadioCircleSelected,
                    { backgroundColor: item.gender === '' ? '#f5f5f5' : '#f5f5f550' }
                  ]}>
                    {item.gender === '' && <View style={styles.genderRadioInnerCircle} />}
                  </View>
                  <View style={[
                    styles.genderIconContainer,
                    { backgroundColor: item.gender === '' ? '#f5f5f5' : '#f5f5f550' }
                  ]}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path 
                        d="M8.19531 8.76498C8.42304 8.06326 8.84053 7.43829 9.40137 6.95899C9.96221 6.47968 10.6444 6.16501 11.373 6.0494C12.1017 5.9338 12.8486 6.02202 13.5303 6.3042C14.2119 6.58637 14.8016 7.05166 15.2354 7.64844C15.6691 8.24521 15.9295 8.95008 15.9875 9.68554C16.0455 10.421 15.8985 11.1581 15.5636 11.8154C15.2287 12.4728 14.7192 13.0251 14.0901 13.4106C13.4611 13.7961 12.7377 14.0002 12 14.0002V14.9998M12.0498 19V19.1L11.9502 19.1002V19H12.0498Z" 
                        stroke="#757575" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </Svg>
                  </View>
                  <Text style={styles.genderLabel}>None</Text>
                </TouchableOpacity> */}
              {/* </View> */}
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
      

      {toyItems.map((item, index) => (
        <View key={item.id} style={styles.clothingItemContainer}>
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
                <Image 
                    source={require('../../assets/images/picture.png')} 
                    style={styles.navIcon} 
                  />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => takePhoto(item.id)}
              >
                <Image 
                    source={require('../../assets/images/camera.png')} 
                    style={styles.navIcon} 
                  />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
              </View>
            
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity
                  style={styles.aiButtonContainer}
                  onPress={() => analyzeToyWithAI(item.id)}
                >
                  <Image 
                    source={require('../../assets/images/ai.png')} 
                    style={styles.navIcon} 
                  />
                  <View style={styles.aiButtonTextContainer}>
                    <Text style={styles.aiButtonTitle}>AI Identify</Text>
                    <Text style={styles.aiButtonDescription}>Let AI detect toy type</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {isToyAnalyzing && (
                <ActivityIndicator size="small" color="#333" />
              )}
              
              {/* AI Predictions for Toys */}
              {toyAiPredictions && showToyTypeOptions && (
                <View>
                  <Text style={styles.label}>AI Suggestions</Text>
                  <View style={styles.aiPredictionsContainer}>
                    {toyAiPredictions.map((prediction: {label: string, score: number}) => (
                      <TouchableOpacity
                        key={prediction.label}
                        style={[styles.aiPredictionButton, selectedToyAiType === prediction.label && styles.aiPredictionButtonSelected]}
                        onPress={() => {
                          // For toys, we'll use the label directly as the name
                          setSelectedToyAiType(prediction.label);
                          // Immediately update the toy name in the form
                          if (currentItemId) {
                            setToyItems(prevItems => prevItems.map(item => {
                              if (item.id === currentItemId) {
                                return { ...item, name: prediction.label };
                              }
                              return item;
                            }));
                          }
                          // Hide the options after selection
                          setShowToyTypeOptions(false);
                        }}
                      >
                        <Text style={[styles.aiPredictionText, selectedToyAiType === prediction.label && styles.aiPredictionTextSelected]}>
                          {prediction.label} ({Math.round(prediction.score * 100)}%)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
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
            <View style={styles.colorContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sizeOptionsRow}>
                  {/* Infant */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.ageGroup === 'infant' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'ageGroup', 'infant')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.ageGroup === 'infant' && styles.sizeCircleTextSelected
                    ]}>0-1</Text>
                  </TouchableOpacity>
                  
                  {/* Toddler */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.ageGroup === 'toddler' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'ageGroup', 'toddler')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.ageGroup === 'toddler' && styles.sizeCircleTextSelected
                    ]}>1-3</Text>
                  </TouchableOpacity>
                  
                  {/* Preschool */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.ageGroup === 'preschool' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'ageGroup', 'preschool')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.ageGroup === 'preschool' && styles.sizeCircleTextSelected
                    ]}>3-5</Text>
                  </TouchableOpacity>
                  
                  {/* School Age */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.ageGroup === 'school' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'ageGroup', 'school')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.ageGroup === 'school' && styles.sizeCircleTextSelected
                    ]}>5-12</Text>
                  </TouchableOpacity>
                  
                  {/* Teen */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.ageGroup === 'teen' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'ageGroup', 'teen')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.ageGroup === 'teen' && styles.sizeCircleTextSelected
                    ]}>12+</Text>
                  </TouchableOpacity>
                  
                  {/* All Ages */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.ageGroup === 'all' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'ageGroup', 'all')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.ageGroup === 'all' && styles.sizeCircleTextSelected
                    ]}>All</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            <Text style={styles.label}>Condition ✨</Text>
            <View style={styles.colorContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sizeOptionsRow}>
                  {/* New */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.condition === 'new' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'condition', 'new')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.condition === 'new' && styles.sizeCircleTextSelected
                    ]}>New</Text>
                  </TouchableOpacity>
                  
                  {/* Like New */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.condition === 'like_new' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'condition', 'like_new')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.condition === 'like_new' && styles.sizeCircleTextSelected
                    ]}>Like New</Text>
                  </TouchableOpacity>
                  
                  {/* Good */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.condition === 'good' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'condition', 'good')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.condition === 'good' && styles.sizeCircleTextSelected
                    ]}>Good</Text>
                  </TouchableOpacity>
                  
                  {/* Fair */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.condition === 'fair' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'condition', 'fair')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.condition === 'fair' && styles.sizeCircleTextSelected
                    ]}>Fair</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
         

          <View style={styles.container} {...panResponder.panHandlers}>
            <Animated.View 
              style={[
                styles.formContainer,
                { transform: [{ translateX: pan.x }] }
              ]}
            >
              {activeForm === 'clothing' ? renderClothesForm() : renderToysForm()}
            </Animated.View>
          </View>

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
      
      {/* Clothing Analyzer - No longer needed since we integrated the AI directly in the form */}
      {/* {showClothingAnalyzer && currentItemId && (
        <ClothingAnalyzer
          visible={showClothingAnalyzer}
          onResults={handleAIResults}
          onClose={() => setShowClothingAnalyzer(false)}
          imageUri={clothingItems.find(item => item.id === currentItemId)?.images[0]}
        />
      )} */}
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
    marginBottom: 26,
  },
  imagePreviewScroll: {
    flexDirection: 'row',
  },
  imagePreview: {
    position: 'relative',
    marginRight: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 30,
    backgroundColor: '#BE3E28',
    borderRadius: 12,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#ef5454',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 16,
    marginTop: 24,
  },
  clothesButton: {
    backgroundColor: '#ef5454',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clothingItemContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 5,
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
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemButton: {
    backgroundColor: '#65a765',
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
    justifyContent: 'space-around',
    marginBottom: 26,
  },
  aiButton: {
    backgroundColor: '#FCF2E9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#BE3E28',
  },
  aiButtonText: {
    color: '#BE3E28',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },
  colorInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    flex: 1,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginLeft: 8,
  },
  aiPredictionsContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 26,
  },
  aiPredictionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 26,
  },
  aiPredictionButtonSelected: {
    backgroundColor: '#E0E0E0',
  },
  aiPredictionText: {
    fontSize: 16,
    color: '#333',
  },
  aiPredictionTextSelected: {
    fontWeight: 'bold',
  },
  aiColorsContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 26,
  },
  aiColorsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 26,
  },
  aiColorCircleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  aiColorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  aiColorPercentage: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  aiColorButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiColorButtonSelected: {
    backgroundColor: '#E0E0E0',
  },
  aiColorCircleButtonSelected: {
    backgroundColor: '#F0F8FF',
  },
  aiColorText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  aiColorTextSelected: {
    fontWeight: 'bold',
  },
  applyAiButton: {
    backgroundColor: '#2D5A27',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  applyAiButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navIcon: {
    width: 40,
    height: 40,
  },
  genderRadioContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 26,
    shadowColor: '#00000050',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  genderTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 26,
    textAlign: 'center',
    color: '#555',
  },
  genderOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  genderRadioOption: {
    alignItems: 'center',
    width: '30%',
  },
  genderRadioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
  },
  genderRadioCircleSelected: {
    borderColor: '#BE3E28',
  },
  genderRadioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#BE3E28',
  },
  genderIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#00000030',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  genderLabel: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  sizeOptionsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  sizeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#e6f2ff50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sizeCircleSelected: {
    backgroundColor: '#e6f2ff',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  sizeCircleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
  },
  sizeCircleTextSelected: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  colorContainer: {
    marginBottom: 9,
  },
  colorOptionsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  aiColorContainer: {
    position: 'relative',
    marginRight: 15,
  },
  aiColorBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  aiColorBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  aiButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  aiButtonTextContainer: {
    marginLeft: 10,
  },
  aiButtonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  aiButtonDescription: {
    fontSize: 12,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
});
