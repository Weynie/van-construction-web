// Workspace State Service - Manages frontend state synchronization and persistence
import { workspaceApiService } from './workspaceApiService';
import { tabTemplateService } from './tabTemplateService';

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const workspaceStateService = {
  
  // State management
  listeners: new Set(),
  idMappings: new Map(), // Maps temp IDs to real IDs
  pendingChanges: new Map(), // Tracks pending tab data changes
  optimisticOperations: new Map(), // Tracks optimistic updates for rollback
  
  /**
   * Register a state change listener
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  /**
   * Notify all listeners of state change
   */
  notifyListeners(change) {
    this.listeners.forEach(listener => {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  },

  /**
   * Generate temporary ID for optimistic updates
   */
  generateTempId() {
    return workspaceApiService.generateTempId();
  },

  /**
   * Map temporary ID to real ID
   */
  mapTempId(tempId, realId) {
    this.idMappings.set(tempId, realId);
    this.notifyListeners({
      type: 'ID_MAPPED',
      tempId,
      realId
    });
  },

  /**
   * Get real ID from temp ID or return original ID
   */
  getRealId(id) {
    return this.idMappings.get(id) || id;
  },

  /**
   * Check if ID is temporary
   */
  isTempId(id) {
    return workspaceApiService.isTempId(id);
  },

  // ==================== WORKSPACE OPERATIONS ====================

  /**
   * Load complete workspace data and initialize state
   */
  async loadWorkspaceData(userPassword = null) {
    try {
      this.notifyListeners({ type: 'LOADING_WORKSPACE' });
      
      const workspaceData = await workspaceApiService.getAllWorkspaceData();
      
      // Process and merge tab data with templates, including automatic decryption
      const processedData = await this.processWorkspaceData(workspaceData, userPassword);
      
      this.notifyListeners({
        type: 'WORKSPACE_LOADED',
        data: processedData
      });
      
      return processedData;
    } catch (error) {
      console.error('Error loading workspace data:', error);
      this.notifyListeners({
        type: 'WORKSPACE_ERROR',
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Process workspace data and merge templates with delta data
   */
  async processWorkspaceData(workspaceData, userPassword = null) {
    const { projects } = workspaceData;
    
    console.log('Processing workspace data...', workspaceData);
    
    if (!projects || !Array.isArray(projects)) {
      return { projects: [] };
    }

    // Process each project and its nested data
    const processedProjects = await Promise.all(
      projects.map(async (project, projectIndex) => {
        console.log(`📁 Processing project ${projectIndex}: ${project.name}`);
        
        const processedPages = await Promise.all(
          (project.pages || []).map(async (page, pageIndex) => {
            console.log(`Processing page ${projectIndex}-${pageIndex}: ${page.name}`);
            
            const processedTabs = await Promise.all(
              (page.tabs || []).map(async (tab, tabIndex) => {
                console.log(`Processing tab ${projectIndex}-${pageIndex}-${tabIndex}: ${tab.name} (${tab.tabType || tab.type})`);
                
                try {
                  // Check if tab has encrypted data first
                  const tabDataResponse = await workspaceApiService.getTabData(tab.id);
                  
                  if (tabDataResponse && tabDataResponse.isEncrypted) {
                    console.log(`Tab ${tab.name} has encrypted data, attempting automatic decryption`);
                    
                    if (userPassword) {
                      try {
                        // Use encrypted merge method with provided password
                        const mergedData = await this.mergeTabDataWithTemplateEncrypted(tab, userPassword);
                        console.log(`Successfully decrypted and processed tab ${tab.name}`);
                        
                        return {
                          ...tab,
                          locked: tab.isLocked,
                          mergedData: mergedData.mergedData,
                          isEncrypted: true,
                          needsPassword: false
                        };
                      } catch (decryptError) {
                        console.warn(`Failed to decrypt tab ${tab.name}:`, decryptError.message);
                        // Fall back to template defaults if decryption fails
                        const templateData = tabTemplateService.getTemplate(tab.tabType || tab.type);
                        return {
                          ...tab,
                          locked: tab.isLocked,
                          mergedData: templateData,
                          isEncrypted: true,
                          needsPassword: true
                        };
                      }
                    } else {
                      console.log(`Tab ${tab.name} is encrypted but no password provided`);
                      // Return template defaults if no password available
                      const templateData = tabTemplateService.getTemplate(tab.tabType || tab.type);
                      return {
                        ...tab,
                        locked: tab.isLocked,
                        mergedData: templateData,
                        isEncrypted: true,
                        needsPassword: true
                      };
                    }
                  } else {
                    // Regular unencrypted data processing
                    const mergedData = await this.mergeTabDataWithTemplate(tab);
                    console.log(`Successfully processed tab ${tab.name}`);
                    
                    return {
                      ...tab,
                      locked: tab.isLocked,
                      mergedData,
                      isEncrypted: false,
                      needsPassword: false
                    };
                  }
                } catch (error) {
                  console.error(`Error processing tab ${tab.name}:`, error);
                  return {
                    ...tab,
                    mergedData: null,
                    isEncrypted: false,
                    needsPassword: false
                  };
                }
              })
            );
            
            return {
              ...page,
              tabs: processedTabs
            };
          })
        );
        
        return {
          ...project,
          pages: processedPages
        };
      })
    );

    console.log('Workspace data processing completed');
    return { projects: processedProjects };
  },

  /**
   * Merge tab data with its template
   */
  async mergeTabDataWithTemplate(tab) {
    try {
      console.log(`Merging tab data for: ${tab.name} (${tab.tabType})`);
      
      // Get delta data from backend
      const tabDataResponse = await workspaceApiService.getTabData(tab.id);
      const deltaData = tabDataResponse.data || {};
      
      console.log(`Delta data for ${tab.name}:`, deltaData);
      
      // Merge with template
      const mergedData = tabTemplateService.mergeWithTemplate(tab.tabType, deltaData);
      
      console.log(`Merged data for ${tab.name}:`, mergedData);
      
      return mergedData;
    } catch (error) {
      console.error(`Error merging tab data for tab ${tab.id}:`, error);
      // Return template defaults if merge fails
      return tabTemplateService.getTemplate(tab.tabType);
    }
  },

  /**
   * Enhanced merge method that can handle encrypted data with password
   */
  async mergeTabDataWithTemplateEncrypted(tab, userPassword = null) {
    try {
      console.log(`Merging tab data (with encryption support) for: ${tab.name} (${tab.tabType})`);
      
      // Get delta data from backend - first try regular method
      let tabDataResponse = await workspaceApiService.getTabData(tab.id);
      let deltaData = tabDataResponse.data;
      
      // Check if data is encrypted
      if (tabDataResponse.isEncrypted && userPassword) {
        console.log(`Tab data is encrypted, attempting decryption...`);
        try {
          // Get decrypted data for merging
          const decryptedResponse = await workspaceApiService.getTabDataForMerging(tab.id, userPassword);
          deltaData = decryptedResponse.data || {};
          console.log(`Successfully decrypted data for ${tab.name}`);
        } catch (error) {
          console.warn(`Failed to decrypt data for ${tab.name}:`, error.message);
          // Fall back to template defaults if decryption fails
          deltaData = {};
        }
      } else if (tabDataResponse.isEncrypted && !userPassword) {
        console.log(`Tab data is encrypted but no password provided, using template defaults`);
        deltaData = {};
      } else {
        deltaData = deltaData || {};
      }
      
      console.log(`Delta data for ${tab.name}:`, deltaData);
      
      // Merge with template
      const mergedData = tabTemplateService.mergeWithTemplate(tab.tabType, deltaData);
      
      console.log(`Merged data for ${tab.name}:`, mergedData);
      
      return {
        mergedData,
        isEncrypted: tabDataResponse.isEncrypted || false,
        needsPassword: tabDataResponse.isEncrypted && !userPassword
      };
    } catch (error) {
      console.error(`Error merging tab data for tab ${tab.id}:`, error);
      // Return template defaults if merge fails
      return {
        mergedData: tabTemplateService.getTemplate(tab.tabType),
        isEncrypted: false,
        needsPassword: false
      };
    }
  },

  /**
   * Initialize workspace for new user
   */
  async initializeWorkspace() {
    try {
      await workspaceApiService.initializeWorkspace();
      return await this.loadWorkspaceData();
    } catch (error) {
      console.error('Error initializing workspace:', error);
      throw error;
    }
  },

  // ==================== PROJECT OPERATIONS ====================

  /**
   * Create project with optimistic update
   */
  async createProject(name) {
    const tempId = this.generateTempId();
    const tempProject = {
      id: tempId,
      name,
      displayOrder: 0,
      isExpanded: false,
      pages: [],
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    this.notifyListeners({
      type: 'PROJECT_CREATED_OPTIMISTIC',
      project: tempProject
    });

    try {
      const realProject = await workspaceApiService.createProject(name);
      this.mapTempId(tempId, realProject.id);
      
      this.notifyListeners({
        type: 'PROJECT_CREATED',
        project: realProject,
        tempId
      });
      
      return realProject;
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'PROJECT_CREATE_FAILED',
        tempId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Update project
   */
  async updateProject(projectId, updates) {
    const realId = this.getRealId(projectId);
    
    // Optimistic update
    this.notifyListeners({
      type: 'PROJECT_UPDATED_OPTIMISTIC',
      projectId: realId,
      updates
    });

    try {
      const updatedProject = await workspaceApiService.updateProject(realId, updates);
      
      this.notifyListeners({
        type: 'PROJECT_UPDATED',
        project: updatedProject
      });
      
      return updatedProject;
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'PROJECT_UPDATE_FAILED',
        projectId: realId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    const realId = this.getRealId(projectId);
    
    // Optimistic update
    this.notifyListeners({
      type: 'PROJECT_DELETED_OPTIMISTIC',
      projectId: realId
    });

    try {
      await workspaceApiService.deleteProject(realId);
      
      this.notifyListeners({
        type: 'PROJECT_DELETED',
        projectId: realId
      });
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'PROJECT_DELETE_FAILED',
        projectId: realId,
        error: error.message
      });
      throw error;
    }
  },

  // ==================== PAGE OPERATIONS ====================

  /**
   * Create page with optimistic update
   */
  async createPage(projectId, name) {
    const realProjectId = this.getRealId(projectId);
    const tempId = this.generateTempId();
    const tempPage = {
      id: tempId,
      projectId: realProjectId,
      name,
      displayOrder: 0,
      tabs: [],
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    this.notifyListeners({
      type: 'PAGE_CREATED_OPTIMISTIC',
      page: tempPage
    });

    try {
      const realPage = await workspaceApiService.createPage(realProjectId, name);
      this.mapTempId(tempId, realPage.id);
      
      this.notifyListeners({
        type: 'PAGE_CREATED',
        page: realPage,
        tempId
      });
      
      return realPage;
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'PAGE_CREATE_FAILED',
        tempId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Update page with optimistic update
   */
  async updatePage(pageId, updates) {
    const realId = this.getRealId(pageId);
    
    // Optimistic update
    this.notifyListeners({
      type: 'PAGE_UPDATED_OPTIMISTIC',
      pageId: realId,
      updates
    });

    try {
      const updatedPage = await workspaceApiService.updatePage(realId, updates);
      
      this.notifyListeners({
        type: 'PAGE_UPDATED',
        page: updatedPage
      });
      
      return updatedPage;
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'PAGE_UPDATE_FAILED',
        pageId: realId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Delete page
   */
  async deletePage(pageId) {
    const realId = this.getRealId(pageId);
    
    // Optimistic update
    this.notifyListeners({
      type: 'PAGE_DELETED_OPTIMISTIC',
      pageId: realId
    });

    try {
      await workspaceApiService.deletePage(realId);
      
      this.notifyListeners({
        type: 'PAGE_DELETED',
        pageId: realId
      });
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'PAGE_DELETE_FAILED',
        pageId: realId,
        error: error.message
      });
      throw error;
    }
  },

  // ==================== TAB OPERATIONS ====================

  /**
   * Create tab with optimistic update
   */
  async createTab(pageId, name, tabType, position = null) {
    const realPageId = this.getRealId(pageId);
    const tempId = this.generateTempId();
    
    // Get template data for the tab
    const templateData = tabTemplateService.getTemplate(tabType);
    
    const tempTab = {
      id: tempId,
      pageId: realPageId,
      name,
      tabType,
      displayOrder: position || 0,
      isActive: true,
      isLocked: false,
      mergedData: templateData,
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    this.notifyListeners({
      type: 'TAB_CREATED_OPTIMISTIC',
      tab: tempTab
    });

    try {
      const realTab = await workspaceApiService.createTab(realPageId, name, tabType, position);
      this.mapTempId(tempId, realTab.id);
      
      // Merge with template data
      const mergedData = await this.mergeTabDataWithTemplate(realTab);
      
      this.notifyListeners({
        type: 'TAB_CREATED',
        tab: { ...realTab, mergedData },
        tempId
      });
      
      return realTab;
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'TAB_CREATE_FAILED',
        tempId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Update tab
   */
  async updateTab(tabId, updates) {
    const realId = this.getRealId(tabId);
    
    // Optimistic update
    this.notifyListeners({
      type: 'TAB_UPDATED_OPTIMISTIC',
      tabId: realId,
      updates
    });

    try {
      const updatedTab = await workspaceApiService.updateTab(realId, updates);
      
      // If tab type changed, merge with new template
      let mergedData = null;
      if (updates.tabType) {
        mergedData = await this.mergeTabDataWithTemplate(updatedTab);
      }
      
      this.notifyListeners({
        type: 'TAB_UPDATED',
        tab: updatedTab,
        mergedData
      });
      
      return updatedTab;
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'TAB_UPDATE_FAILED',
        tabId: realId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Delete tab
   */
  async deleteTab(tabId) {
    const realId = this.getRealId(tabId);
    console.log('StateService: deleteTab called for:', realId);
    
    // Check if this tab is already being deleted
    if (this.pendingChanges.has(`delete_${realId}`)) {
              console.warn('Tab deletion already in progress:', realId);
      return;
    }
    
    // Mark this tab as being deleted
    this.pendingChanges.set(`delete_${realId}`, true);
    console.log('StateService: Marked tab for deletion:', realId);
    
    // Optimistic update
    this.notifyListeners({
      type: 'TAB_DELETED_OPTIMISTIC',
      tabId: realId
    });
          console.log('StateService: Sent TAB_DELETED_OPTIMISTIC for:', realId);

    try {
      await workspaceApiService.deleteTab(realId);
      console.log('StateService: API deletion successful for:', realId);
      
      this.notifyListeners({
        type: 'TAB_DELETED',
        tabId: realId
      });
      console.log('StateService: Sent TAB_DELETED for:', realId);
    } catch (error) {
      console.log('StateService: API deletion failed for:', realId, error.message);
      // Rollback optimistic update only if it's not a "Tab not found" error
      if (!error.message.includes('Tab not found')) {
        console.log('StateService: Rolling back optimistic update for:', realId);
        this.notifyListeners({
          type: 'TAB_DELETE_FAILED',
          tabId: realId,
          error: error.message
        });
        throw error;
      } else {
        // Tab not found is OK - it might have been deleted already
        console.warn('StateService: Tab already deleted (graceful):', realId);
        this.notifyListeners({
          type: 'TAB_DELETED',
          tabId: realId
        });
      }
    } finally {
      // Clean up the pending deletion flag
      this.pendingChanges.delete(`delete_${realId}`);
      console.log('StateService: Cleaned up pending deletion for:', realId);
    }
  },

  // ==================== ORDER OPERATIONS ====================

  /**
   * Update project order
   */
  async updateProjectOrder(projectIds) {
    try {
      await workspaceApiService.updateProjectOrder(projectIds);
      
      this.notifyListeners({
        type: 'PROJECT_ORDER_UPDATED',
        projectIds
      });
      
    } catch (error) {
      console.error('Error updating project order:', error);
      throw error;
    }
  },

  /**
   * Update page order within a project
   */
  async updatePageOrder(projectId, pageIds) {
    try {
      await workspaceApiService.updatePageOrder(projectId, pageIds);
      
      this.notifyListeners({
        type: 'PAGE_ORDER_UPDATED',
        projectId,
        pageIds
      });
      
    } catch (error) {
      console.error('Error updating page order:', error);
      throw error;
    }
  },

  /**
   * Update tab order within a page
   */
  async updateTabOrder(pageId, tabIds) {
    try {
      await workspaceApiService.updateTabOrder(pageId, tabIds);
      
      this.notifyListeners({
        type: 'TAB_ORDER_UPDATED',
        pageId,
        tabIds
      });
      
    } catch (error) {
      console.error('Error updating tab order:', error);
      throw error;
    }
  },

  // ==================== TAB DATA OPERATIONS ====================

  /**
   * Debounced tab data update (encrypted)
   */
  debouncedUpdateTabData: debounce(async (tabId, deltaData, resolve, reject) => {
    try {
      const realId = workspaceStateService.getRealId(tabId);
      const storedPassword = sessionStorage.getItem('userPassword');
      if (storedPassword) {
        await workspaceApiService.updateTabDataEncrypted(realId, deltaData, storedPassword);
      } else {
        throw new Error('Password required for data operations. Please log in again.');
      }
      
      workspaceStateService.notifyListeners({
        type: 'TAB_DATA_SAVED',
        tabId: realId
      });
      
      resolve();
    } catch (error) {
      workspaceStateService.notifyListeners({
        type: 'TAB_DATA_SAVE_FAILED',
        tabId,
        error: error.message
      });
      
      reject(error);
    }
  }, 1000),

  /**
   * Update tab data with debounced save (encrypted)
   */
  async updateTabData(tabId, tabType, newData) {
    const realId = this.getRealId(tabId);
    
    // For incremental updates, newData is already the delta (only changed fields)
    // No need to extract delta again - frontend sends only what changed
    const deltaData = newData;
    
    // Optimistic update
    this.notifyListeners({
      type: 'TAB_DATA_UPDATED_OPTIMISTIC',
      tabId: realId,
      data: newData
    });

    // Schedule debounced save
    return new Promise((resolve, reject) => {
      this.debouncedUpdateTabData(realId, deltaData, resolve, reject);
    });
  },

  /**
   * Force immediate save of tab data (encrypted)
   */
  async saveTabDataImmediately(tabId, tabType, data) {
    const realId = this.getRealId(tabId);
    
    const deltaData = tabTemplateService.extractDelta(tabType, data);
    
    try {
      const storedPassword = sessionStorage.getItem('userPassword');
      if (storedPassword) {
        await workspaceApiService.updateTabDataEncrypted(realId, deltaData, storedPassword);
      } else {
        throw new Error('Password required for data operations. Please log in again.');
      }
      
      this.notifyListeners({
        type: 'TAB_DATA_SAVED',
        tabId: realId
      });
    } catch (error) {
      this.notifyListeners({
        type: 'TAB_DATA_SAVE_FAILED',
        tabId: realId,
        error: error.message
      });
      throw error;
    }
  },

  // ==================== ENCRYPTED TAB DATA OPERATIONS ====================

  /**
   * Update tab data with encryption
   */
  async updateTabDataEncrypted(tabId, tabType, newData, userPassword) {
    const realId = this.getRealId(tabId);
    
    // For incremental updates, newData is already the delta (only changed fields)
    // No need to extract delta again - frontend sends only what changed
    const deltaData = newData;
    
    // Optimistic update
    this.notifyListeners({
      type: 'TAB_DATA_UPDATED_OPTIMISTIC',
      tabId: realId,
      data: newData
    });

    try {
      await workspaceApiService.updateTabDataEncrypted(realId, deltaData, userPassword);
      
      this.notifyListeners({
        type: 'TAB_DATA_SAVED',
        tabId: realId
      });
    } catch (error) {
      this.notifyListeners({
        type: 'TAB_DATA_SAVE_FAILED',
        tabId: realId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Save tab data with encryption immediately
   */
  async saveTabDataEncryptedImmediately(tabId, tabType, data, userPassword) {
    const realId = this.getRealId(tabId);
    
    console.log('saveTabDataEncryptedImmediately input data:', data);
    
    const deltaData = tabTemplateService.extractDelta(tabType, data);
    
          console.log('saveTabDataEncryptedImmediately extracted delta:', deltaData);
    
    try {
      await workspaceApiService.updateTabDataEncrypted(realId, deltaData, userPassword);
      
      this.notifyListeners({
        type: 'TAB_DATA_SAVED',
        tabId: realId
      });
    } catch (error) {
      this.notifyListeners({
        type: 'TAB_DATA_SAVE_FAILED',
        tabId: realId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Get tab data with decryption for merging
   */
  async getTabDataForMerging(tabId, userPassword) {
    const realId = this.getRealId(tabId);
    
    try {
      const tabData = await workspaceApiService.getTabDataForMerging(realId, userPassword);
      return tabData;
    } catch (error) {
      console.error('Error getting decrypted tab data:', error);
      throw error;
    }
  },

  /**
   * Validate user password
   */
  async validateUserPassword(userPassword) {
    try {
      return await workspaceApiService.validateUserPassword(userPassword);
    } catch (error) {
      console.error('Error validating password:', error);
      throw error;
    }
  },

  /**
   * Replace tab data with encryption
   */
  async replaceTabDataEncrypted(tabId, newData, userPassword) {
    const realId = this.getRealId(tabId);
    
    try {
      await workspaceApiService.replaceTabDataEncrypted(realId, newData, userPassword);
      
      this.notifyListeners({
        type: 'TAB_DATA_REPLACED',
        tabId: realId,
        data: newData
      });
    } catch (error) {
      this.notifyListeners({
        type: 'TAB_DATA_SAVE_FAILED',
        tabId: realId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Smart replace tab data - automatically handles encrypted and unencrypted data
   */
  async replaceTabDataSmart(tabId, newData) {
    const realId = this.getRealId(tabId);
    
    try {
      await workspaceApiService.replaceTabDataSmart(realId, newData);
      
      this.notifyListeners({
        type: 'TAB_DATA_REPLACED',
        tabId: realId,
        data: newData
      });
    } catch (error) {
      this.notifyListeners({
        type: 'TAB_DATA_SAVE_FAILED',
        tabId: realId,
        error: error.message
      });
      throw error;
    }
  },

  // ==================== UTILITY METHODS ====================

  /**
   * Show toast notification
   */
  showNotification(message, type = 'info') {
    this.notifyListeners({
      type: 'NOTIFICATION',
      message,
      notificationType: type
    });
  },

  /**
   * Clear all temporary state
   */
  clearState() {
    this.idMappings.clear();
    this.pendingChanges.clear();
    this.optimisticOperations.clear();
  },

  /**
   * Get workspace health status
   */
  async checkHealth() {
    try {
      const isHealthy = await workspaceApiService.checkHealth();
      
      this.notifyListeners({
        type: 'HEALTH_CHECK',
        isHealthy
      });
      
      return isHealthy;
    } catch (error) {
      this.notifyListeners({
        type: 'HEALTH_CHECK',
        isHealthy: false,
        error: error.message
      });
      
      return false;
    }
  },

  // ==================== ACTIVE STATE MANAGEMENT ====================

  /**
   * Update active project and persist to backend
   */
  async updateActiveProject(projectId) {
    try {
      await workspaceApiService.updateActiveProject(projectId);
    } catch (error) {
      console.error('Error updating active project:', error);
      throw error;
    }
  },

  /**
   * Update active page and persist to backend
   */
  async updateActivePage(pageId) {
    try {
      await workspaceApiService.updateActivePage(pageId);
    } catch (error) {
      console.error('Error updating active page:', error);
      throw error;
    }
  },

  /**
   * Get last active state from backend
   */
  async getLastActiveState() {
    try {
      const activeState = await workspaceApiService.getLastActiveState();
      return activeState;
    } catch (error) {
      console.error('Error getting last active state:', error);
      throw error;
    }
  },

  /**
   * Restore active state from backend data
   */
  async restoreActiveState(workspaceData) {
    try {
      const activeState = await this.getLastActiveState();
      
      // Find active project, page, and tab from workspace data
      let activeProject = null;
      let activePage = null;
      let activeTab = null;
      
      if (activeState.activeProjectId && workspaceData.projects) {
        activeProject = workspaceData.projects.find(p => p.id === activeState.activeProjectId);
        
        if (activeProject && activeState.activePageId && activeProject.pages) {
          activePage = activeProject.pages.find(p => p.id === activeState.activePageId);
          
          if (activePage && activeState.activeTabId && activePage.tabs) {
            activeTab = activePage.tabs.find(t => t.id === activeState.activeTabId);
          }
        }
      }
      
      const restoredState = {
        activeProject,
        activePage,
        activeTab,
        activeState
      };
      
      return restoredState;
    } catch (error) {
      console.error('Error restoring active state:', error);
      throw error;
    }
  }

}; 