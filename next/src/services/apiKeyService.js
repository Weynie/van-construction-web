// API Key Management Service
const API_BASE_URL = 'http://localhost:8080/api';

export const apiKeyService = {
  /**
   * Store API key for user
   */
  async storeApiKey(userId, apiKey, userPassword, rememberKey) {
    try {
      const requestBody = {
        apiKey,
        userPassword,
        rememberKey
      };
      
      const response = await fetch(`${API_BASE_URL}/user/${userId}/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error storing API key:', error);
      throw error;
    }
  },

  /**
   * Get stored API key for user
   */
  async getApiKey(userId, userPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/api-key?userPassword=${encodeURIComponent(userPassword)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrieving API key:', error);
      throw error;
    }
  },

  /**
   * Delete stored API key for user
   */
  async deleteApiKey(userId, userPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/api-key`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  },

  /**
   * Check if user has stored API key
   */
  async getApiKeyStatus(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/api-key/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Status check error response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking API key status:', error);
      throw error;
    }
  }
}; 