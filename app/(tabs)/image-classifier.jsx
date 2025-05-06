import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { CameraIcon, ImageIcon } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InferenceClient } from "@huggingface/inference";

// Default API key for testing (will be replaced by the one from backend)
const DEFAULT_API_KEY = '';

// List of clothing-related keywords to filter results


// List of items to explicitly exclude from clothing results
const EXCLUDED_ITEMS = [
  'sleeping bag', 'sleeping-bag', 'sleepingbag', 'bedding', 'blanket', 'quilt', 'comforter',
  'pillow', 'cushion', 'mattress', 'bed sheet', 'duvet',
  'bulletproof vest','ski mask','gas mask','gas helmet', 'bullet proof vest', 'bulletproof', 'bullet-proof vest', 'body armor', 'body armour', 'armor vest', 'armour vest'
];

const ImageClassifierScreen = () => {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [dominantColor, setDominantColor] = useState(null);
  const [selectedClassification, setSelectedClassification] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Fetch API key from backend on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('http://10.0.0.20:3000/api/config');
        const data = await response.json();
        if (data.huggingFaceApiKey) {
          setApiKey(data.huggingFaceApiKey);
          // Also save to AsyncStorage for future use
          await AsyncStorage.setItem('huggingFaceApiKey', data.huggingFaceApiKey);
          console.log('API key fetched from backend');
        }
      } catch (error) {
        console.error('Error fetching API key from backend:', error);
        // Try to load from AsyncStorage as fallback
        try {
          const storedKey = await AsyncStorage.getItem('huggingFaceApiKey');
          if (storedKey) {
            setApiKey(storedKey);
            console.log('API key loaded from AsyncStorage');
          }
        } catch (storageError) {
          console.error('Error loading API key from storage:', storageError);
        }
      }
    };

    fetchApiKey();
  }, []);

  // Check for stored API key on component mount
  useEffect(() => {
    const getStoredApiKey = async () => {
      try {
        const storedApiKey = await AsyncStorage.getItem('huggingface_api_key');
        if (storedApiKey) {
          setApiKey(storedApiKey);
        } else {
          // Use the default key and save it
          await AsyncStorage.setItem('huggingface_api_key', DEFAULT_API_KEY);
        }
      } catch (error) {
        console.error('Error retrieving API key:', error);
        // If there's an error, still use the default key
        setApiKey(DEFAULT_API_KEY);
      }
    };

    getStoredApiKey();
  }, []);

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return false;
    }

    try {
      await AsyncStorage.setItem('huggingface_api_key', apiKey);
      setShowApiKeyInput(false);
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'Failed to save API key');
      return false;
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setError(null);
      setPrediction(null);
      
      // Request permission to access the image library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access gallery is required!');
        return;
      }

      // Launch the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        classifyImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      setError(null);
      setPrediction(null);
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access camera is required!');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        classifyImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      setError('Failed to take photo');
    }
  };

  const filterExcludedItems = (predictions) => {
    if (!Array.isArray(predictions)) return [];
    
    // Filter out excluded items
    return predictions.filter(item => {
      const lowerLabel = item.label.toLowerCase();
      return !EXCLUDED_ITEMS.some(excluded => lowerLabel.includes(excluded));
    });
  };

  const classifyImage = async (imageAsset) => {
    try {
      setLoading(true);
      
      // Create a blob from the image URI
      const response = await fetch(imageAsset.uri);
      const imageBlob = await response.blob();
      
      // Initialize the Hugging Face inference client with the API key
      const inference = new InferenceClient(apiKey);
      
      // Use the Microsoft ResNet-50 model for image classification
      const result = await inference.imageClassification({
        data: imageBlob,
        model: "microsoft/resnet-50",
      });
      
      console.log('Classification result:', result);
      
      // Filter out excluded items
      const filteredResults = filterExcludedItems(result);
      setPrediction(filteredResults);
      
      // Detect dominant color
      const dominantColors = await extractDominantColor(imageAsset);
      setDominantColor(dominantColors);
      
      setLoading(false);
    } catch (err) {
      console.error('Error classifying image:', err);
      setError(`Failed to classify image: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  // Function to extract dominant color from image using backend
  const extractDominantColor = async (imageAsset) => {
    try {
      if (!imageAsset.base64) {
        console.error('No base64 data available for image');
        return null;
      }
      
      // We'll send the full image data without truncating
      // The backend will handle it properly
      const imageData = imageAsset.base64;
      console.log('Sending image data, length:', imageData.length);
      
      // Send the image to our backend for color analysis
      const response = await fetch('http://10.0.0.20:3000/api/analyze-color', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.dominantColors;
    } catch (err) {
      console.error('Error extracting color:', err);
      return null;
    }
  };

  // Function to render prediction results with selectable options
  const renderPredictionResults = () => {
    if (!prediction || prediction.length === 0) {
      return <Text style={styles.noResultsText}>No clothing items detected</Text>;
    }

    return (
      <View style={styles.predictionContainer}>
        <Text style={styles.predictionTitle}>Detected Items:</Text>
        {prediction.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.predictionItem, selectedClassification === item.label ? styles.selectedItem : null]}
            onPress={() => setSelectedClassification(item.label)}
          >
            <Text style={styles.predictionLabel}>{item.label}</Text>
            <Text style={styles.predictionScore}>{(item.score * 100).toFixed(1)}%</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderApiKeyInput = () => {
    if (!showApiKeyInput) return null;
    
    return (
      <View style={styles.apiKeyContainer}>
        <Text style={styles.apiKeyTitle}>Hugging Face API Key Required</Text>
        <Text style={styles.apiKeyDescription}>
          To use the clothing analyzer, you need to provide a Hugging Face API key.
          You can get one for free at huggingface.co.
        </Text>
        <TextInput
          style={styles.apiKeyInput}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter your Hugging Face API key"
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={styles.apiKeyButton} 
          onPress={async () => {
            const success = await saveApiKey();
            if (success) {
              Alert.alert('Success', 'API key saved successfully');
            }
          }}
        >
          <Text style={styles.apiKeyButtonText}>Save API Key</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const resetAnalysis = () => {
    setImage(null);
    setPrediction(null);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Clothing Analyzer</Text>
          <Text style={styles.subtitle}>
            Take a photo or select an image to identify the type of clothing
          </Text>
        </View>
        
        {renderApiKeyInput()}
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
            <CameraIcon color="white" size={32} style={styles.optionIcon} />
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
            <ImageIcon color="white" size={32} style={styles.optionIcon} />
            <Text style={styles.optionText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
        
        {image && (
          <View style={styles.resultContainer}>
            <Image source={{ uri: image }} style={styles.selectedImage} />
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#BE3E28" />
                <Text style={styles.loadingText}>Analyzing image...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.tryAgainButton} onPress={resetAnalysis}>
                  <Text style={styles.tryAgainText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {renderPredictionResults()}
                {dominantColor && dominantColor.length > 0 && (
                  <View style={styles.dominantColorContainer}>
                    <Text style={styles.dominantColorText}>Dominant Colors:</Text>
                    <View style={styles.colorDisplay}>
                      {dominantColor.map((color, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={[styles.colorSwatchContainer, selectedColor === color.hex ? styles.selectedColorContainer : null]}
                          onPress={() => setSelectedColor(color.hex)}
                        >
                          <View style={[styles.colorSwatch, { backgroundColor: color.hex }]} />
                          <Text style={styles.dominantColorValue}>
                            {color.hex} ({Math.round(color.score * 100)}%)
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                {(selectedClassification || selectedColor) && (
                  <View style={styles.selectionSummaryContainer}>
                    <Text style={styles.selectionSummaryTitle}>Your Selections:</Text>
                    {selectedClassification && (
                      <View style={styles.selectionItem}>
                        <Text style={styles.selectionLabel}>Item Type:</Text>
                        <Text style={styles.selectionValue}>{selectedClassification}</Text>
                      </View>
                    )}
                    {selectedColor && (
                      <View style={styles.selectionItem}>
                        <Text style={styles.selectionLabel}>Color:</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <View style={[styles.miniColorSwatch, { backgroundColor: selectedColor }]} />
                          <Text style={styles.selectionValue}>{selectedColor}</Text>
                        </View>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={() => {
                        Alert.alert(
                          'Confirm Selection',
                          `You selected:\n${selectedClassification ? `Item: ${selectedClassification}` : ''}${selectedClassification && selectedColor ? '\n' : ''}${selectedColor ? `Color: ${selectedColor}` : ''}`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Confirm', 
                              onPress: () => {
                                Alert.alert('Selection Saved', 'Your selection has been saved successfully!');
                                // Here you would typically save the selection or use it elsewhere
                              }
                            },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.confirmButtonText}>Confirm Selection</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity style={styles.newAnalysisButton} onPress={resetAnalysis}>
                  <Text style={styles.newAnalysisText}>Analyze Another Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Our AI-powered clothing analyzer identifies different types of clothing items in your images.
            Simply take a photo or upload an image of clothing, and our system will tell you what type of garment it is.
          </Text>
          <Text style={styles.infoText}>
            This helps you categorize your donations more accurately and ensures they go to the right recipients.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#2D5A27',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  optionButton: {
    backgroundColor: '#BE3E28',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  resultContainer: {
    padding: 20,
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  errorText: {
    color: '#BE3E28',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  tryAgainButton: {
    backgroundColor: '#2D5A27',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tryAgainText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  predictionContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#F7F7F7',
  },
  predictionLabel: {
    fontSize: 16,
    color: '#333',
  },
  predictionScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#BE3E28',
  },
  newAnalysisButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  newAnalysisText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  apiKeyContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  apiKeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 8,
  },
  apiKeyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  apiKeyInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  apiKeyButton: {
    backgroundColor: '#2D5A27',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  apiKeyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    padding: 20,
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  dominantColorContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  dominantColorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  colorDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorSwatchContainer: {
    marginRight: 10,
    marginBottom: 10,
  },
  selectedColorContainer: {
    backgroundColor: '#F7F7F7',
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dominantColorValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#BE3E28',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectionSummaryContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  selectionSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginBottom: 12,
  },
  selectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectionLabel: {
    fontSize: 16,
    color: '#333',
  },
  selectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#BE3E28',
  },
  miniColorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#2D5A27',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ImageClassifierScreen;
