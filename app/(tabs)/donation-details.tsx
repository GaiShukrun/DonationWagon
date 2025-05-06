import React, { useState, useEffect, useContext, useRef } from 'react';
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
import { GoogleGenAI } from "@google/genai";
import { createUserContent, createPartFromUri } from '@google/genai';
import { PanResponder, Animated } from 'react-native';

const SWIPE_THRESHOLD = 70;
const SWIPE_DISTANCE = 20;
const ANIMATION_DURATION = 40;

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
  const [detectingNow, setDetectingNow] = useState(false);
  const [ai, setAI] = useState(null);
  
  useEffect(() => {
    async function loadKey() {
      try {
        const response = await api.get("/gemini-api-key");
        const apiKey = response.apiKey;
        const aiInstance = new GoogleGenAI({ apiKey });
        setAI(aiInstance);
      } catch (err) {
        console.error("Error loading API key:", err);
      }
    }

    loadKey();
  }, []);

  async function detectAICloth(imageUri: string, itemId: number) {
    setDetectingNow(true);
    
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageFile = new File([blob], "image.jpg", { type: "image/jpeg" });
      
      const myfile = await ai.files.upload({
        file: imageFile,
        config: { mimeType: "image/jpeg" }
      });
      
      const generationResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-thinking-exp-01-21",
        contents: [
          {
            role: "user",
            parts: [
              { fileData: { fileUri: myfile.uri, mimeType: myfile.mimeType } },
              { text: "Identify this clothing item with: 1) specific cloth type (e.g., t-shirt, jeans, dress, jacket), 2) primary color in hex format, 3) size (XS, S, M, L, XL, XXL), and 4) likely gender (men, women, unisex). Return only the exact format: \"type,hex_color,size,gender\" with no other words or symbols. Example: \"t-shirt,#0000FF,L,men\"" }
            ]
          }
        ]
      });
      
      const aiText = generationResponse.text?.trim().toLowerCase();
      console.log("AI response:", aiText);

      if (aiText && aiText.includes(',')) {
        const [type, color, size, gender] = aiText.split(',').map((part: string) => part.trim());
        
        // Normalize color to hex format if needed
        const normalizedColor = color.startsWith('#') ? color : `#${color}`;
        
        // Map common clothing types to our form options
        const typeMapping: Record<string, string> = {
          't-shirt': 't-shirt',
          'shirt': 'shirt',
          'jeans': 'pants',
          'pants': 'pants',
          'dress': 'dress',
          'jacket': 'jacket',
          'sweater': 'sweater',
          'shorts': 'shorts',
          'skirt': 'skirt'
        };
        
        const normalizedType = typeMapping[type] || type;
        
        // Normalize size to uppercase (M instead of m)
        const normalizedSize = size.toUpperCase();
        
        // Normalize gender to always be lowercase for consistent badge logic
        const normalizedGender = gender.toLowerCase();
        
        setClothingItems(prevItems =>
  prevItems.map(item =>
    item.id === itemId
      ? { 
          ...item, 
          type: normalizedType, 
          color: normalizedColor,
          size: normalizedSize,
          gender: normalizedGender,
          aiSelectedType: true,
          aiSelectedColor: true,
          aiSelectedSize: true,
          aiSelectedGender: true,
          aiGender: normalizedGender // Store the AI's gender output for badge logic
        }
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
    setDetectingNow(true);
    
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageFile = new File([blob], "image.jpg", { type: "image/jpeg" });
      
      const myfile = await ai.files.upload({
        file: imageFile,
        config: { mimeType: "image/jpeg" }
      });
      
      const generationResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-thinking-exp-01-21",
        contents: [
          {
            role: "user",
            parts: [
              { fileData: { fileUri: myfile.uri, mimeType: myfile.mimeType } },
              { text: "Identify this toy with: 1) name (e.g., Lego set, Barbie doll), 2) description (brief details about the toy), 3) age group (infant, toddler, child, teen), and 4) condition (new, like new, used, needs repair). Return only the exact format: \"name,description,age group,condition\" with no other words or symbols. Example: \"Lego set,Classic brick building set,child,like new\"" }
            ]
          }
        ]
      });
      
      const aiText = generationResponse.text?.trim().toLowerCase();
      console.log("AI response:", aiText);
      if (aiText && aiText.includes(',')) {
        const [name, description, ageGroup, condition] = aiText.split(',').map(part => part.trim());
        
        // Format condition to match radio button values
        const formattedCondition = condition 
          ? condition.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
          : condition;
        
        setToyItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { 
                  ...item, 
                  name, 
                  description, 
                  ageGroup,
                  condition: formattedCondition,
                  aiSelectedName: true,
                  aiSelectedDescription: true,
                  aiSelectedAgeGroup: true,
                  aiSelectedCondition: true
                }
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

  const [clothingItems, setClothingItems] = useState([
    {
      id: 1,
      type: '',
      size: '',
      color: '',
      gender: '',
      quantity: 1,
      images: [] as string[],
      aiSelectedType: false,
      aiSelectedColor: false,
      aiSelectedSize: false,
      aiSelectedGender: false
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
      aiSelectedName: false,
      aiSelectedDescription: false,
      aiSelectedAgeGroup: false,
      aiSelectedCondition: false
    },
  ]);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState<(() => void) | undefined>(undefined);

  const [activeForm, setActiveForm] = useState<'clothing' | 'toys'>(() =>
    donationType === 'toys' ? 'toys' : 'clothing'
  );
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only allow swipe if gesture starts at leftmost or rightmost 5% of the screen
        const { locationX } = evt.nativeEvent;
        const { width: screenWidth } = require('react-native').Dimensions.get('window');
        if (screenWidth) {
          const edgeThreshold = screenWidth * 0.1;
          if (locationX <= edgeThreshold || locationX >= screenWidth - edgeThreshold) {
            return true;
          }
          return false;
        }
        return true;
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        console.log('SWIPE DEBUG:', {
          dx: gestureState.dx,
          dy: gestureState.dy,
          activeForm,
        });
        let switched = false;
        if (
          Math.abs(gestureState.dx) > SWIPE_THRESHOLD &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2
        ) {
          setActiveForm((prevForm) => {
            if (gestureState.dx > 0 && prevForm === 'clothing') {
              console.log('Switching to toys');
              switched = true;
              return 'toys';
            } else if (gestureState.dx < 0 && prevForm === 'toys') {
              console.log('Switching to clothing');
              switched = true;
              return 'clothing';
            }
            return prevForm;
          });
        }
        if (switched) {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        } else {
          pan.setValue({ x: 0, y: 0 });
        }
      },
    })
  ).current;

  const animatedStyle = {
    transform: pan.getTranslateTransform(),
    flex: 2, // Ensure the animated view takes full space
  };

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
        aiSelectedType: false,
        aiSelectedColor: false,
        aiSelectedSize: false,
        aiSelectedGender: false
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
        aiSelectedName: false,
        aiSelectedDescription: false,
        aiSelectedAgeGroup: false,
        aiSelectedCondition: false
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

      // Reset donation items after saving
      if (donationType === 'clothes') {
        setClothingItems([
          {
            id: Date.now(),
            type: '',
            size: '',
            color: '',
            gender: '',
            quantity: 1,
            images: [],
            aiSelectedType: false,
            aiSelectedColor: false,
            aiSelectedSize: false,
            aiSelectedGender: false
          },
        ]);
      } else {
        setToyItems([
          {
            id: Date.now(),
            name: '',
            description: '',
            ageGroup: '',
            condition: '',
            quantity: 1,
            images: [],
            aiSelectedName: false,
            aiSelectedDescription: false,
            aiSelectedAgeGroup: false,
            aiSelectedCondition: false
          },
        ]);
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
        aiSelectedType: false,
        aiSelectedColor: false,
        aiSelectedSize: false,
        aiSelectedGender: false
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
        item.id === id
          ? {
              ...item,
              [field]: value,
              // Remove AI badge when manually changing any field
              ...(field === 'gender' ? { aiSelectedGender: false } : {}),
              ...(field === 'type' ? { aiSelectedType: false } : {}),
              ...(field === 'color' ? { aiSelectedColor: false } : {}),
              ...(field === 'size' ? { aiSelectedSize: false } : {})
            }
          : item
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
        aiSelectedName: false,
        aiSelectedDescription: false,
        aiSelectedAgeGroup: false,
        aiSelectedCondition: false
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

  const openClothingAnalyzer = (itemId: number) => {
    setCurrentItemId(itemId);
    setShowClothingAnalyzer(true);
  };
  
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
      {clothingItems.map((item, index) => (
        <View key={item.id} style={styles.clothingItemContainer}>
          <View style={[styles.clothingItemHeader, {justifyContent: 'space-between', alignItems: 'center'}]}>
            {clothingItems.length > 1 ? (
              <TouchableOpacity onPress={() => removeClothingItem(item.id)} style={styles.removeItemButton}>
                <X size={16} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 30, height: 30 }} />
            )}
            <Text style={styles.MainTitle}>Clothes</Text>
            <TouchableOpacity style={styles.addItemButton} onPress={addClothingItem}>
              <Plus size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.clothingItemTitle}>Item No.{index + 1}</Text>

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
                  onPress={() => detectAICloth(item.images[0], item.id)}
                >
                  <Image 
                    source={require('../../assets/images/ai.png')} 
                    style={styles.navIcon} 
                  />
                  <View style={styles.aiButtonTextContainer}>
                    <Text style={styles.aiButtonTitle}>AI Identify</Text>
                    <Text style={styles.aiButtonDescription}>Let AI detect clothing & color</Text>
                  </View>
                </TouchableOpacity>
              </View>
            {detectingNow && (
              <ActivityIndicator size="small" color="#333" />
            )}
            <Text style={styles.label}>Clothing Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 10, marginTop: 10, marginLeft: 15 }}>
              {[
                { label: 'T-Shirt', value: 't-shirt', img: require('../../assets/images/polo-shirt.png') },
                { label: 'Shorts', value: 'shorts', img: require('../../assets/images/shorts.png') },
                { label: 'Pants', value: 'pants', img: require('../../assets/images/pants.png') },
                { label: 'Jeans', value: 'jeans', img: require('../../assets/images/jeans.png') },
                { label: 'Tank-Top', value: 'tank-top', img: require('../../assets/images/tank-top.png') },
                { label: 'Dress', value: 'dress', img: require('../../assets/images/dress.png') },
                { label: 'Skirt', value: 'skirt', img: require('../../assets/images/skirt.png') },
                { label: 'Sweater', value: 'sweater', img: require('../../assets/images/sweater.png') },
                { label: 'Jacket', value: 'jacket', img: require('../../assets/images/denim-jacket.png') },
                { label: 'Coat', value: 'coat', img: require('../../assets/images/coat.png') },
                { label: 'Socks', value: 'socks', img: require('../../assets/images/socks.png') },
            
                { label: 'Pajamas', value: 'pajamas', img: require('../../assets/images/pajamas.png') },
                { label: 'Other', value: 'other', img: require('../../assets/images/clothes.png') },
              ].map(option => {
                // Determine if this clothing type was set by AI
                const isAiType = item.type === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={{
                      alignItems: 'center',
                      marginRight: 20,
                      marginBottom: 12,
                      opacity: item.type === option.value ? 1 : 0.6,
                    }}
                    onPress={() => updateClothingItem(item.id, 'type', option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: item.type === option.value }}
                  >
                    <View style={{
                      borderWidth: item.type === option.value ? 1 : 1.5,
                      borderColor: item.type === option.value ? '#BE3E28' : '#ccc',
                      borderRadius: 22,
                      padding: 3,
                      backgroundColor: item.type === option.value ? '#FCF2E9' : '#fff',
                      position: 'static',
                        
                    }}>
                      <Image source={option.img} style={{ width: 40, height: 40, marginBottom: 2 }} />
                      {/* AI badge bubble for clothing type */}
                      {isAiType && item.aiSelectedType && (
                        <View style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#4285F4',
                          borderRadius: 8,
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                          zIndex: 10,
                        }}>
                          <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>AI</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.label}>Color 🎨</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 10, marginTop: 10, marginLeft: 15 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorOptionsRow}>
                  {/* Black */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#000000', opacity: item.color === 'black' ? 1 : 0.6 },
                      item.color === 'black' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'black')}
                  />
                  
                  {/* White */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDDDDD', opacity: item.color === 'white' ? 1 : 0.6 },
                      item.color === 'white' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'white')}
                  />
                  
                  {/* Red */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#FF0000', opacity: item.color === 'red' ? 1 : 0.6 },
                      item.color === 'red' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'red')}
                  />
                  
                  {/* Green */}
                  
                  
                  {/* Blue */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#0000FF', opacity: item.color === 'blue' ? 1 : 0.6 },
                      item.color === 'blue' && styles.colorCircleSelected
                    ]}
                    onPress={() => updateClothingItem(item.id, 'color', 'blue')}
                  />
                  
                  {/* Grey */}
                  <TouchableOpacity 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: '#808080', opacity: item.color === 'grey' ? 1 : 0.6 },
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
                          { backgroundColor: item.color.startsWith('#') ? item.color : `#${item.color}`, opacity: 1 },
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 10, marginTop: 10, marginLeft: 5 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sizeOptionsRow}>
                  {/* XS Size */}
                  <View style={{position: 'relative'}}>
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
                    {item.size === 'XS' && item.aiSelectedSize && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* S Size */}
                  <View style={{position: 'relative'}}>
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
                    {item.size === 'S' && item.aiSelectedSize && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* M Size */}
                  <View style={{position: 'relative'}}>
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
                    {item.size === 'M' && item.aiSelectedSize && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* L Size */}
                  <View style={{position: 'relative'}}>
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
                    {item.size === 'L' && item.aiSelectedSize && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* XL Size */}
                  <View style={{position: 'relative'}}>
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
                    {item.size === 'XL' && item.aiSelectedSize && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* XXL Size */}
                  <View style={{position: 'relative'}}>
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
                    {item.size === 'XXL' && item.aiSelectedSize && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
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
                    <Text style={styles.genderLabel}>{item.gender === 'men' ? 'Men' : 'men'}</Text>
                  </TouchableOpacity>
                  {item.gender === 'men' && item.aiSelectedGender && item.gender === item.aiGender && (
                    <View style={styles.aiColorBadge}>
                      <Text style={styles.aiColorBadgeText}>AI</Text>
                    </View>
                  )}
                
                
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
                    <Text style={styles.genderLabel}>{item.gender === 'women' ? 'Women' : 'women'}</Text>
                  </TouchableOpacity>
                  {item.gender === 'women' && item.aiSelectedGender && item.gender === item.aiGender && (
                    <View style={styles.aiColorBadge}>
                      <Text style={styles.aiColorBadgeText}>AI</Text>
                    </View>
                  )}
                
                
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
                    <Text style={styles.genderLabel}>{item.gender === 'unisex' ? 'unisex' : 'unisex'}</Text>
                  </TouchableOpacity>
                  {item.gender === 'unisex' && item.aiSelectedGender && item.gender === item.aiGender && (
                    <View style={styles.aiColorBadge}>
                      <Text style={styles.aiColorBadgeText}>AI</Text>
                    </View>
                  )}
                
            </View> 
          </View>
          
        </View>
      ))}
      
    </View>
  );

  const renderToysForm = () => (
    <View style={styles.formSection}>
             
                

      {toyItems.map((item, index) => (
        <View key={item.id} style={styles.clothingItemContainer}>
          <View style={[styles.clothingItemHeader, {justifyContent: 'space-between', alignItems: 'center'}]}>
            {toyItems.length > 1 ? (
              <TouchableOpacity onPress={() => removeToyItem(item.id)} style={styles.removeItemButton}>
                <X size={16} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 30, height: 30 }} />
            )}
            <Text style={styles.MainTitle}>Toys</Text>
            <TouchableOpacity style={styles.addItemButton} onPress={addToyItem}>
              <Plus size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.clothingItemTitle}>Item No.{index + 1}</Text>

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
                  onPress={() => detectAIToy(item.images[0], item.id)}
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
              {detectingNow && (
                <ActivityIndicator size="small" color="#333" />
              )}
              
              {/* AI Predictions for Toys */}
              {/* {toyAiPredictions && showToyTypeOptions && (
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
              )} */}
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 10, marginTop: 10, marginLeft: 15 }}>
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
                    {item.ageGroup === 'infant' && item.aiSelectedAgeGroup && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
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
                    {item.ageGroup === 'toddler' && item.aiSelectedAgeGroup && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {/* Child */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.ageGroup === 'child' && styles.sizeCircleSelected
                    ]}
                    onPress={() => updateToyItem(item.id, 'ageGroup', 'child')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.ageGroup === 'child' && styles.sizeCircleTextSelected
                    ]}>3-12</Text>
                    {item.ageGroup === 'child' && item.aiSelectedAgeGroup && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
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
                    {item.ageGroup === 'teen' && item.aiSelectedAgeGroup && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
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
                    {item.ageGroup === 'all' && item.aiSelectedAgeGroup && (
                      <View style={styles.aiColorBadge}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            <Text style={styles.label}>Condition ✨</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 10, marginTop: 10, marginLeft: 15 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sizeOptionsRow}>
                  {/* New */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.condition === 'New' && styles.sizeCircleSelected,
                      {position: 'relative'}
                    ]}
                    onPress={() => updateToyItem(item.id, 'condition', 'New')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.condition === 'New' && styles.sizeCircleTextSelected
                    ]}>New</Text>
                    {item.condition === 'New' && item.aiSelectedCondition && (
                      <View style={[styles.aiColorBadge, {position: 'absolute', top: -5, right: -5}]}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {/* Like New */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.condition === 'Like New' && styles.sizeCircleSelected,
                      {position: 'relative'}
                    ]}
                    onPress={() => updateToyItem(item.id, 'condition', 'Like New')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.condition === 'Like New' && styles.sizeCircleTextSelected
                    ]}>Like New</Text>
                    {item.condition === 'Like New' && item.aiSelectedCondition && (
                      <View style={[styles.aiColorBadge, {position: 'absolute', top: -5, right: -5}]}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {/* Good */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.condition === 'Good' && styles.sizeCircleSelected,
                      {position: 'relative'}
                    ]}
                    onPress={() => updateToyItem(item.id, 'condition', 'Good')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.condition === 'Good' && styles.sizeCircleTextSelected
                    ]}>Good</Text>
                    {item.condition === 'Good' && item.aiSelectedCondition && (
                      <View style={[styles.aiColorBadge, {position: 'absolute', top: -5, right: -5}]}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {/* Fair */}
                  <TouchableOpacity 
                    style={[
                      styles.sizeCircle,
                      item.condition === 'Fair' && styles.sizeCircleSelected,
                      {position: 'relative'}
                    ]}
                    onPress={() => updateToyItem(item.id, 'condition', 'Fair')}
                  >
                    <Text style={[
                      styles.sizeCircleText,
                      item.condition === 'Fair' && styles.sizeCircleTextSelected
                    ]}>Fair</Text>
                    {item.condition === 'Fair' && item.aiSelectedCondition && (
                      <View style={[styles.aiColorBadge, {position: 'absolute', top: -5, right: -5}]}>
                        <Text style={styles.aiColorBadgeText}>AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>


          </View>
        </View>
      ))}

     
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    if (activeForm === 'clothing') {
      setClothingItems([{ id: 1, type: '', size: '', color: '', gender: '', quantity: 1, images: [] as string[], aiSelectedType: false, aiSelectedColor: false, aiSelectedSize: false, aiSelectedGender: false }]);
    } else {
      setToyItems([{ id: 1, name: '', description: '', ageGroup: '', condition: '', quantity: 1, images: [] as string[], aiSelectedName: false, aiSelectedDescription: false, aiSelectedAgeGroup: false, aiSelectedCondition: false }]);
    }
    setImages([]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {showDonationCart && (
            <DonationCart
              onDonationTypeSelected={(type) => handleStartNewDonation(type)}
            />
          )}
         

          <Animated.View 
              style={[
                styles.formContainer,
                { transform: [{ translateX: pan.x }] }
              ]}
              {...panResponder.panHandlers}
            >
              {activeForm === 'clothing' ? renderClothesForm() : renderToysForm()}
            </Animated.View>

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
                Save Donation for Pickup   
                
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
    
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
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
    padding: 18,
    marginBottom: 1,
    backgroundColor: '#FCF2E9',
    borderRadius: 10,
    marginHorizontal: 0,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    
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
    borderRadius: 22,
    padding: 10,
    alignItems: 'center',
    margin: 10,
    marginTop: 5,
    marginBottom: 10,
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  MainTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  removeItemButton: {
    backgroundColor: '#BE3E28',
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    flexDirection: 'row', 
    justifyContent: 'center',
  },
  addItemButton: {
    backgroundColor: '#65a765',
    borderRadius: 20,
    padding: 2,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', 
    marginTop: 0,
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
  navIcon1: {
    width: 20,
    height: 20,
  },
  navIcon: {
    width: 50,
    height: 50,
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
    paddingVertical: 9,
  },
  sizeCircle: {
    width: 35,
    height: 35,
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
