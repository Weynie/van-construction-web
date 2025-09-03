const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ThemePreferenceService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Update user's theme preference
   * @param {number} userId - User ID
   * @param {string} themePreference - Theme preference ("light", "dark", or "system")
   * @returns {Promise<Object>} Response from server
   */
  async updateThemePreference(userId, themePreference) {
    try {
      const response = await fetch(`${this.baseUrl}/preferences/${userId}/theme`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ themePreference }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating theme preference:', error);
      throw error;
    }
  }

  /**
   * Get user's theme preference
   * @param {number} userId - User ID
   * @returns {Promise<string>} Theme preference
   */
  async getThemePreference(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/preferences/${userId}/theme`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);
      return data.themePreference;
    } catch (error) {
      console.error('Error getting theme preference:', error);
      throw error;
    }
  }

  /**
   * Save theme preference to localStorage as fallback
   * @param {string} themePreference - Theme preference
   */
  saveThemeToLocalStorage(themePreference) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-preference', themePreference);
    }
  }

  /**
   * Get theme preference from localStorage as fallback
   * @returns {string} Theme preference or "system" as default
   */
  getThemeFromLocalStorage() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme-preference') || 'system';
    }
    return 'system';
  }
}

export const themePreferenceService = new ThemePreferenceService(); 