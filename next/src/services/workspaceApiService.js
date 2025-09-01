// Workspace API Service - Handles all backend communication for workspace operations
const API_BASE_URL = 'http://localhost:8080/api';

export const workspaceApiService = {
  
  /**
   * Get authorization headers with Bearer token
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  },

  /**
   * Handle API response and errors
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  },

  // ==================== WORKSPACE OPERATIONS ====================
  
  /**
   * Get all workspace data for the authenticated user
   */
  async getAllWorkspaceData() {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/data`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching workspace data:', error);
      throw error;
    }
  },

  /**
   * Initialize workspace for new user
   */
  async initializeWorkspace() {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/initialize`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error initializing workspace:', error);
      throw error;
    }
  },

  // ==================== PROJECT OPERATIONS ====================

  /**
   * Get all projects for the authenticated user
   */
  async getAllProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  /**
   * Create a new project
   */
  async createProject(name) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  /**
   * Update a project
   */
  async updateProject(projectId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  /**
   * Update project order
   */
  async updateProjectOrder(projectIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects/reorder`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ projectIds }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating project order:', error);
      throw error;
    }
  },

  // ==================== PAGE OPERATIONS ====================

  /**
   * Get all pages for a project
   */
  async getAllPages(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}/pages`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching pages:', error);
      throw error;
    }
  },

  /**
   * Create a new page
   */
  async createPage(projectId, name) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}/pages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  },

  /**
   * Update a page
   */
  async updatePage(pageId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/pages/${pageId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating page:', error);
      throw error;
    }
  },

  /**
   * Delete a page
   */
  async deletePage(pageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/pages/${pageId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
  },

  /**
   * Update page order within a project
   */
  async updatePageOrder(projectId, pageIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}/pages/reorder`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pageIds }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating page order:', error);
      throw error;
    }
  },

  /**
   * Move page to different project
   */
  async movePageToProject(pageId, newProjectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/pages/${pageId}/move`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ newProjectId }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error moving page:', error);
      throw error;
    }
  },

  // ==================== TAB OPERATIONS ====================

  /**
   * Get all tabs for a page
   */
  async getAllTabs(pageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/pages/${pageId}/tabs`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching tabs:', error);
      throw error;
    }
  },

  /**
   * Create a new tab
   */
  async createTab(pageId, name, tabType, position = null) {
    try {
      const payload = { name, tabType };
      if (position !== null && position !== undefined) {
        payload.position = position;
      }
      
      const response = await fetch(`${API_BASE_URL}/workspace/pages/${pageId}/tabs`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating tab:', error);
      throw error;
    }
  },

  /**
   * Update a tab
   */
  async updateTab(tabId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating tab:', error);
      throw error;
    }
  },

  /**
   * Delete a tab
   */
  async deleteTab(tabId) {
    try {
      console.log('🌐 API: Starting DELETE request for tab:', tabId);
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      console.log('📡 API: DELETE response status:', response.status, 'for tab:', tabId);
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('🚨 API: Error deleting tab:', tabId, error);
      throw error;
    }
  },

  /**
   * Duplicate a tab
   */
  async duplicateTab(tabId, newName) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}/duplicate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ newName }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error duplicating tab:', error);
      throw error;
    }
  },

  /**
   * Update tab order within a page
   */
  async updateTabOrder(pageId, tabIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/pages/${pageId}/tabs/reorder`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ tabIds }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating tab order:', error);
      throw error;
    }
  },

  // ==================== TAB DATA OPERATIONS ====================

  /**
   * Get tab data
   */
  async getTabData(tabId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}/data`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching tab data:', error);
      throw error;
    }
  },

  /**
   * Update tab data (delta update)
   */
  async updateTabData(tabId, deltaData) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}/data`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ data: deltaData }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating tab data:', error);
      throw error;
    }
  },

  /**
   * Completely replace tab data (for clearing data)
   */
  async replaceTabData(tabId, newData) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}/data/replace`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ data: newData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error replacing tab data:', error);
      throw error;
    }
  },

  // ==================== ENCRYPTED TAB DATA OPERATIONS ====================

  /**
   * Validate user password for encryption operations
   */
  async validateUserPassword(userPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/validate-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userPassword }),
      });
      
      const result = await this.handleResponse(response);
      return result.valid;
    } catch (error) {
      console.error('Error validating user password:', error);
      throw error;
    }
  },

  /**
   * Get tab data with decryption for merging
   */
  async getTabDataForMerging(tabId, userPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}/data/decrypt?userPassword=${encodeURIComponent(userPassword)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching decrypted tab data:', error);
      throw error;
    }
  },

  /**
   * Update tab data with encryption (delta update)
   */
  async updateTabDataEncrypted(tabId, deltaData, userPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}/data/encrypted`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ data: deltaData, userPassword }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating encrypted tab data:', error);
      throw error;
    }
  },

  /**
   * Replace tab data with encryption
   */
  async replaceTabDataEncrypted(tabId, newData, userPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}/data/replace/encrypted`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ data: newData, userPassword }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error replacing encrypted tab data:', error);
      throw error;
    }
  },

  /**
   * Update only the active status of a tab (lightweight operation)
   */
  async updateActiveTab(tabId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/tabs/${tabId}/active`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // This endpoint returns empty response, so just return success
      return { success: true };
    } catch (error) {
      console.error('Error updating active tab:', error);
      throw error;
    }
  },

  // ==================== UTILITY METHODS ====================

  /**
   * Generate temporary ID for optimistic updates
   */
  generateTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Check if ID is temporary
   */
  isTempId(id) {
    return typeof id === 'string' && id.startsWith('temp_');
  },

  /**
   * Batch multiple operations (for future use)
   */
  async batchOperations(operations) {
    // For now, execute operations sequentially
    // In the future, this could be optimized with a batch API endpoint
    const results = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  },

  /**
   * Health check for the backend service
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/data`, {
        method: 'HEAD',
        headers: this.getAuthHeaders(),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  },

  // ==================== USER PREFERENCES ====================

  /**
   * Store user preference
   */
  async storeUserPreference(key, value) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/preferences`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error storing user preference:', error);
      throw error;
    }
  },

  /**
   * Get user preference
   */
  async getUserPreference(key) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/preferences/${key}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting user preference:', error);
      throw error;
    }
  },

  // ==================== ACTIVE STATE MANAGEMENT ====================

  /**
   * Update active project
   */
  async updateActiveProject(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}/active`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating active project:', error);
      throw error;
    }
  },

  /**
   * Update active page
   */
  async updateActivePage(pageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/pages/${pageId}/active`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating active page:', error);
      throw error;
    }
  },

  /**
   * Get last active state (project, page, tab)
   */
  async getLastActiveState() {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/active-state`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting last active state:', error);
      throw error;
    }
  },

  /**
   * Smart replace tab data - always uses encrypted methods
   */
  async replaceTabDataSmart(tabId, newData) {
    const storedPassword = sessionStorage.getItem('userPassword');
    if (storedPassword) {
      return await this.replaceTabDataEncrypted(tabId, newData, storedPassword);
    } else {
      throw new Error('Password required for data operations. Please log in again.');
    }
  },


}; 