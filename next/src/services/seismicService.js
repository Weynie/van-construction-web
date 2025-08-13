// Seismic Data Service
const FLASK_API_BASE_URL = 'http://localhost:5001/api';

export const seismicService = {
  /**
   * Get seismic information for a given address
   */
  async getSeismicInfo(address, apiKey, soilTable) {
    try {
      const response = await fetch(`${FLASK_API_BASE_URL}/seismic-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          api_key: apiKey,
          soil_table: soilTable
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching seismic info:', error);
      throw error;
    }
  },

  /**
   * Check if Flask backend is healthy
   */
  async checkHealth() {
    try {
      const response = await fetch('http://localhost:5001/health');
      return response.ok;
    } catch (error) {
      console.error('Flask backend health check failed:', error);
      return false;
    }
  }
}; 