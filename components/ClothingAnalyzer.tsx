import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { InferenceClient } from "@huggingface/inference";

interface ClothingAnalyzerProps {
  visible: boolean;
  onClose: () => void;
  onResults: (type: string, color: string) => void;
  imageUri?: string;
}

const ClothingAnalyzer = ({ visible, onClose, onResults, imageUri }: ClothingAnalyzerProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any[] | null>(null);
  const [dominantColors, setDominantColors] = useState<any[] | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // List of items to explicitly exclude from clothing results
  const EXCLUDED_ITEMS = [
    'sleeping bag', 'sleeping-bag', 'sleepingbag', 'bedding', 'blanket', 'quilt', 'comforter',
    'pillow', 'cushion', 'mattress', 'bed sheet', 'duvet',
    'bulletproof vest','ski mask','gas mask','gas helmet', 'bullet proof vest', 'bulletproof', 'bullet-proof vest', 'body armor', 'body armour', 'armor vest', 'armour vest'
  ];

  // Use the provided image URI when the component becomes visible
  useEffect(() => {
    if (visible && imageUri) {
      setImage(imageUri);
      analyzeImage(imageUri);
    }
  }, [visible, imageUri]);

  const analyzeImage = async (uri: string) => {
    if (!uri) {
      setError('No image selected');
      return;
    }

    setLoading(true);
    setError(null);
    setPrediction(null);
    setDominantColors(null);
    setSelectedClassification(null);
    setSelectedColor(null);

    try {
      // Get API key from backend
      const apiKeyResponse = await fetch('http://10.0.0.20:3000/api/config');
      const apiKeyData = await apiKeyResponse.json();
      const apiKey = apiKeyData.huggingFaceApiKey;

      if (!apiKey) {
        throw new Error('API key not available');
      }

      // Initialize the Hugging Face inference client with the API key
      const inference = new InferenceClient(apiKey);

      // Classify the image using Microsoft ResNet-50 model
      await classifyImage(uri, inference);
      
      // Extract dominant colors
      await extractDominantColors(uri);

      setLoading(false);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError('Failed to analyze image. Please try again.');
      setLoading(false);
    }
  };

  const classifyImage = async (imageUri: string, inference: InferenceClient) => {
    try {
      // Create a blob from the image URI
      const response = await fetch(imageUri);
      const imageBlob = await response.blob();
      
      // Use the Microsoft ResNet-50 model for image classification
      const result = await inference.imageClassification({
        data: imageBlob,
        model: "microsoft/resnet-50",
      });
      
      console.log('Classification result:', result);
      
      // Filter out excluded items
      const filteredResults = filterExcludedItems(result);
      setPrediction(filteredResults);
    } catch (err) {
      console.error('Error classifying image:', err);
      throw err;
    }
  };

  const filterExcludedItems = (results: any[]) => {
    return results.filter(item => {
      const label = item.label.toLowerCase();
      return !EXCLUDED_ITEMS.some(excluded => label.includes(excluded));
    });
  };

  const extractDominantColors = async (imageUri: string) => {
    try {
      // Send the image to our backend for color analysis
      const response = await fetch('http://10.0.0.20:3000/api/analyze-color', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUri
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDominantColors(data.dominantColors);
    } catch (err) {
      console.error('Error extracting color:', err);
      throw err;
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedClassification && !selectedColor) {
      Alert.alert('Selection Required', 'Please select at least one option from the classifications or colors.');
      return;
    }

    // Map the ResNet label to a more user-friendly clothing type
    let mappedType = '';
    if (selectedClassification) {
      // Convert ResNet labels to match the picker options in donation-details.tsx
      if (selectedClassification.toLowerCase().includes('t-shirt') || 
          selectedClassification.toLowerCase().includes('tshirt')) {
        mappedType = 't-shirt';
      } else if (selectedClassification.toLowerCase().includes('shirt')) {
        mappedType = 'shirt';
      } else if (selectedClassification.toLowerCase().includes('jean')) {
        mappedType = 'jeans';
      } else if (selectedClassification.toLowerCase().includes('pant') || 
                selectedClassification.toLowerCase().includes('trouser')) {
        mappedType = 'pants';
      } else if (selectedClassification.toLowerCase().includes('dress')) {
        mappedType = 'dress';
      } else if (selectedClassification.toLowerCase().includes('skirt')) {
        mappedType = 'skirt';
      } else if (selectedClassification.toLowerCase().includes('sweater') || 
                selectedClassification.toLowerCase().includes('jumper')) {
        mappedType = 'sweater';
      } else if (selectedClassification.toLowerCase().includes('jacket')) {
        mappedType = 'jacket';
      } else if (selectedClassification.toLowerCase().includes('coat')) {
        mappedType = 'coat';
      } else if (selectedClassification.toLowerCase().includes('sock')) {
        mappedType = 'socks';
      } else if (selectedClassification.toLowerCase().includes('underwear')) {
        mappedType = 'underwear';
      } else if (selectedClassification.toLowerCase().includes('pajama')) {
        mappedType = 'pajamas';
      } else {
        mappedType = 'other';
      }
    }

    // Extract just the hex code from the selected color
    let colorHex = '';
    if (selectedColor) {
      colorHex = selectedColor;
    }

    onResults(mappedType, colorHex);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>AI Clothing Analyzer</Text>
        </View>

        <ScrollView style={styles.content}>
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
            </View>
          ) : (
            <View style={styles.uploadContainer}>
              <Text style={styles.uploadText}>No image selected</Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2D5A27" />
              <Text style={styles.loadingText}>Analyzing your clothing item...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {prediction && prediction.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Clothing Type:</Text>
              {prediction.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.resultItem, selectedClassification === item.label ? styles.selectedItem : null]}
                  onPress={() => setSelectedClassification(item.label)}
                >
                  <Text style={styles.resultLabel}>{item.label}</Text>
                  <Text style={styles.resultScore}>{(item.score * 100).toFixed(1)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {dominantColors && dominantColors.length > 0 && (
            <View style={styles.colorsContainer}>
              <Text style={styles.resultsTitle}>Dominant Colors:</Text>
              <View style={styles.colorDisplay}>
                {dominantColors.map((color, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.colorSwatchContainer, selectedColor === color.hex ? styles.selectedColorContainer : null]}
                    onPress={() => setSelectedColor(color.hex)}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: color.hex }]} />
                    <Text style={styles.colorValue}>
                      {color.hex} ({Math.round(color.score * 100)}%)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {(prediction || dominantColors) && !loading && (
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
                onPress={handleConfirmSelection}
              >
                <Text style={styles.confirmButtonText}>Apply to Form</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF2E9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#2D5A27',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#c62828',
  },
  resultsContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2D5A27',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#F7F7F7',
  },
  resultLabel: {
    fontSize: 16,
    color: '#333',
  },
  resultScore: {
    fontSize: 16,
    color: '#BE3E28',
  },
  colorsContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  colorDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorSwatchContainer: {
    marginRight: 10,
    marginBottom: 10,
    padding: 8,
    borderRadius: 8,
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
    marginBottom: 4,
  },
  colorValue: {
    fontSize: 12,
    color: '#333',
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

export default ClothingAnalyzer;
