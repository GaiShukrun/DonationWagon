import { useState, useCallback } from 'react';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

// Base URL for API requests
const API_URL = 'http://10.0.0.10:3000'; // Using the same IP as in useApi.js

/**
 * Custom hook for uploading files to the API
 * @returns {Object} API upload methods and state
 */
export const useApiUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Upload a file to the API
   * @param {string} endpoint - API endpoint
   * @param {string} fileUri - Local URI of the file to upload
   * @param {Object} additionalData - Additional form data to include
   * @returns {Promise<any>} Response data
   */
  const uploadFile = useCallback(async (endpoint, fileUri, additionalData = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('==== STARTING FILE UPLOAD PROCESS ====');
      console.log(`Preparing to upload file to: ${API_URL}${endpoint}`);
      console.log('File URI:', fileUri);
      console.log('Additional data:', additionalData);
      
      // Create form data
      const formData = new FormData();
      
      // Get file info
      console.log('Getting file info...');
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('File info:', {
        exists: fileInfo.exists,
        size: fileInfo.size,
        uri: fileInfo.uri,
        isDirectory: fileInfo.isDirectory
      });
      
      if (!fileInfo.exists) {
        console.error('File does not exist at path:', fileUri);
        throw new Error('File does not exist');
      }
      
      // Get file name from URI
      const fileName = fileUri.split('/').pop();
      console.log('Extracted filename:', fileName);
      
      // Get file type
      let fileType = 'image/jpeg'; // Default to JPEG
      if (fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        console.log('File extension:', extension);
        if (extension === 'png') fileType = 'image/png';
        else if (extension === 'gif') fileType = 'image/gif';
        else if (extension === 'webp') fileType = 'image/webp';
      }
      console.log('Determined file type:', fileType);
      
      // Append file to form data
      console.log('Creating form data with file...');
      
      // Handle file URI differently based on platform
      // For Expo, we need to use the fileUri directly
      formData.append('image', {
        uri: fileUri,
        name: fileName || 'upload.jpg',
        type: fileType,
      });
      console.log('File appended to form data');
      
      // Append additional data
      console.log('Adding additional data to form data...');
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
        console.log(`Added ${key}:`, additionalData[key]);
      });
      
      // Upload file
      console.log('Sending HTTP request to upload file...');
      console.log('Request URL:', `${API_URL}${endpoint}`);
      console.log('Request headers:', { 'Content-Type': 'multipart/form-data' });
      
      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      
      console.log('Upload successful! Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('==== FILE UPLOAD COMPLETED ====');
      
      // Add success flag to the response data
      return { ...response.data, success: true };
    } catch (err) {
      console.error('==== FILE UPLOAD ERROR ====');
      let errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      let userFriendlyMessage = 'Failed to upload file. Please try again.';
      
      // Log detailed error information
      console.error('API Upload Error:', errorMessage);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error stack:', err.stack);
      
      // Detect specific error types and provide user-friendly messages
      if (err.message === 'Network Error') {
        console.error('Network error detected. This could be due to:');
        console.error('1. Server not running or not accessible');
        console.error('2. CORS issues');
        console.error('3. Invalid API URL:', `${API_URL}${endpoint}`);
        console.error('4. File too large or format not supported');
        
        // Check file size
        if (fileInfo && fileInfo.size) {
          const fileSizeMB = fileInfo.size / (1024 * 1024);
          console.log('File size:', fileSizeMB.toFixed(2), 'MB');
          
          if (fileSizeMB > 5) {
            userFriendlyMessage = `Image is too large (${fileSizeMB.toFixed(1)}MB). Please select a smaller image under 5MB.`;
          } else {
            userFriendlyMessage = 'Network error. Please check your connection and try again.';
          }
        } else {
          userFriendlyMessage = 'Network error. Please check your connection and try again.';
        }
      } else if (err.response?.status === 413) {
        userFriendlyMessage = 'Image is too large. Please select a smaller image.';
      } else if (err.response?.status === 415) {
        userFriendlyMessage = 'Unsupported file format. Please use JPEG or PNG images only.';
      } else if (err.response?.status === 401) {
        userFriendlyMessage = 'You need to sign in again to upload images.';
      }
      
      setError(userFriendlyMessage);
      return { success: false, error: userFriendlyMessage, technicalError: errorMessage };
    } finally {
      setLoading(false);
      console.log('Upload process finished, loading state set to false');
    }
  }, []);

  return {
    loading,
    error,
    uploadFile,
  };
};

export default useApiUpload;
