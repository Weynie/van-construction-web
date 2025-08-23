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
  async loadWorkspaceData() {
    try {
      this.notifyListeners({ type: 'LOADING_WORKSPACE' });
      
      const workspaceData = await workspaceApiService.getAllWorkspaceData();
      
      // Process and merge tab data with templates
      const processedData = await this.processWorkspaceData(workspaceData);
      
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
  async processWorkspaceData(workspaceData) {
    const { projects } = workspaceData;
    
    console.log('🏗️ Processing workspace data...', workspaceData);
    
    if (!projects || !Array.isArray(projects)) {
      return { projects: [] };
    }

    // Process each project and its nested data
    const processedProjects = await Promise.all(
      projects.map(async (project, projectIndex) => {
        console.log(`📁 Processing project ${projectIndex}: ${project.name}`);
        
        const processedPages = await Promise.all(
          (project.pages || []).map(async (page, pageIndex) => {
            console.log(`📄 Processing page ${projectIndex}-${pageIndex}: ${page.name}`);
            
            const processedTabs = await Promise.all(
              (page.tabs || []).map(async (tab, tabIndex) => {
                console.log(`🏷️ Processing tab ${projectIndex}-${pageIndex}-${tabIndex}: ${tab.name} (${tab.tabType || tab.type})`);
                
                try {
                  // Merge tab data with template
                  const mergedData = await this.mergeTabDataWithTemplate(tab);
                  console.log(`✅ Successfully processed tab ${tab.name}`);
                  
                  return {
                    ...tab,
                    locked: tab.isLocked, // Map backend isLocked to frontend locked for UI compatibility
                    mergedData
                  };
                } catch (error) {
                  console.error(`❌ Error processing tab ${tab.name}:`, error);
                  return {
                    ...tab,
                    mergedData: null
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

    console.log('🎉 Workspace data processing completed');
    return { projects: processedProjects };
  },

  /**
   * Merge tab data with its template
   */
  async mergeTabDataWithTemplate(tab) {
    try {
      console.log(`🔄 Merging tab data for: ${tab.name} (${tab.tabType})`);
      
      // Get delta data from backend
      const tabDataResponse = await workspaceApiService.getTabData(tab.id);
      const deltaData = tabDataResponse.data || {};
      
      console.log(`📄 Delta data for ${tab.name}:`, deltaData);
      
      // Merge with template
      const mergedData = tabTemplateService.mergeWithTemplate(tab.tabType, deltaData);
      
      console.log(`✅ Merged data for ${tab.name}:`, mergedData);
      
      return mergedData;
    } catch (error) {
      console.error(`❌ Error merging tab data for tab ${tab.id}:`, error);
      // Return template defaults if merge fails
      return tabTemplateService.getTemplate(tab.tabType);
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
    
    // Optimistic update
    this.notifyListeners({
      type: 'TAB_DELETED_OPTIMISTIC',
      tabId: realId
    });

    try {
      await workspaceApiService.deleteTab(realId);
      
      this.notifyListeners({
        type: 'TAB_DELETED',
        tabId: realId
      });
    } catch (error) {
      // Rollback optimistic update
      this.notifyListeners({
        type: 'TAB_DELETE_FAILED',
        tabId: realId,
        error: error.message
      });
      throw error;
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
   * Debounced tab data update
   */
  debouncedUpdateTabData: debounce(async (tabId, deltaData, resolve, reject) => {
    try {
      const realId = workspaceStateService.getRealId(tabId);
      await workspaceApiService.updateTabData(realId, deltaData);
      
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
   * Update tab data with debounced save
   */
  async updateTabData(tabId, tabType, newData) {
    const realId = this.getRealId(tabId);
    
    // Extract delta from template
    const deltaData = tabTemplateService.extractDelta(tabType, newData);
    
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
   * Force immediate save of tab data
   */
  async saveTabDataImmediately(tabId, tabType, data) {
    const realId = this.getRealId(tabId);
    
    // Debug: log the input data
    console.log('🔍 saveTabDataImmediately input data:', data);
    
    const deltaData = tabTemplateService.extractDelta(tabType, data);
    
    // Debug: log the extracted delta
    console.log('🔍 saveTabDataImmediately extracted delta:', deltaData);
    
    try {
      await workspaceApiService.updateTabData(realId, deltaData);
      
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
  }
}; 