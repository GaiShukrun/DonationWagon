import { useState, useCallback } from 'react';
import axios from 'axios';

// Base URL for API requests
const API_URL = 'http://10.0.0.7:3000'; // Your computer's actual IP address
// For physical devices, use your computer's actual local network IP address
// Example: const API_URL = 'http://192.168.1.100:3000';

/**
 * Custom hook for making API requests with automatic error handling
 * @returns {Object} API request methods and state
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Make a GET request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Axios config
   * @returns {Promise<any>} Response data
   */
  const get = useCallback(async (endpoint, config = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}${endpoint}`, config);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(errorMessage);
      console.log('API Error (GET):', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Make a POST request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} config - Axios config
   * @returns {Promise<any>} Response data
   */
  const post = useCallback(async (endpoint, data = {}, config = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, data, config);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(errorMessage);
      console.log('API Error (POST):', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear any existing error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    get,
    post
  };
};

export default useApi;
