'use client';  // Important: enable client-side hooks in App Router

import { useState, useRef, useEffect, useCallback } from 'react';
import { apiKeyService } from '../services/apiKeyService';
import { userService } from '../services/userService';
import { workspaceStateService } from '../services/workspaceStateService';
import { tabTemplateService } from '../services/tabTemplateService';
import { workspaceApiService } from '../services/workspaceApiService';
import ApiKeyInput from '../components/ApiKeyInput';

// Add CSS for hiding scrollbars
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [isHovered, setIsHovered] = useState(false);
  
  // Focus states for floating labels
  const [focus, setFocus] = useState({ username: false, email: false, password: false, confirmPassword: false });
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // New state for the welcome page
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = w-64
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  
  // Drag and drop state for tabs
  const [draggedTab, setDraggedTab] = useState(null);
  const [dragOverTab, setDragOverTab] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Drag and drop state for projects and pages
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);
  const [draggedPage, setDraggedPage] = useState(null);
  const [dragOverPage, setDragOverPage] = useState(null);
  const [isDraggingProject, setIsDraggingProject] = useState(false);
  const [isDraggingPage, setIsDraggingPage] = useState(false);
  
  // Tab scroll state
  const [tabScrollLeft, setTabScrollLeft] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const tabContainerRef = useRef(null);
  
  

  
  const [projects, setProjects] = useState([]);
  const [selectedPage, setSelectedPage] = useState({ projectId: null, pageId: null });
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '', itemId: null });
  const [editingItem, setEditingItem] = useState({ type: '', id: null, name: '' });
  
  // Copy/Cut and paste state for tabs
  const [clipboard, setClipboard] = useState({ type: null, data: null }); // 'copy' or 'cut'

  // Add state for seismic template fields per tab
  const [seismicTabData, setSeismicTabData] = useState({});

  // Add state for sediment types data
  const [sedimentTypes, setSedimentTypes] = useState([]);
  const [loadingSediments, setLoadingSediments] = useState(false);
  const [seismicFormError, setSeismicFormError] = useState('');
  const [showSeismicValidationError, setShowSeismicValidationError] = useState(false);

  // Add state for Flask API results per tab
  const [seismicResults, setSeismicResults] = useState({});

  // API Key management state
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState(null);
  const [showApiKeySecurityInfo, setShowApiKeySecurityInfo] = useState(false);
  const [showSecurityInfoModal, setShowSecurityInfoModal] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [apiKeySuccess, setApiKeySuccess] = useState('');
  const [rememberApiKey, setRememberApiKey] = useState(false);
  const [dontShowStorePrompt, setDontShowStorePrompt] = useState(false);
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'
  
  // Settings modal state
  const [selectedSettingCategory, setSelectedSettingCategory] = useState('general');
  
  // API key decryption modal state for seismic template
  const [showSeismicDecryptModal, setShowSeismicDecryptModal] = useState(false);
  const [seismicDecryptPassword, setSeismicDecryptPassword] = useState('');
  const [seismicDecryptError, setSeismicDecryptError] = useState('');
  const [seismicDecryptLoading, setSeismicDecryptLoading] = useState(false);
  const [pendingSeismicData, setPendingSeismicData] = useState(null);
  

  
  // Language dropdown state
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Auto-detect');
  
  // Workspace state management
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(null);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuthentication = async () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userId');
        if (token && storedUserId) {
          const userId = parseInt(storedUserId);
          setIsAuthenticated(true);
          setUserId(userId);
          
          // Fetch user profile data
          try {
            const profile = await userService.getUserProfile(userId);
            setUsername(profile.username);
            
            // Initialize workspace after successful authentication
            await initializeWorkspace();
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // If profile fetch fails, user might not be authenticated anymore
            // Clear authentication state
            setIsAuthenticated(false);
            setUserId(null);
            setUsername('');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
          }
        }
      }
    };
    
    checkAuthentication();
  }, []);

  // Initialize workspace data
  const initializeWorkspace = async () => {
    try {
      console.log('🚀 Starting workspace initialization...');
      setWorkspaceLoading(true);
      setWorkspaceError(null);
      
      const workspaceData = await workspaceStateService.loadWorkspaceData();
      console.log('📊 Loaded workspace data:', workspaceData);
      
      if (workspaceData.projects && workspaceData.projects.length > 0) {
        console.log('✅ Setting projects:', workspaceData.projects.length, 'projects');
        setProjects(workspaceData.projects);
        
        // Find the first project and page to set as selected
        const firstProject = workspaceData.projects[0];
        if (firstProject && firstProject.pages && firstProject.pages.length > 0) {
          const firstPage = firstProject.pages[0];
          setSelectedPage({ projectId: firstProject.id, pageId: firstPage.id });
        }
      } else {
        console.log('📝 No existing projects, initializing default workspace...');
        // Initialize workspace with default structure
        await workspaceStateService.initializeWorkspace();
        // Reload data after initialization
        const initializedData = await workspaceStateService.loadWorkspaceData();
        console.log('✅ Setting initialized projects:', initializedData.projects);
        setProjects(initializedData.projects);
        
        if (initializedData.projects && initializedData.projects.length > 0) {
          const firstProject = initializedData.projects[0];
          if (firstProject && firstProject.pages && firstProject.pages.length > 0) {
            const firstPage = firstProject.pages[0];
            setSelectedPage({ projectId: firstProject.id, pageId: firstPage.id });
          }
        }
      }
      
      setWorkspaceLoaded(true);
      console.log('🎉 Workspace initialization completed!');
    } catch (error) {
      console.error('❌ Error initializing workspace:', error);
      setWorkspaceError(error.message);
      showToastNotification('Failed to load workspace: ' + error.message, 'error');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // Workspace state listener
  useEffect(() => {
    const unsubscribe = workspaceStateService.addListener((change) => {
      switch (change.type) {
        case 'PROJECT_CREATED_OPTIMISTIC':
          setProjects(prev => [...prev, change.project]);
          break;
          
        case 'PROJECT_CREATED':
          setProjects(prev => prev.map(p => 
            p.id === change.tempId ? change.project : p
          ));
          break;
          
        case 'PROJECT_CREATE_FAILED':
          setProjects(prev => prev.filter(p => p.id !== change.tempId));
          showToastNotification('Failed to create project: ' + change.error, 'error');
          break;
          
        case 'PROJECT_UPDATED_OPTIMISTIC':
          setProjects(prev => prev.map(p => {
            if (p.id === change.projectId) {
              // Preserve nested data (pages, tabs) during optimistic update
              return { 
                ...p, 
                ...change.updates,
                pages: p.pages  // Explicitly preserve the existing pages array
              };
            }
            return p;
          }));
          break;
          
        case 'PROJECT_UPDATED':
          setProjects(prev => prev.map(p => {
            if (p.id === change.project.id) {
              // Preserve nested data (pages, tabs) when updating project properties
              return { 
                ...p, 
                ...change.project,
                pages: p.pages  // Explicitly preserve the existing pages array
              };
            }
            return p;
          }));
          break;
          
        case 'PROJECT_DELETED':
          setProjects(prev => prev.filter(p => p.id !== change.projectId));
          // Update selected page if the deleted project was selected
          if (selectedPage.projectId === change.projectId) {
            const remainingProjects = projects.filter(p => p.id !== change.projectId);
            if (remainingProjects.length > 0) {
              const firstProject = remainingProjects[0];
              if (firstProject.pages && firstProject.pages.length > 0) {
                setSelectedPage({ projectId: firstProject.id, pageId: firstProject.pages[0].id });
              }
            } else {
              setSelectedPage({ projectId: null, pageId: null });
            }
          }
          break;
          
        case 'PAGE_CREATED_OPTIMISTIC':
          setProjects(prev => prev.map(project => 
            project.id === change.page.projectId 
              ? { ...project, pages: [...(project.pages || []), change.page] }
              : project
          ));
          break;
          
        case 'PAGE_CREATED':
          setProjects(prev => prev.map(project => 
            project.id === change.page.projectId 
              ? { 
                  ...project, 
                  pages: (project.pages || []).map(p => 
                    p.id === change.tempId ? change.page : p
                  )
                }
              : project
          ));
          break;
          
        case 'PAGE_UPDATED_OPTIMISTIC':
          setProjects(prev => prev.map(project => ({
            ...project,
            pages: (project.pages || []).map(page => 
              page.id === change.pageId 
                ? { ...page, ...change.updates }
                : page
            )
          })));
          break;
          
        case 'PAGE_UPDATED':
          setProjects(prev => prev.map(project => ({
            ...project,
            pages: (project.pages || []).map(page => 
              page.id === change.page.id 
                ? { ...page, ...change.page }
                : page
            )
          })));
          break;
          
        case 'TAB_CREATED_OPTIMISTIC':
          setProjects(prev => prev.map(project => ({
            ...project,
            pages: (project.pages || []).map(page => 
              page.id === change.tab.pageId 
                ? { ...page, tabs: [...(page.tabs || []), change.tab] }
                : page
            )
          })));
          break;
          
        case 'TAB_CREATED':
          setProjects(prev => prev.map(project => ({
            ...project,
            pages: (project.pages || []).map(page => 
              page.id === change.tab.pageId 
                ? { 
                    ...page, 
                    tabs: (page.tabs || []).map(t => 
                      t.id === change.tempId ? change.tab : t
                    )
                  }
                : page
            )
          })));
          break;
          
        case 'TAB_UPDATED_OPTIMISTIC':
          console.log('🔄 TAB_UPDATED_OPTIMISTIC:', change.tabId, 'updates:', change.updates);
          setProjects(prev => prev.map(project => ({
            ...project,
            pages: (project.pages || []).map(page => ({
              ...page,
              tabs: (page.tabs || []).map(tab => {
                if (tab.id === change.tabId) {
                  console.log('📝 Before update:', { name: tab.name, mergedData: !!tab.mergedData });
                  const updatedTab = { ...tab, ...change.updates };
                  console.log('📝 After update:', { name: updatedTab.name, mergedData: !!updatedTab.mergedData });
                  return updatedTab;
                }
                return tab;
              })
            }))
          })));
          break;
          
        case 'TAB_UPDATED':
          setProjects(prev => prev.map(project => ({
            ...project,
            pages: (project.pages || []).map(page => ({
              ...page,
              tabs: (page.tabs || []).map(tab => 
                tab.id === change.tab.id 
                  ? { 
                      ...tab, 
                      ...change.tab, 
                      locked: change.tab.isLocked, // Map backend isLocked to frontend locked
                      mergedData: change.mergedData 
                    }
                  : tab
              )
            }))
          })));
          break;

        case 'TAB_DATA_UPDATED_OPTIMISTIC':
          setProjects(prev => prev.map(project => ({
            ...project,
            pages: (project.pages || []).map(page => ({
              ...page,
              tabs: (page.tabs || []).map(tab => 
                tab.id === change.tabId 
                  ? { ...tab, mergedData: change.data }
                  : tab
              )
            }))
          })));
          break;
          
        case 'NOTIFICATION':
          showToastNotification(change.message, change.notificationType);
          break;
          
        default:
          // Handle other state changes as needed
          break;
      }
    });
    
    return unsubscribe;
  }, [selectedPage, projects]);
  
  // Settings dropdown state
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showDeleteApiKeyModal, setShowDeleteApiKeyModal] = useState(false);
  const [deleteApiKeyPassword, setDeleteApiKeyPassword] = useState('');
  
  // API key storage state
  const [currentUserPassword, setCurrentUserPassword] = useState('');
  const [showStoreApiKeyModal, setShowStoreApiKeyModal] = useState(false);

  // Add state for Snow Load and Wind Load data
  const [snowLoadData, setSnowLoadData] = useState([]);
  const [windLoadData, setWindLoadData] = useState([]);
  const [loadingSnowData, setLoadingSnowData] = useState(false);
  
  // Add state for tab dropdown menu
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  
  // Add state for dropdown drag and drop
  const [dropdownDraggedTab, setDropdownDraggedTab] = useState(null);
  const [dropdownDragOverTab, setDropdownDragOverTab] = useState(null);
  const [isDropdownDragging, setIsDropdownDragging] = useState(false);
  const [loadingWindData, setLoadingWindData] = useState(false);
  const [snowLoadError, setSnowLoadError] = useState('');
  const [windLoadError, setWindLoadError] = useState('');

  // Add state for tab-specific Snow Load inputs
  const [snowLoadTabData, setSnowLoadTabData] = useState({});

  // Add state for tab-specific Wind Load inputs
  const [windLoadTabData, setWindLoadTabData] = useState({});

  // Helper function to generate unique names with numbering
  const generateUniqueName = (baseName, existingNames, isCopy = false) => {
    if (isCopy) {
      // For copied items, use "Copy", "Copy 2", "Copy 3" format
      const copyPattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+Copy(?:\\s+(\\d+))?$`);
      const existingCopies = existingNames.filter(name => copyPattern.test(name));
      
      if (existingCopies.length === 0) {
        return `${baseName} Copy`;
      }
      
      // Find the highest number used
      let maxNumber = 0;
      existingCopies.forEach(name => {
        const match = name.match(copyPattern);
        if (match[1]) {
          maxNumber = Math.max(maxNumber, parseInt(match[1]));
        } else {
          maxNumber = Math.max(maxNumber, 1); // "Copy" without number is considered as 1
        }
      });
      
      return maxNumber === 1 ? `${baseName} Copy 2` : `${baseName} Copy ${maxNumber + 1}`;
    } else {
      // For new items, use "1", "2", "3" format
      if (!existingNames.includes(baseName)) {
        return baseName;
      }
      
      let counter = 1;
      let newName = `${baseName} ${counter}`;
      
      while (existingNames.includes(newName)) {
        counter++;
        newName = `${baseName} ${counter}`;
      }
      
      return newName;
    }
  };

  // Helper function to handle duplicate names when moving items
  const handleDuplicateName = (originalName, existingNames) => {
    if (!existingNames.includes(originalName)) {
      return originalName;
    }
    
    let counter = 1;
    let newName = `${originalName} ${counter}`;
    
    while (existingNames.includes(newName)) {
      counter++;
      newName = `${originalName} ${counter}`;
    }
    
    return newName;
  };

  // Unified function to extract base name from any copied item
  const extractBaseName = (name) => {
    // Remove all "Copy" patterns and clean up
    return name
      .replace(/\s*\(Copy\)\s*\(Copy\)\s*$/, '')  // Remove double (Copy) (Copy)
      .replace(/\s*\(Copy\)\s*$/, '')             // Remove single (Copy)
      .replace(/\s*Copy\s*\d+\s*$/, '')           // Remove Copy N
      .replace(/\s*Copy\s*$/, '')                 // Remove Copy
      .trim();
  };

  // Unified copy function for all item types
  const createCopy = (originalName, existingNames) => {
    const baseName = extractBaseName(originalName);
    return generateUniqueName(baseName, existingNames, true);
  };

  // Helper function to get all existing names of a specific type
  const getExistingNames = (type, projectId = null, pageId = null) => {
    switch (type) {
      case 'project':
        return projects.map(p => p.name);
      case 'page':
        if (projectId) {
          const project = projects.find(p => p.id === projectId);
          return project ? project.pages.map(p => p.name) : [];
        }
        return [];
      case 'tab':
        if (projectId && pageId) {
          const project = projects.find(p => p.id === projectId);
          const page = project?.pages.find(p => p.id === pageId);
          return page ? page.tabs.map(t => t.name) : [];
        }
        return [];
      default:
        return [];
    }
  };

  // Add fetchSedimentTypes function
  const fetchSedimentTypes = async () => {
    setLoadingSediments(true);
    setSeismicFormError("");
    try {
      const res = await fetch("http://localhost:8080/api/sediment-types");
      if (!res.ok) throw new Error("Failed to fetch sediment types");
      const data = await res.json();
      setSedimentTypes(data);
    } catch (err) {
      setSeismicFormError("Error fetching sediment types from backend.");
      setSedimentTypes([]);
    } finally {
      setLoadingSediments(false);
    }
  };

  // Add function to fetch Snow Load data
  const fetchSnowLoadData = async () => {
    setLoadingSnowData(true);
    setSnowLoadError("");
    try {
      const res = await fetch("http://localhost:8080/api/snow-load-values");
      if (!res.ok) throw new Error("Failed to fetch snow load data");
      const data = await res.json();
      setSnowLoadData(data);
    } catch (err) {
      setSnowLoadError("Error fetching snow load data from backend.");
      setSnowLoadData([]);
    } finally {
      setLoadingSnowData(false);
    }
  };

  // Add function to fetch Wind Load data
  const fetchWindLoadData = async () => {
    setLoadingWindData(true);
    setWindLoadError("");
    try {
      const res = await fetch("http://localhost:8080/api/wind-load-values");
      if (!res.ok) throw new Error("Failed to fetch wind load data");
      const data = await res.json();
      setWindLoadData(data);
    } catch (err) {
      setWindLoadError("Error fetching wind load data from backend.");
      setWindLoadData([]);
    } finally {
      setLoadingWindData(false);
    }
  };

  // Move these above the useEffect that uses them, and use useCallback for stable references
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 500) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Drag and drop handlers for tabs
  const handleTabDragStart = useCallback((e, tabId) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId.toString());
  }, []);

  const handleTabDragOver = useCallback((e, tabId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTab !== tabId) {
      setDragOverTab(tabId);
    }
  }, [draggedTab]);

  const handleTabDragEnter = useCallback((e, tabId) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedTab !== tabId) {
      setDragOverTab(tabId);
    }
  }, [draggedTab]);

  const handleTabDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTab(null);
  }, []);

  const handleTabDrop = useCallback(async (e, targetTabId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedTab && draggedTab !== targetTabId) {
      const { projectId, pageId } = selectedPage;
      let reorderedTabIds = null;
      
      const updatedProjects = projects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            pages: project.pages.map(page => {
              if (page.id === pageId) {
                const tabs = [...page.tabs];
                const draggedIndex = tabs.findIndex(tab => tab.id === draggedTab);
                const targetIndex = tabs.findIndex(tab => tab.id === targetTabId);
                
                if (draggedIndex !== -1 && targetIndex !== -1) {
                  const [draggedTabItem] = tabs.splice(draggedIndex, 1);
                  tabs.splice(targetIndex, 0, draggedTabItem);
                  
                  // Store the new order for database save
                  reorderedTabIds = tabs.map(tab => tab.id);
                }
                
                return {
                  ...page,
                  tabs
                };
              }
              return page;
            })
          };
        }
        return project;
      });
      
      setProjects(updatedProjects);
      
      // Save new tab order to database (outside of map function)
      if (reorderedTabIds) {
        try {
          await workspaceStateService.updateTabOrder(pageId, reorderedTabIds);
        } catch (error) {
          console.error('Error saving tab order:', error);
          showToastNotification('Failed to save tab order: ' + error.message, 'error');
        }
      }
    }
    setIsDragging(false);
    setDraggedTab(null);
    setDragOverTab(null);
  }, [draggedTab, selectedPage, projects]);

  const handleTabDragEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDraggedTab(null);
    setDragOverTab(null);
  }, []);

  // Project drag and drop handlers
  const handleProjectDragStart = useCallback((e, projectId) => {
    e.stopPropagation();
    setIsDraggingProject(true);
    setDraggedProject(projectId);
  }, []);

  const handleProjectDragOver = useCallback((e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedProject && draggedProject !== projectId) {
      setDragOverProject(projectId);
    }
  }, [draggedProject]);

  const handleProjectDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverProject(null);
  }, []);

  const handleProjectDrop = useCallback(async (e, targetProjectId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedProject && draggedProject !== targetProjectId) {
      const updatedProjects = [...projects];
      const draggedIndex = updatedProjects.findIndex(p => p.id === draggedProject);
      const targetIndex = updatedProjects.findIndex(p => p.id === targetProjectId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedProjectItem] = updatedProjects.splice(draggedIndex, 1);
        updatedProjects.splice(targetIndex, 0, draggedProjectItem);
        setProjects(updatedProjects);
        
        // Save new project order to database
        const projectIds = updatedProjects.map(p => p.id);
        try {
          await workspaceStateService.updateProjectOrder(projectIds);
        } catch (error) {
          console.error('Error saving project order:', error);
          showToastNotification('Failed to save project order: ' + error.message, 'error');
        }
      }
    }
    setIsDraggingProject(false);
    setDraggedProject(null);
    setDragOverProject(null);
  }, [draggedProject, projects]);

  const handleProjectDragEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingProject(false);
    setDraggedProject(null);
    setDragOverProject(null);
  }, []);

  // Page drag and drop handlers
  const handlePageDragStart = useCallback((e, projectId, pageId) => {
    e.stopPropagation();
    setIsDraggingPage(true);
    setDraggedPage({ projectId, pageId });
  }, []);

  const handlePageDragOver = useCallback((e, projectId, pageId) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedPage && (draggedPage.projectId !== projectId || draggedPage.pageId !== pageId)) {
      setDragOverPage({ projectId, pageId });
    }
  }, [draggedPage]);

  const handlePageDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPage(null);
  }, []);

  const handlePageDrop = useCallback(async (e, targetProjectId, targetPageId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedPage && (draggedPage.projectId !== targetProjectId || draggedPage.pageId !== targetPageId)) {
      const updatedProjects = [...projects];
      const sourceProject = updatedProjects.find(p => p.id === draggedPage.projectId);
      const targetProject = updatedProjects.find(p => p.id === targetProjectId);
      
      if (sourceProject && targetProject) {
        const sourcePageIndex = sourceProject.pages.findIndex(p => p.id === draggedPage.pageId);
        
        if (sourcePageIndex !== -1) {
          // Remove page from source project
          const [draggedPageItem] = sourceProject.pages.splice(sourcePageIndex, 1);
          
          // Check for duplicate names in target project
          const existingPageNames = targetProject.pages.map(p => p.name);
          const originalPageName = draggedPageItem.name;
          
          // Handle potential name conflicts (both within same project and across projects)
          const newPageName = handleDuplicateName(originalPageName, existingPageNames);
          if (newPageName !== originalPageName) {
            // Update the page name
            draggedPageItem.name = newPageName;
          }
          
          // Determine target position based on targetPageId
          let targetPageIndex = 0;
          
          if (targetPageId === 'empty' || targetPageId === 'end') {
            // Add to end of target project
            targetPageIndex = targetProject.pages ? targetProject.pages.length : 0;
          } else if (typeof targetPageId === 'string' && targetPageId.startsWith('between-')) {
            // Add between pages - find the page after the "between" indicator
            const afterPageId = targetPageId.replace('between-', '');
            const afterPageIndex = targetProject.pages ? targetProject.pages.findIndex(p => p.id === parseInt(afterPageId)) : -1;
            targetPageIndex = afterPageIndex !== -1 ? afterPageIndex : (targetProject.pages ? targetProject.pages.length : 0);
          } else {
            // Regular page drop - find the target page
            const actualTargetPageIndex = targetProject.pages ? targetProject.pages.findIndex(p => p.id === parseInt(targetPageId)) : -1;
            targetPageIndex = actualTargetPageIndex !== -1 ? actualTargetPageIndex : (targetProject.pages ? targetProject.pages.length : 0);
          }
          
          // Initialize pages array if it doesn't exist
          if (!targetProject.pages) {
            targetProject.pages = [];
          }
          
          // Add page to target project at the target position
          targetProject.pages.splice(targetPageIndex, 0, draggedPageItem);
          
          setProjects(updatedProjects);
          
          // Update selected page if it was the dragged page
          if (selectedPage.projectId === draggedPage.projectId && selectedPage.pageId === draggedPage.pageId) {
            setSelectedPage({ projectId: targetProjectId, pageId: draggedPage.pageId });
          }
          
          // Save new page order to database
          try {
            // Update order for target project
            const targetPageIds = targetProject.pages.map(p => p.id);
            await workspaceStateService.updatePageOrder(targetProjectId, targetPageIds);
            
            // If page moved between projects, also update source project order
            if (draggedPage.projectId !== targetProjectId) {
              const sourcePageIds = sourceProject.pages.map(p => p.id);
              await workspaceStateService.updatePageOrder(draggedPage.projectId, sourcePageIds);
            }
          } catch (error) {
            console.error('Error saving page order:', error);
            showToastNotification('Failed to save page order: ' + error.message, 'error');
          }
          
          // No toast notification needed for page rename
        }
      }
    }
    setIsDraggingPage(false);
    setDraggedPage(null);
    setDragOverPage(null);
  }, [draggedPage, projects, selectedPage]);

  const handlePageDragEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPage(false);
    setDraggedPage(null);
    setDragOverPage(null);
  }, []);

  // Copy/Cut and paste functions for tabs
  const copyTabToClipboard = useCallback(async (tabId, isCut = false) => {
    const { projectId, pageId } = selectedPage;
    const project = projects.find(p => p.id === projectId);
    const page = project?.pages.find(p => p.id === pageId);
    const tab = page?.tabs.find(t => t.id === tabId);
    
    if (tab) {
      // Collect all tab-specific data including merged data
      const originalTabKey = `${projectId}_${pageId}_${tabId}`;
      const tabData = {
        seismicData: seismicTabData[originalTabKey] || null,
        seismicResults: seismicResults[originalTabKey] || null,
        snowLoadData: snowLoadTabData[originalTabKey] || null,
        windLoadData: windLoadTabData[originalTabKey] || null,
        mergedData: tab.mergedData || null  // Include the complete merged data
      };
      
      const clipboardData = {
        type: isCut ? 'cut' : 'copy',
        data: {
          tab: { ...tab },
          tabData: tabData,
          sourceProjectId: projectId,
          sourcePageId: pageId,
          sourceTabId: tabId
        }
      };
      setClipboard(clipboardData);
      console.log('✅ Tab copied to clipboard:', { 
        operation: isCut ? 'cut' : 'copy', 
        tabName: tab.name, 
        hasData: !!tabData.mergedData,
        clipboardSet: true 
      });
      
      // If it's a cut operation, remove the tab from source (but keep in clipboard)
      if (isCut) {
        // For cut, we'll remove from UI but NOT delete from backend yet
        // The backend deletion will happen only when paste is completed
        const updatedProjects = projects.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              pages: p.pages.map(pg => {
                if (pg.id === pageId) {
                  const updatedTabs = pg.tabs.filter(t => t.id !== tabId);
                  // Ensure at least one tab remains
                  if (updatedTabs.length === 0) {
                    updatedTabs.push({
                      id: Date.now(),
                      name: 'Welcome',
                      type: 'Welcome',
                      active: true
                    });
                  }
                  return { ...pg, tabs: updatedTabs };
                }
                return pg;
              })
            };
          }
          return p;
        });
        setProjects(updatedProjects);
        console.log('✅ Tab removed from UI for cut operation (keeping data intact):', tabId);
      }
    }
  }, [projects, selectedPage]);

  const pasteTabFromClipboard = useCallback(async (targetProjectId, targetPageId) => {
    console.log('🔄 Attempting to paste tab from clipboard:', { 
      hasClipboard: !!clipboard.data, 
      clipboardType: clipboard.type,
      targetProjectId,
      targetPageId 
    });
    if (!clipboard.data || clipboard.type === null) {
      console.log('❌ No clipboard data available');
      return;
    }
    
    const { tab, tabData, sourceProjectId, sourcePageId, sourceTabId } = clipboard.data;
    
    // For cut operations, we don't need to check for same tab since the original was removed
    // For copy operations, we now allow pasting to the same page (but not to the exact same tab)
    // This check is removed to allow same-page copying
    
    // Check for duplicate names
    const targetPage = projects.find(p => p.id === targetProjectId)?.pages?.find(pg => pg.id === targetPageId);
    if (!targetPage) return;
    
    const existingTabNames = targetPage.tabs.map(t => t.name);
    let newTabName = tab.name;
    
    // For copy operations, add "Copy" suffix to make it clear it's a copy
    if (clipboard.type === 'copy') {
      newTabName = createCopy(tab.name, existingTabNames);
    } else if (existingTabNames.includes(newTabName)) {
      // For cut operations, only modify name if there's a conflict
      let counter = 1;
      while (existingTabNames.includes(`${newTabName} ${counter}`)) {
        counter++;
      }
      newTabName = `${newTabName} ${counter}`;
    }
    
    if (clipboard.type === 'cut') {
      // For cut operation: Delete original first, then create new with preserved data
      try {
        console.log('🔄 Starting cut/paste operation for tab:', tab.id, 'name:', tab.name);
        
        // Step 1: Delete the original tab from backend to avoid name conflicts
        await workspaceStateService.deleteTab(tab.id);
        console.log('✅ Original tab deleted from backend:', tab.id);
        
        // Step 2: Wait a moment to ensure deletion is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 3: Create new tab in target location with potentially same name
        console.log('🔄 Creating new tab with name:', newTabName, 'type:', tab.tabType || tab.type);
        // For paste to page, add to the end
        const targetPage = projects.find(p => p.id === targetProjectId)?.pages?.find(pg => pg.id === targetPageId);
        const position = targetPage?.tabs?.length || 0;
        const movedTab = await workspaceApiService.createTab(targetPageId, newTabName, tab.tabType || tab.type, position);
        console.log('✅ New tab created in target location:', movedTab.id);
        
        // Step 4: Restore the original data to the new tab
        if (tabData && tabData.mergedData) {
          await workspaceApiService.replaceTabData(movedTab.id, tabData.mergedData);
          console.log('✅ Original data restored to new tab');
        }
        
        // Step 5: Update local state with moved tab
        const updatedProjects = projects.map(p => {
          if (p.id === targetProjectId) {
            return {
              ...p,
              pages: p.pages.map(pg => {
                if (pg.id === targetPageId) {
                  const newTab = {
                    ...movedTab,
                    name: newTabName,
                    active: true,
                    isActive: true,
                    mergedData: tabData?.mergedData  // Preserve the original data
                  };
                  
                  // Set all other tabs as inactive and the new tab as active
                  const updatedTabs = pg.tabs.map(t => ({ ...t, active: false, isActive: false })).concat(newTab);
                  return {
                    ...pg,
                    tabs: updatedTabs
                  };
                }
                return pg;
              })
            };
          }
          return p;
        });
        
        setProjects(updatedProjects);
        console.log('✅ Tab moved successfully (cut/paste):', newTabName);
        showToastNotification(`Tab "${newTabName}" moved successfully`, 'success');
      } catch (error) {
        console.error('❌ Failed to move tab:', error);
        showToastNotification('Failed to move tab: ' + error.message, 'error');
      }
    } else {
      // For copy operation: Create new tab (existing logic)
      try {
        // For paste to page, add to the end
        const targetPage = projects.find(p => p.id === targetProjectId)?.pages?.find(pg => pg.id === targetPageId);
        const position = targetPage?.tabs?.length || 0;
        const createdTab = await workspaceApiService.createTab(targetPageId, newTabName, tab.tabType || tab.type, position);
        
        // Copy the tab data if it exists in the clipboard
        if (tabData && tabData.mergedData) {
          await workspaceApiService.replaceTabData(createdTab.id, tabData.mergedData);
        }
        
        // Update local state with the new tab
        const updatedProjects = projects.map(p => {
          if (p.id === targetProjectId) {
            return {
              ...p,
              pages: p.pages.map(pg => {
                if (pg.id === targetPageId) {
                  const newTab = {
                    ...createdTab,
                    name: newTabName,
                    active: true,
                    isActive: true,  // Make the new tab active
                    mergedData: tabData?.mergedData  // Preserve the merged data if available
                  };
                  
                  // Set all other tabs as inactive and the new tab as active
                  const updatedTabs = pg.tabs.map(t => ({ ...t, active: false, isActive: false })).concat(newTab);
                  return {
                    ...pg,
                    tabs: updatedTabs
                  };
                }
                return pg;
              })
            };
          }
          return p;
        });
        
        setProjects(updatedProjects);
        console.log('✅ Tab copied successfully:', newTabName);
        showToastNotification(`Tab "${newTabName}" copied successfully`, 'success');
      } catch (error) {
        console.error('❌ Failed to copy tab:', error);
        showToastNotification('Failed to copy tab: ' + error.message, 'error');
      }
    }
    
    // Clear clipboard after paste
    if (clipboard.type === 'cut') {
      setClipboard({ type: null, data: null });
    }
    
    // Close context menu
    setContextMenu({ show: false, x: 0, y: 0, type: '', itemId: null });
  }, [clipboard, projects]);

  const pasteTabAfterSpecificTab = useCallback(async (targetProjectId, targetPageId, targetTabId) => {
    console.log('🔄 Attempting to paste tab after specific tab:', { 
      hasClipboard: !!clipboard.data, 
      clipboardType: clipboard.type,
      targetTabId 
    });
    if (!clipboard.data || clipboard.type === null) {
      console.log('❌ No clipboard data available');
      return;
    }
    
    const { tab, tabData, sourceProjectId, sourcePageId, sourceTabId } = clipboard.data;
    console.log('📋 Clipboard data:', { 
      tabName: tab?.name, 
      tabType: tab?.type || tab?.tabType,
      hasTabData: !!tabData,
      hasMergedData: !!tabData?.mergedData,
      sourceLocation: `${sourceProjectId}/${sourcePageId}/${sourceTabId}`
    });
    
    // For cut operations, we don't need to check for same tab since the original was removed
    // For copy operations, we now allow pasting to the same page (but not to the exact same tab)
    // This check is removed to allow same-page copying
    
              // Check for duplicate names
    const targetPage = projects.find(p => p.id === targetProjectId)?.pages?.find(pg => pg.id === targetPageId);
    console.log('🎯 Target page lookup:', { 
      targetProjectId, 
      targetPageId, 
      foundPage: !!targetPage,
      pageTabsCount: targetPage?.tabs?.length || 0 
    });
    if (!targetPage) {
      console.log('❌ Target page not found');
      return;
    }
    
    const existingTabNames = targetPage.tabs.map(t => t.name);
              let newTabName = tab.name;
              
              // For copy operations, add "Copy" suffix to make it clear it's a copy
              if (clipboard.type === 'copy') {
                newTabName = createCopy(tab.name, existingTabNames);
              } else if (existingTabNames.includes(newTabName)) {
                // For cut operations, only modify name if there's a conflict
                let counter = 1;
                while (existingTabNames.includes(`${newTabName} ${counter}`)) {
                  counter++;
                }
                newTabName = `${newTabName} ${counter}`;
              }
              
    // For cut operations, if we're pasting to the same page, we can use the original name
    const isSamePage = sourceProjectId === targetProjectId && sourcePageId === targetPageId;
    const isCutOperation = clipboard.type === 'cut';
    
    console.log('🔄 Operation details:', { 
      isSamePage, 
      isCutOperation, 
      finalTabName: newTabName 
    });
    
    if (isCutOperation) {
      // For cut operation: Delete original first, then create new with preserved data
      try {
        console.log('🔄 Starting cut/paste after tab operation for tab:', tab.id, 'name:', tab.name);
        
        // Step 1: Delete the original tab from backend to avoid name conflicts
        await workspaceStateService.deleteTab(tab.id);
        console.log('✅ Original tab deleted from backend:', tab.id);
        
        // Step 2: Wait a moment to ensure deletion is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 3: Create new tab in target location
        console.log('🔄 Creating new tab with name:', newTabName, 'type:', tab.tabType || tab.type);
        // Calculate position after the target tab
        const targetTabIndex = targetPage.tabs.findIndex(t => t.id === targetTabId);
        const position = targetTabIndex + 1;
        const movedTab = await workspaceApiService.createTab(targetPageId, newTabName, tab.tabType || tab.type, position);
        console.log('✅ New tab created in target location:', movedTab.id);
        
        // Step 4: Restore the original data to the new tab
        if (tabData && tabData.mergedData) {
          await workspaceApiService.replaceTabData(movedTab.id, tabData.mergedData);
          console.log('✅ Original data restored to new tab');
        }
        
        // Update local state with moved tab in correct position
        const updatedProjects = projects.map(p => {
          if (p.id === targetProjectId) {
            return {
              ...p,
              pages: p.pages.map(pg => {
                if (pg.id === targetPageId) {
              const newTab = {
                    ...movedTab,
                name: newTabName,
                    active: true,
                    isActive: true,
                    mergedData: tabData?.mergedData
              };
              
                  // Find the target tab index and insert after it
                  const targetTabIndex = pg.tabs.findIndex(t => t.id === targetTabId);
                  const newTabs = [...pg.tabs];
                  newTabs.splice(targetTabIndex + 1, 0, newTab);
                  
                  // Set all other tabs as inactive and the new tab as active
                  const updatedTabs = newTabs.map(t => ({ ...t, active: false, isActive: false }));
                  updatedTabs[targetTabIndex + 1] = { ...updatedTabs[targetTabIndex + 1], active: true, isActive: true };
                  
                  return {
                    ...pg,
                    tabs: updatedTabs
                  };
                }
                return pg;
              })
            };
          }
          return p;
        });
        
        setProjects(updatedProjects);
        console.log('✅ Tab moved successfully (cut/paste after tab):', newTabName);
      } catch (error) {
        console.error('❌ Failed to move tab:', error);
        showToastNotification('Failed to move tab: ' + error.message, 'error');
                }
    } else {
      // For copy operation: Create new tab (existing logic)
      try {
        // Calculate position after the target tab
        const targetTabIndex = targetPage.tabs.findIndex(t => t.id === targetTabId);
        const position = targetTabIndex + 1;
        const createdTab = await workspaceApiService.createTab(targetPageId, newTabName, tab.tabType || tab.type, position);
        
        // Copy the tab data if it exists in the clipboard
        if (tabData && tabData.mergedData) {
          await workspaceApiService.replaceTabData(createdTab.id, tabData.mergedData);
                }
                
      // Update local state with the new tab
      const updatedProjects = projects.map(p => {
        if (p.id === targetProjectId) {
          return {
            ...p,
            pages: p.pages.map(pg => {
              if (pg.id === targetPageId) {
                const newTab = {
                  ...createdTab,
                  name: newTabName,
                  active: true,
                  isActive: true,  // Make the new tab active
                  mergedData: tabData?.mergedData  // Preserve the merged data if available
                };
              
              // Find the target tab index and insert after it
              const targetTabIndex = pg.tabs.findIndex(t => t.id === targetTabId);
              console.log('📍 Inserting tab at position:', { targetTabIndex: targetTabIndex + 1, totalTabs: pg.tabs.length });
              const newTabs = [...pg.tabs];
              newTabs.splice(targetTabIndex + 1, 0, newTab);
              
              // Set all other tabs as inactive and the new tab as active
              const updatedTabs = newTabs.map(t => ({ ...t, active: false, isActive: false }));
              updatedTabs[targetTabIndex + 1] = { ...updatedTabs[targetTabIndex + 1], active: true, isActive: true };
              
              return {
                ...pg,
                tabs: updatedTabs
              };
            }
            return pg;
          })
        };
      }
      return p;
    });
    
    setProjects(updatedProjects);
      console.log('✅ Tab pasted after specific tab successfully:', newTabName);
    } catch (error) {
      console.error('❌ Failed to paste tab after specific tab:', error);
      showToastNotification('Failed to paste tab: ' + error.message, 'error');
    }
    } // Close the else block for copy operation
    
    console.log('🎯 Paste operation completed, cleaning up...');
    
    // Clear clipboard after paste
    if (clipboard.type === 'cut') {
      setClipboard({ type: null, data: null });
    }
    
    // Close context menu
    setContextMenu({ show: false, x: 0, y: 0, type: '', itemId: null });
  }, [clipboard, projects]);



  // Tab scroll functions
  const scrollTabsLeft = useCallback(() => {
    if (tabContainerRef.current) {
      const newScrollLeft = tabContainerRef.current.scrollLeft - 200;
      tabContainerRef.current.scrollLeft = newScrollLeft;
      setTabScrollLeft(newScrollLeft);
    }
  }, []);

  const scrollTabsRight = useCallback(() => {
    if (tabContainerRef.current) {
      const newScrollLeft = tabContainerRef.current.scrollLeft + 200;
      tabContainerRef.current.scrollLeft = newScrollLeft;
      setTabScrollLeft(newScrollLeft);
    }
  }, []);

  const checkScrollButtons = useCallback(() => {
    if (tabContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabContainerRef.current;
      const canScrollRight = scrollWidth > clientWidth;
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 1;
      

      
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(canScrollRight && !isAtEnd);
    }
  }, []);

  const handleTabScroll = useCallback(() => {
    if (tabContainerRef.current) {
      setTabScrollLeft(tabContainerRef.current.scrollLeft);
      checkScrollButtons();
    }
  }, [checkScrollButtons]);



  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Global drag end handler
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragging(false);
      setDraggedTab(null);
      setDragOverTab(null);
      setIsDraggingProject(false);
      setDraggedProject(null);
      setDragOverProject(null);
      setIsDraggingPage(false);
      setDraggedPage(null);
      setDragOverPage(null);
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  // Check scroll buttons when tabs change
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);
    return () => clearTimeout(timer);
  }, [projects, selectedPage, checkScrollButtons]);

  // Additional scroll check on window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => checkScrollButtons(), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScrollButtons]);



  // Close context menu when clicking outside
  const handleClickOutside = useCallback((event) => {
    if (contextMenu.show) {
      setContextMenu({ show: false, x: 0, y: 0, type: '', itemId: null });
    }
    if (showTabDropdown) {
      setShowTabDropdown(false);
    }
  }, [contextMenu.show, showTabDropdown]);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Check API key status when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      checkApiKeyStatus();
    }
  }, [isAuthenticated, userId]);

  // TODO: Active tab persistence - temporarily disabled to prevent data loss
  // Will implement a different approach that doesn't interfere with mergedData

  // Fetch sediment types when seismic tab with results is loaded
  useEffect(() => {
    const hasSeismicResults = projects.some(project => 
      project.pages?.some(page => 
        page.tabs?.some(tab => 
          (tab.type === 'seismic' || tab.tabType === 'seismic') && tab.mergedData?.seismicResults?.rgb
        )
      )
    );

    if (hasSeismicResults && sedimentTypes.length === 0) {
      console.log('🌱 Fetching sediment types for seismic results...');
      fetchSedimentTypes();
    }
  }, [projects, sedimentTypes]);

  // Calculate probabilities for sediment types when seismic results are available from persisted data
  useEffect(() => {
    console.log('🔍 Sediment probability useEffect triggered');
    console.log('Projects:', projects.length);
    console.log('SedimentTypes:', sedimentTypes.length);
    
    // Find seismic tabs with results
    projects.forEach((project, projectIndex) => {
      if (project.pages) {
        project.pages.forEach((page, pageIndex) => {
          if (page.tabs) {
            page.tabs.forEach((tab, tabIndex) => {
              console.log(`Tab ${projectIndex}-${pageIndex}-${tabIndex}:`, tab.type || tab.tabType, 'merged:', !!tab.mergedData);
              if ((tab.type === 'seismic' || tab.tabType === 'seismic') && tab.mergedData?.seismicResults?.rgb) {
                console.log('🎯 Found seismic tab with results!', tab.mergedData.seismicResults);
                const seismicResult = tab.mergedData.seismicResults;
                if (sedimentTypes.length > 0) {
                  // Check if probabilities are already calculated
                  const hasProbs = sedimentTypes.some(row => row.probability !== undefined);
                  console.log('Has probabilities already?', hasProbs);
                  if (!hasProbs) {
                    console.log('🧮 Calculating probabilities...');
                    const rgb = seismicResult.rgb;
                    const probs = sedimentTypes.map(row => {
                      const soil_rgb = [row.color_r, row.color_g, row.color_b];
                      const dot = rgb[0]*soil_rgb[0] + rgb[1]*soil_rgb[1] + rgb[2]*soil_rgb[2];
                      const norm1 = Math.sqrt(rgb[0]**2 + rgb[1]**2 + rgb[2]**2);
                      const norm2 = Math.sqrt(soil_rgb[0]**2 + soil_rgb[1]**2 + soil_rgb[2]**2);
                      return norm1 && norm2 ? dot/(norm1*norm2) : 0;
                    });
                    setSedimentTypes(sedimentTypes.map((row, i) => ({ ...row, probability: probs[i] })));
                    console.log('✅ Probabilities calculated and set!');
                  }
                }
              }
            });
          }
        });
      }
    });
  }, [projects, sedimentTypes]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isLogin ? 'login' : 'register';

    try {
      const res = await fetch(`/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (isLogin) {
          // Note: localStorage usage - this may not work in all environments
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
          }
          setIsAuthenticated(true);
          setUserId(data.userId);
          
          // Fetch user profile to ensure we have the latest data
                  try {
          const profile = await userService.getUserProfile(data.userId);
            setUsername(profile.username);
          } catch (error) {
            console.error('Failed to fetch user profile after login:', error);
            // Fallback to username from login response
            setUsername(data.username || username);
          }
          
          // Initialize workspace after successful login
          try {
            await initializeWorkspace();
            console.log('✅ Workspace initialized after login');
          } catch (error) {
            console.error('❌ Failed to initialize workspace after login:', error);
            showToastNotification('Failed to load workspace: ' + error.message, 'error');
          }
          
          setShowForm(false);
          setErrorMessage('');
        } else {
          setErrorMessage('Registration successful!');
          setShowErrorDialog(true);
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setUsername('');
        }
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        if (isLogin) {
          // For login errors, show as inline error on password field
          setPasswordError(data.message || 'Invalid email or password.');
        } else {
          // For registration errors, show as inline errors based on the error type
          const errorMessage = data.message || 'Please try another email and password.';
          
          if (errorMessage.includes('password') || errorMessage.includes('Password')) {
            setPasswordError(errorMessage);
          } else if (errorMessage.includes('username') || errorMessage.includes('Username')) {
            setUsernameError(errorMessage);
          } else if (errorMessage.includes('Registration failed') || errorMessage.includes('email') || errorMessage.includes('Email')) {
            setPasswordError('Please try another email and password.');
          } else {
            // For other errors, show as dialog
            setErrorMessage(errorMessage);
            setShowErrorDialog(true);
          }
        }
      }
    } catch (err) {
      setErrorMessage('Server error. Please try again.');
      setShowErrorDialog(true);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
    setIsAuthenticated(false);
    setUsername('');
    setUserId(null);
    setHasStoredApiKey(false);
    setApiKeyStatus(null);
  };

  // Toast notification helper
  const showToastNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };



  // API Key management functions
  const checkApiKeyStatus = async () => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setApiKeyLoading(true);
      setApiKeyError('');
      
      const status = await apiKeyService.getApiKeyStatus(userId);
      
      setHasStoredApiKey(status.hasStoredKey);
      setApiKeyStatus(status);
    } catch (error) {
      console.error('Error checking API key status:', error);
      setApiKeyError('Failed to check API key status');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const storeApiKey = async (apiKey, userPassword, rememberKey) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setApiKeyLoading(true);
      setApiKeyError('');
      
      const result = await apiKeyService.storeApiKey(userId, apiKey, userPassword, rememberKey);
      
      setHasStoredApiKey(result.hasStoredKey);
      return result;
    } catch (error) {
      console.error('Error storing API key:', error);
      setApiKeyError(error.message || 'Failed to store API key');
      throw error;
    } finally {
      setApiKeyLoading(false);
    }
  };

  const deleteApiKey = async (userPassword) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setApiKeyLoading(true);
      setApiKeyError('');
      
      const result = await apiKeyService.deleteApiKey(userId, userPassword);
      
      setHasStoredApiKey(result.hasStoredKey);
      return result;
    } catch (error) {
      console.error('Error deleting API key:', error);
      setApiKeyError(error.message || 'Failed to delete API key');
      throw error;
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!deleteApiKeyPassword.trim()) {
      setApiKeyError('Please enter your password');
      return;
    }

    try {
      await deleteApiKey(deleteApiKeyPassword);
      setShowDeleteApiKeyModal(false);
      setDeleteApiKeyPassword('');
      setApiKeyError('');
      setRememberApiKey(false); // Reset checkbox after successful deletion
      showToastNotification('API key deleted successfully!', 'success');
      
      // Refresh API key status after successful deletion
      await checkApiKeyStatus();
    } catch (error) {
      // Error is already set in deleteApiKey function
    }
  };



  const handleSeismicDecrypt = async () => {
    if (!seismicDecryptPassword.trim()) {
      setSeismicDecryptError('Please enter your password');
      return;
    }

    setSeismicDecryptLoading(true);
    setSeismicDecryptError('');

    try {
      const result = await apiKeyService.getApiKey(userId, seismicDecryptPassword);
      if (result.hasStoredKey && result.apiKey) {
        setShowSeismicDecryptModal(false);
        setSeismicDecryptPassword('');
        setSeismicDecryptError('');
        
        // Continue with the pending seismic operation
        if (pendingSeismicData) {
          const { data, currentSedimentTypes, tabKey } = pendingSeismicData;
          const apiKeyToUse = result.apiKey;
          
          try {
            const res = await fetch('http://localhost:5001/api/seismic-info', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: data.address,
                api_key: apiKeyToUse,
                soil_table: currentSedimentTypes
              })
            });
            if (!res.ok) throw new Error('Failed to fetch seismic info');
            const seismicResult = await res.json();
            console.log('🎯 Seismic API response received (decrypt path):', seismicResult);
            setSeismicResults(prev => ({
              ...prev,
              [tabKey]: seismicResult
            }));
            
            // Save seismic results to database for persistence (decrypt path)
            try {
              // Extract tab ID from tabKey (format: projectId_pageId_tabId)
              const tabId = tabKey.split('_')[2];
              
              const seismicResultsDelta = {
                seismicResults: {
                  site_class: seismicResult.site_class,
                  coordinates: seismicResult.coordinates,
                  address_checked: seismicResult.address_checked,
                  rgb: seismicResult.rgb,
                  most_similar_soil: seismicResult.most_similar_soil,
                  soil_pressure: seismicResult.soil_pressure,
                  sa_site: seismicResult.sa_site,
                  sa_x450: seismicResult.sa_x450
                }
              };
              console.log('🔍 Saving seismic results to database (decrypt path):', seismicResultsDelta);
              console.log('🔍 Using tab ID:', tabId);
              await workspaceStateService.saveTabDataImmediately(tabId, 'seismic', seismicResultsDelta);
              console.log('✅ Seismic results saved successfully (decrypt path)');
            } catch (error) {
              console.error('❌ Error saving seismic results (decrypt path):', error);
              // Don't show error to user as this is background save - the UI is already working
            }
            
            // Update sediment types with probabilities
            if (seismicResult.most_similar_soil && seismicResult.rgb && currentSedimentTypes.length > 0) {
              const rgb = seismicResult.rgb;
              const probs = currentSedimentTypes.map(row => {
                const soil_rgb = [row.color_r, row.color_g, row.color_b];
                const dot = rgb[0]*soil_rgb[0] + rgb[1]*soil_rgb[1] + rgb[2]*soil_rgb[2];
                const norm1 = Math.sqrt(rgb[0]**2 + rgb[1]**2 + rgb[2]**2);
                const norm2 = Math.sqrt(soil_rgb[0]**2 + soil_rgb[1]**2 + soil_rgb[2]**2);
                return norm1 && norm2 ? dot/(norm1*norm2) : 0;
              });
              setSedimentTypes(currentSedimentTypes.map((row, i) => ({ ...row, probability: probs[i] })));
            }
            
            showToastNotification('Seismic data retrieved successfully!', 'success');
          } catch (err) {
            setSeismicFormError('Error retrieving seismic data.');
            setSeismicResults(prev => ({
              ...prev,
              [tabKey]: null
            }));
          }
          setPendingSeismicData(null);
        }
      } else {
        setSeismicDecryptError('No API key found or invalid password');
      }
    } catch (error) {
      setSeismicDecryptError(error.message || 'Failed to decrypt API key');
    } finally {
      setSeismicDecryptLoading(false);
    }
  };

  const handleStoreApiKey = async (apiKey, rememberKey) => {
    if (!currentUserPassword.trim()) {
      setApiKeyError('Please enter your password');
      return;
    }

    try {
      let keyToStore = apiKey;
      
      // If user already has a stored API key, retrieve it first
      if (hasStoredApiKey && (!apiKey || apiKey.trim() === '')) {
        try {
          const storedKeyData = await apiKeyService.getApiKey(userId, currentUserPassword);
          keyToStore = storedKeyData.apiKey;
        } catch (retrieveError) {
          console.error('Error retrieving stored API key:', retrieveError);
          setApiKeyError('Failed to retrieve stored API key. Please try again.');
          return;
        }
      }
      
      // Don't store if the key is empty
      if (!keyToStore || keyToStore.trim() === '') {
        setApiKeyError('No API key to store. Please enter an API key first.');
        return;
      }

      await storeApiKey(keyToStore, currentUserPassword, rememberKey);
      setShowStoreApiKeyModal(false);
      setCurrentUserPassword('');
      setApiKeyError('');
      setRememberApiKey(false); // Reset checkbox after successful storage
      showToastNotification('API key stored successfully!', 'success');
      
      // Refresh API key status after successful storage
      await checkApiKeyStatus();
    } catch (error) {
      // Error is already set in storeApiKey function
    }
  };

  // Project management functions
  const addProject = async () => {
    try {
    const existingNames = getExistingNames('project');
    const baseName = 'Project';
    const newName = generateUniqueName(baseName, existingNames);
    
      await workspaceStateService.createProject(newName);
    } catch (error) {
      console.error('Error creating project:', error);
      showToastNotification('Failed to create project: ' + error.message, 'error');
    }
  };

  const addPage = async (projectId) => {
    try {
    const existingNames = getExistingNames('page', projectId);
    const baseName = 'Page';
    const newName = generateUniqueName(baseName, existingNames);
    
      const newPage = await workspaceStateService.createPage(projectId, newName);
      
      // Create a default Welcome tab for the new page
      await workspaceStateService.createTab(newPage.id, 'Welcome', 'Welcome');
    } catch (error) {
      console.error('Error creating page:', error);
      showToastNotification('Failed to create page: ' + error.message, 'error');
    }
  };

  const toggleProjectExpansion = async (projectId) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // Use isExpanded for both backend and frontend consistency
        const currentExpanded = project.isExpanded || project.expanded || false;
        await workspaceStateService.updateProject(projectId, { 
          isExpanded: !currentExpanded 
        });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      showToastNotification('Failed to update project: ' + error.message, 'error');
    }
  };

  const handleProjectContextMenu = (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'project', itemId: projectId });
  };

  const handlePageContextMenu = (e, projectId, pageId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'page', itemId: { projectId, pageId } });
  };

  const handleContextMenuAction = async (action) => {
    const { type, itemId } = contextMenu;
    
    if (type === 'project') {
      const projectId = itemId;
      const project = projects.find(p => p.id === projectId);
      
      switch (action) {
        case 'rename':
          setEditingItem({ type: 'project', id: projectId, name: project.name });
          break;
        case 'copy':
          try {
          const existingProjectNames = getExistingNames('project');
          const newProjectName = createCopy(project.name, existingProjectNames);
            
            // Create project in backend first
            const newProject = await workspaceStateService.createProject(newProjectName);
            const newProjectId = newProject.id; // Use the real ID from the returned project object
            console.log('✅ Project copied to backend:', newProjectId);
            
            // Copy all pages from original project
            for (const originalPage of project.pages) {
              const pageNames = getExistingNames('page', newProjectId);
              const newPageName = generateUniqueName(originalPage.name, pageNames);
              const newPage = await workspaceStateService.createPage(newProjectId, newPageName);
              const newPageId = newPage.id; // Use the real ID from the returned page object
              console.log('✅ Page copied to backend:', newPageId);
              
              // Copy all tabs from original page with their data
              if (originalPage.tabs && originalPage.tabs.length > 0) {
                for (const originalTab of originalPage.tabs) {
                  const tabNames = getExistingNames('tab', newProjectId, newPageId);
                  const newTabName = generateUniqueName(originalTab.name, tabNames);
                  
                  // Create the tab
                  const createdTab = await workspaceStateService.createTab(newPageId, newTabName, originalTab.type || originalTab.tabType || 'design_tables');
                  console.log('✅ Tab created:', newTabName);
                  
                  // Copy the tab data if it exists
                  const originalTabKey = `${projectId}_${originalPage.id}_${originalTab.id}`;
                  const tabData = {
                    seismicData: seismicTabData[originalTabKey] || null,
                    seismicResults: seismicResults[originalTabKey] || null,
                    snowLoadData: snowLoadTabData[originalTabKey] || null,
                    windLoadData: windLoadTabData[originalTabKey] || null,
                    mergedData: originalTab.mergedData || null
                  };
                  
                  // Apply the data to the new tab if any exists
                  if (tabData.mergedData || tabData.seismicData || tabData.snowLoadData || tabData.windLoadData) {
                    try {
                      await workspaceStateService.updateTabData(createdTab.id, originalTab.type || originalTab.tabType, tabData.mergedData || {});
                      console.log('✅ Tab data copied:', newTabName);
                    } catch (error) {
                      console.warn('⚠️ Failed to copy tab data for:', newTabName, error);
                    }
                  }
                }
              }
            }
            
            showToastNotification(`Project "${newProjectName}" copied successfully`, 'success');
          } catch (error) {
            console.error('❌ Failed to copy project:', error);
            showToastNotification('Failed to copy project: ' + error.message, 'error');
          }
          break;
        case 'delete':
          try {
            // Update frontend immediately for better UX
          setProjects(projects.filter(p => p.id !== projectId));
            
            // Then delete from backend
            await workspaceStateService.deleteProject(projectId);
            console.log('✅ Project deleted from backend:', projectId);
            showToastNotification(`Project "${project.name}" deleted successfully`, 'success');
          } catch (error) {
            console.error('❌ Failed to delete project:', error);
            // Restore the project in frontend if backend delete failed
            setProjects(prevProjects => {
              if (!prevProjects.find(p => p.id === projectId)) {
                return [...prevProjects, project];
              }
              return prevProjects;
            });
            showToastNotification('Failed to delete project: ' + error.message, 'error');
          }
          break;
        case 'newPage':
          addPage(projectId);
          break;
      }
    } else if (type === 'page') {
      const { projectId, pageId } = itemId;
      const project = projects.find(p => p.id === projectId);
      const page = project.pages.find(p => p.id === pageId);
      
      switch (action) {
        case 'rename':
          setEditingItem({ type: 'page', id: { projectId, pageId }, name: page.name });
          break;
        case 'copy':
          try {
          const existingPageNames = getExistingNames('page', projectId);
          const newPageName = createCopy(page.name, existingPageNames);
            
            // Create page in backend first
            const newPage = await workspaceStateService.createPage(projectId, newPageName);
            const newPageId = newPage.id; // Use the real ID from the returned page object
            console.log('✅ Page copied to backend:', newPageId);
            
            // Copy all tabs from original page with their data
            if (page.tabs && page.tabs.length > 0) {
              for (const originalTab of page.tabs) {
                const tabNames = getExistingNames('tab', projectId, newPageId);
                const newTabName = generateUniqueName(originalTab.name, tabNames);
                
                // Create the tab
                const createdTab = await workspaceStateService.createTab(newPageId, newTabName, originalTab.type || originalTab.tabType || 'design_tables');
                console.log('✅ Tab created:', newTabName);
                
                // Copy the tab data if it exists
                const originalTabKey = `${projectId}_${pageId}_${originalTab.id}`;
                const tabData = {
                  seismicData: seismicTabData[originalTabKey] || null,
                  seismicResults: seismicResults[originalTabKey] || null,
                  snowLoadData: snowLoadTabData[originalTabKey] || null,
                  windLoadData: windLoadTabData[originalTabKey] || null,
                  mergedData: originalTab.mergedData || null
                };
                
                // Apply the data to the new tab if any exists
                if (tabData.mergedData || tabData.seismicData || tabData.snowLoadData || tabData.windLoadData) {
                  try {
                    await workspaceStateService.updateTabData(createdTab.id, originalTab.type || originalTab.tabType, tabData.mergedData || {});
                    console.log('✅ Tab data copied:', newTabName);
                  } catch (error) {
                    console.warn('⚠️ Failed to copy tab data for:', newTabName, error);
                  }
                }
              }
            }
            
            showToastNotification(`Page "${newPageName}" copied successfully`, 'success');
          } catch (error) {
            console.error('❌ Failed to copy page:', error);
            showToastNotification('Failed to copy page: ' + error.message, 'error');
          }
          break;
        case 'delete':
          try {
            // Update frontend immediately for better UX
          const projectsAfterDelete = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.filter(page => page.id !== pageId)
              };
            }
            return p;
          });
          setProjects(projectsAfterDelete);
            
            // Then delete from backend
            await workspaceStateService.deletePage(pageId);
            console.log('✅ Page deleted from backend:', pageId);
            showToastNotification(`Page "${page.name}" deleted successfully`, 'success');
          } catch (error) {
            console.error('❌ Failed to delete page:', error);
            // Restore the page in frontend if backend delete failed
            setProjects(prevProjects => prevProjects.map(p => {
              if (p.id === projectId) {
                const hasPage = p.pages.find(pg => pg.id === pageId);
                if (!hasPage) {
                  return {
                    ...p,
                    pages: [...p.pages, page]
                  };
                }
              }
              return p;
            }));
            showToastNotification('Failed to delete page: ' + error.message, 'error');
          }
          break;
        case 'paste':
          await pasteTabFromClipboard(projectId, pageId);
          break;
      }
    } else if (type === 'tab') {
      const tabId = itemId;
      const { projectId, pageId } = selectedPage;
      const project = projects.find(p => p.id === projectId);
      const page = project.pages.find(p => p.id === pageId);
      const tab = page.tabs.find(t => t.id === tabId);
      
      switch (action) {
        case 'rename':
          setEditingItem({ type: 'tab', id: { projectId, pageId, tabId }, name: tab.name });
          break;
        case 'copy':
          const existingTabNames = getExistingNames('tab', projectId, pageId);
          const newTabName = createCopy(tab.name, existingTabNames);
          
          // Create the copied tab in the backend first
          try {
            const createdTab = await workspaceStateService.createTab(pageId, newTabName, tab.tabType || tab.type);
            
            // Copy the tab data if it exists (using new backend-only approach)
            if (tab.mergedData) {
              await workspaceStateService.updateTabData(createdTab.id, tab.tabType || tab.type, tab.mergedData);
          }
          
            // Update local state with the real tab from backend
          const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                    const copiedTab = {
                        ...createdTab,
                      name: newTabName,
                        active: true,
                        isActive: true,  // Make the new tab active
                        mergedData: tab.mergedData  // Preserve the merged data
                    };
                    
                    // Set all other tabs as inactive and the new tab as active
                    const updatedTabs = pa.tabs.map(t => ({ ...t, active: false, isActive: false })).concat(copiedTab);
                    return {
                      ...pa,
                      tabs: updatedTabs
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjects);
            console.log('✅ Tab copied successfully:', newTabName);
          } catch (error) {
            console.error('❌ Failed to copy tab:', error);
            showToastNotification('Failed to copy tab: ' + error.message, 'error');
          }
          break;
        case 'newTabRight':
          // Create new tab to the right of current tab
          const existingTabNamesRight = getExistingNames('tab', projectId, pageId);
          const newTabNameRight = generateUniqueName('Design Tables', existingTabNamesRight);
          
          try {
            // Create tab in backend first
            const createdTab = await workspaceStateService.createTab(pageId, newTabNameRight, 'design_tables');
            
            // Update local state with proper insertion
          const updatedProjectsRight = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                    const tabIndex = pa.tabs.findIndex(t => t.id === tabId);
                    const newTabs = [...pa.tabs];
                      const newTabRight = {
                        ...createdTab,
                        name: newTabNameRight,
                        active: true,
                        isActive: true
                      };
                    newTabs.splice(tabIndex + 1, 0, newTabRight);
                    
                    // Set all other tabs as inactive and the new tab as active
                    const updatedTabs = newTabs.map(t => ({ ...t, active: false, isActive: false }));
                    updatedTabs[tabIndex + 1] = { ...updatedTabs[tabIndex + 1], active: true, isActive: true };
                    
                    return {
                      ...pa,
                      tabs: updatedTabs
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjectsRight);
            
            // Update display order in backend
            const updatedPage = updatedProjectsRight.find(p => p.id === projectId).pages.find(p => p.id === pageId);
            await workspaceStateService.updateTabOrder(pageId, updatedPage.tabs.map(t => t.id));
            
            console.log('✅ New tab created to the right:', newTabNameRight);
          } catch (error) {
            console.error('❌ Failed to create new tab to the right:', error);
            showToastNotification('Failed to create new tab: ' + error.message, 'error');
          }
          break;
        case 'lockTab':
          // Lock the tab
          try {
            await workspaceStateService.updateTab(tabId, { isLocked: true });
          const updatedProjectsLock = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                    return {
                      ...pa,
                      tabs: pa.tabs.map(t => {
                        if (t.id === tabId) {
                            return { ...t, locked: true, isLocked: true };
                        }
                        return t;
                      })
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjectsLock);
            console.log('✅ Tab locked successfully');
          } catch (error) {
            console.error('❌ Failed to lock tab:', error);
            showToastNotification('Failed to lock tab: ' + error.message, 'error');
          }
          break;
        case 'unlockTab':
          // Unlock the tab
          try {
            await workspaceStateService.updateTab(tabId, { isLocked: false });
          const updatedProjectsUnlock = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                    return {
                      ...pa,
                      tabs: pa.tabs.map(t => {
                        if (t.id === tabId) {
                            return { ...t, locked: false, isLocked: false };
                        }
                        return t;
                      })
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjectsUnlock);
            console.log('✅ Tab unlocked successfully');
          } catch (error) {
            console.error('❌ Failed to unlock tab:', error);
            showToastNotification('Failed to unlock tab: ' + error.message, 'error');
          }
          break;
        case 'copyToClipboard':
          await copyTabToClipboard(tabId, false);
          break;
        case 'cutToClipboard':
          await copyTabToClipboard(tabId, true);
          break;
        case 'pasteAfterThisTab':
          await pasteTabAfterSpecificTab(selectedPage.projectId, selectedPage.pageId, tabId);
          break;
        case 'moveToStart':
          // Move tab to the beginning
          try {
          const updatedProjectsStart = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                    const currentTabs = [...pa.tabs];
                    const tabIndex = currentTabs.findIndex(t => t.id === tabId);
                    if (tabIndex > 0) {
                      const [movedTab] = currentTabs.splice(tabIndex, 1);
                      currentTabs.unshift(movedTab);
                    }
                    return {
                      ...pa,
                      tabs: currentTabs
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjectsStart);
            
            // Update display order in backend
            const updatedPage = updatedProjectsStart.find(p => p.id === projectId).pages.find(p => p.id === pageId);
            await workspaceStateService.updateTabOrder(pageId, updatedPage.tabs.map(t => t.id));
            console.log('✅ Tab moved to start successfully');
          } catch (error) {
            console.error('❌ Failed to move tab to start:', error);
            showToastNotification('Failed to move tab: ' + error.message, 'error');
          }
          break;
        case 'moveToEnd':
          // Move tab to the end
          try {
          const updatedProjectsEnd = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                    const currentTabs = [...pa.tabs];
                    const tabIndex = currentTabs.findIndex(t => t.id === tabId);
                    if (tabIndex >= 0 && tabIndex < currentTabs.length - 1) {
                      const [movedTab] = currentTabs.splice(tabIndex, 1);
                      currentTabs.push(movedTab);
                    }
                    return {
                      ...pa,
                      tabs: currentTabs
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjectsEnd);
            
            // Update display order in backend
            const updatedPage = updatedProjectsEnd.find(p => p.id === projectId).pages.find(p => p.id === pageId);
            await workspaceStateService.updateTabOrder(pageId, updatedPage.tabs.map(t => t.id));
            console.log('✅ Tab moved to end successfully');
          } catch (error) {
            console.error('❌ Failed to move tab to end:', error);
            showToastNotification('Failed to move tab: ' + error.message, 'error');
          }
          break;
        case 'closeOthers':
          // Close all other tabs except the current one and locked tabs
          try {
            const currentPage = project.pages.find(p => p.id === pageId);
            const tabsToDelete = currentPage.tabs.filter(t => t.id !== tabId && !t.locked && !t.isLocked);
            
            // Delete tabs from backend
            for (const tabToDelete of tabsToDelete) {
              await workspaceStateService.deleteTab(tabToDelete.id);
            }
            
          const updatedProjectsCloseOthers = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                      const remainingTabs = pa.tabs.filter(t => t.id === tabId || t.locked || t.isLocked);
                    // If no tabs remain, create a welcome tab
                    if (remainingTabs.length === 0) {
                        // Create welcome tab in backend first
                        const createWelcomeTab = async () => {
                          try {
                            const welcomeTab = await workspaceStateService.createTab(pageId, 'Welcome', 'welcome');
                            setProjects(prevProjects => prevProjects.map(pr => {
                              if (pr.id === projectId) {
                                return {
                                  ...pr,
                                  pages: pr.pages.map(pg => {
                                    if (pg.id === pageId) {
                                      return {
                                        ...pg,
                                        tabs: [{ ...welcomeTab, active: true, isActive: true }]
                                      };
                                    }
                                    return pg;
                                  })
                                };
                              }
                              return pr;
                            }));
                          } catch (error) {
                            console.error('❌ Failed to create welcome tab:', error);
                          }
                        };
                        createWelcomeTab();
                      return {
                        ...pa,
                          tabs: [] // Temporarily empty until welcome tab is created
                      };
                    }
                    return {
                      ...pa,
                      tabs: remainingTabs
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjectsCloseOthers);
            console.log('✅ Closed other tabs successfully');
          } catch (error) {
            console.error('❌ Failed to close other tabs:', error);
            showToastNotification('Failed to close other tabs: ' + error.message, 'error');
          }
          break;
        case 'closeAll':
          // Close all tabs except locked ones, create welcome tab if none left
          try {
            const currentPage = project.pages.find(p => p.id === pageId);
            const tabsToDelete = currentPage.tabs.filter(t => !t.locked && !t.isLocked);
            
            // Delete tabs from backend
            for (const tabToDelete of tabsToDelete) {
              await workspaceStateService.deleteTab(tabToDelete.id);
            }
            
          const updatedProjectsCloseAll = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                      const lockedTabs = pa.tabs.filter(t => t.locked || t.isLocked);
                    // If no locked tabs remain, create a welcome tab
                    if (lockedTabs.length === 0) {
                        // Create welcome tab in backend first
                        const createWelcomeTab = async () => {
                          try {
                            const welcomeTab = await workspaceStateService.createTab(pageId, 'Welcome', 'welcome');
                            setProjects(prevProjects => prevProjects.map(pr => {
                              if (pr.id === projectId) {
                                return {
                                  ...pr,
                                  pages: pr.pages.map(pg => {
                                    if (pg.id === pageId) {
                                      return {
                                        ...pg,
                                        tabs: [{ ...welcomeTab, active: true, isActive: true }]
                                      };
                                    }
                                    return pg;
                                  })
                                };
                              }
                              return pr;
                            }));
                          } catch (error) {
                            console.error('❌ Failed to create welcome tab:', error);
                          }
                        };
                        createWelcomeTab();
                      return {
                        ...pa,
                          tabs: [] // Temporarily empty until welcome tab is created
                      };
                    }
                    return {
                      ...pa,
                      tabs: lockedTabs
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjectsCloseAll);
            console.log('✅ Closed all tabs successfully');
          } catch (error) {
            console.error('❌ Failed to close all tabs:', error);
            showToastNotification('Failed to close all tabs: ' + error.message, 'error');
          }
          break;
      }
    }
    
    setContextMenu({ show: false, x: 0, y: 0, type: '', itemId: null });
  };

  const handleEditSave = async (newName) => {
    try {
    if (editingItem.type === 'project') {
        // Update project name in database
        await workspaceStateService.updateProject(editingItem.id, { name: newName });
    } else if (editingItem.type === 'page') {
        const { pageId } = editingItem.id;
        // Update page name in database
        await workspaceStateService.updatePage(pageId, { name: newName });
    } else if (editingItem.type === 'tab') {
        const { tabId } = editingItem.id;
        // Update tab name in database
        await workspaceStateService.updateTab(tabId, { name: newName });
                    }
      setEditingItem({ type: '', id: null, name: '' });
    } catch (error) {
      console.error('Error saving name change:', error);
      showToastNotification('Failed to save name change: ' + error.message, 'error');
    }
  };

  const handleEditCancel = () => {
    setEditingItem({ type: '', id: null, name: '' });
  };

  // Tab management functions
  const addTab = async () => {
    try {
    const { projectId, pageId } = selectedPage;
      if (!pageId) {
        showToastNotification('Please select a page first', 'error');
        return;
      }
      
    const existingNames = getExistingNames('tab', projectId, pageId);
    const baseName = 'Design Tables';
    const newName = generateUniqueName(baseName, existingNames);
    
      await workspaceStateService.createTab(pageId, newName, 'design_tables');
    } catch (error) {
      console.error('Error creating tab:', error);
      showToastNotification('Failed to create tab: ' + error.message, 'error');
    }
  };

  const closeTab = async (tabId) => {
    const { projectId, pageId } = selectedPage;
    
    // Find the tab to check if it's locked
    const project = projects.find(p => p.id === projectId);
    const page = project?.pages?.find(p => p.id === pageId);
    const tabToClose = page?.tabs?.find(tab => tab.id === tabId);
    
    if (tabToClose && tabToClose.locked) {
      return; // Don't close locked tabs
    }
    
    // Delete from backend first
    try {
      await workspaceStateService.deleteTab(tabId);
      console.log('✅ Tab deleted from backend:', tabId);
    } catch (error) {
      console.error('❌ Failed to delete tab from backend:', error);
      showToastNotification('Failed to delete tab: ' + error.message, 'error');
      return; // Don't update frontend if backend deletion failed
    }
    
    // Update frontend state
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          pages: project.pages.map(page => {
            if (page.id === pageId) {
                const remainingTabs = page.tabs.filter(tab => tab.id !== tabId);
              
                // If no tabs left after closing, create a welcome tab
                if (remainingTabs.length === 0) {
                console.log('Creating Welcome tab - no tabs remaining');
                  return {
                    ...page,
                  tabs: [{ 
                    id: Date.now(), 
                    name: 'Welcome', 
                    type: 'Welcome', 
                    isActive: true,
                    active: true 
                  }]
                };
              }
              
              // If we have remaining tabs, make sure at least one is active
              const hasActiveTab = remainingTabs.some(tab => tab.isActive || tab.active);
              if (!hasActiveTab && remainingTabs.length > 0) {
                // Prefer to activate a non-Welcome tab if available
                const nonWelcomeTab = remainingTabs.find(tab => 
                  tab.type !== 'Welcome' && tab.tabType !== 'Welcome' && 
                  tab.type !== 'welcome' && tab.tabType !== 'welcome'
                );
                
                const tabToActivate = nonWelcomeTab || remainingTabs[0];
                tabToActivate.isActive = true;
                tabToActivate.active = true;
                console.log('Auto-activating tab after close:', tabToActivate.name);
              }
              
                return {
                  ...page,
                  tabs: remainingTabs
                };
            }
            return page;
          })
        };
      }
      return project;
    });
    setProjects(updatedProjects);
  };

  const selectTab = async (tabId) => {
    const { projectId, pageId } = selectedPage;
    
    // Update local state immediately
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          pages: project.pages.map(page => {
            if (page.id === pageId) {
              return {
                ...page,
                tabs: page.tabs.map(tab => ({
                  ...tab,
                  active: tab.id === tabId,
                  isActive: tab.id === tabId  // Support both property names
                }))
              };
            }
            return page;
          })
        };
      }
      return project;
    });
    setProjects(updatedProjects);
    
    // Persist active status using lightweight API (doesn't affect mergedData)
    try {
      await workspaceApiService.updateActiveTab(tabId);
      console.log('✅ Tab selected and active status saved:', tabId);
    } catch (error) {
      console.error('❌ Failed to save active tab status:', error);
      // Don't show error to user as this is background save
    }
  };

  const selectPage = (projectId, pageId) => {
    setSelectedPage({ projectId, pageId });
    
    // Auto-switch to the first tab only if no active tab exists on the page
    setTimeout(() => {
      const project = projects.find(p => p.id === projectId);
      const page = project?.pages?.find(p => p.id === pageId);
      
      if (page && page.tabs && page.tabs.length > 0) {
        // Check if there's already an active tab on this page
        const activeTab = page.tabs.find(t => t.isActive || t.active);
        
        if (!activeTab) {
          // No active tab found, switch to the first tab
          const firstTab = page.tabs[0];
          console.log('🔄 Auto-switching to first tab when switching to page:', firstTab.name);
          selectTab(firstTab.id);
        } else {
          // Active tab exists, don't override it
          console.log('✅ Page has active tab, preserving selection:', activeTab.name);
        }
      }
    }, 100); // Small delay to ensure state is updated
  };

  const handleTabContextMenu = (e, tabId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'tab', itemId: tabId });
  };

  // Map display names to internal tab types
  const mapDisplayNameToTabType = (displayName) => {
    const mapping = {
      'Design Tables': 'design_tables',
      'Snow Load': 'snow_load', 
      'Wind Load': 'wind_load',
      'Seismic Template': 'seismic'
    };
    return mapping[displayName] || displayName;
  };

  // Map internal tab types to display names  
  const mapTabTypeToDisplayName = (tabType) => {
    const mapping = {
      'Welcome': 'Welcome',
      'welcome': 'Welcome',
      'design_tables': 'Design Tables',
      'snow_load': 'Snow Load',
      'wind_load': 'Wind Load', 
      'seismic': 'Seismic Template'
    };
    return mapping[tabType] || 'Design Tables';
  };

  // Helper function to find active tab with property name compatibility
  const findActiveTab = (tabs) => {
    return tabs?.find(t => t.isActive || t.active) || null;
  };

  // Helper function to find active tab or fallback to Welcome tab
  const findActiveTabOrWelcome = (tabs) => {
    const activeTab = findActiveTab(tabs);
    if (activeTab) {
      return activeTab;
    }
    
    // If no active tab but tabs exist, find the first non-Welcome tab to activate
    const nonWelcomeTabs = tabs?.filter(t => 
      t.type !== 'Welcome' && t.tabType !== 'Welcome' && 
      t.type !== 'welcome' && t.tabType !== 'welcome'
    );
    
    if (nonWelcomeTabs && nonWelcomeTabs.length > 0) {
      // Return the first non-Welcome tab
      const firstNonWelcomeTab = nonWelcomeTabs[0];
      console.log('Found non-Welcome tab:', firstNonWelcomeTab.name);
      return firstNonWelcomeTab;
    }
    
    // If no non-Welcome tabs, try to find Welcome tab
    const welcomeTab = tabs?.find(t => 
      t.type === 'Welcome' || t.tabType === 'Welcome' || 
      t.type === 'welcome' || t.tabType === 'welcome'
    );
    
    if (welcomeTab) {
      return welcomeTab;
    }
    
    // If no tabs exist at all, we need to trigger creation of a Welcome tab
    // This will be handled by the createWelcomeTabIfNeeded function
    return null;
  };



  // Helper function to ensure Welcome tab exists when needed
  const createWelcomeTabIfNeeded = async (pageId) => {
    try {
      const existingNames = getExistingNames('tab', selectedPage.projectId, pageId);
      const welcomeName = generateUniqueName('Welcome', existingNames);
      
      console.log('Creating Welcome tab for page:', pageId);
      await workspaceStateService.createTab(pageId, welcomeName, 'Welcome');
      return true;
    } catch (error) {
      console.error('Error creating Welcome tab:', error);
      return false;
    }
  };

  const handleTabTypeChange = async (tabId, newType) => {
    try {
    const { projectId, pageId } = selectedPage;
    
      // Convert display name to internal type
      const internalType = mapDisplayNameToTabType(newType);
    
      // Find current tab to get its current name
      const currentProject = projects.find(p => p.id === projectId);
      const currentPage = currentProject?.pages?.find(p => p.id === pageId);
      const currentTab = currentPage?.tabs?.find(t => t.id === tabId);
      
      if (!currentTab) {
        throw new Error('Tab not found');
      }
      
      // Generate a unique name for the new type only if current name would conflict
      const existingNames = getExistingNames('tab', projectId, pageId)
        .filter(name => name !== currentTab.name); // Exclude current tab's name
      
      // Use display name as the new name, but make it unique if needed
                    const newName = generateUniqueName(newType, existingNames);
      
      // Update tab type and name through workspace service
      // Also unlock the tab since content is changing
      await workspaceStateService.updateTab(tabId, {
        name: newName,
        tabType: internalType,
        isLocked: false
      });

      // Update frontend state to reflect the changes
      const updatedProjects = projects.map(p => {
        if (p.id === projectId) {
        return {
            ...p,
            pages: p.pages.map(pa => {
              if (pa.id === pageId) {
              return {
                  ...pa,
                  tabs: pa.tabs.map(t => {
                    if (t.id === tabId) {
                      return { 
                        ...t, 
                        name: newName,
                        type: internalType,
                        tabType: internalType,
                        locked: false, 
                        isLocked: false 
                      };
                    }
                    return t;
                })
              };
            }
              return pa;
          })
        };
      }
        return p;
    });
    setProjects(updatedProjects);
      
    } catch (error) {
      console.error('Error updating tab type:', error);
      showToastNotification('Failed to update tab type: ' + error.message, 'error');
    }
  };

  // Dropdown drag and drop handlers
  const handleDropdownDragStart = (e, tabId) => {
    e.stopPropagation();
    setDropdownDraggedTab(tabId);
    setIsDropdownDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropdownDragEnter = (e, tabId) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropdownDraggedTab !== tabId) {
      setDropdownDragOverTab(tabId);
    }
  };

  const handleDropdownDragOver = (e, tabId) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropdownDraggedTab !== tabId) {
      setDropdownDragOverTab(tabId);
    }
  };

  const handleDropdownDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownDragOverTab(null);
  };

  const handleDropdownDrop = (e, targetTabId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dropdownDraggedTab && dropdownDraggedTab !== targetTabId) {
      const updatedProjects = projects.map(project => {
        if (project.id === selectedPage.projectId) {
          return {
            ...project,
            pages: project.pages.map(page => {
              if (page.id === selectedPage.pageId) {
                const currentTabs = [...page.tabs];
                const draggedTabIndex = currentTabs.findIndex(tab => tab.id === dropdownDraggedTab);
                const targetTabIndex = currentTabs.findIndex(tab => tab.id === targetTabId);
                
                if (draggedTabIndex !== -1 && targetTabIndex !== -1) {
                  const [draggedTab] = currentTabs.splice(draggedTabIndex, 1);
                  currentTabs.splice(targetTabIndex, 0, draggedTab);
                }
                
                return {
                  ...page,
                  tabs: currentTabs
                };
              }
              return page;
            })
          };
        }
        return project;
      });
      setProjects(updatedProjects);
    }
    
    setDropdownDraggedTab(null);
    setDropdownDragOverTab(null);
    setIsDropdownDragging(false);
  };

  const handleDropdownDragEnd = () => {
    setDropdownDraggedTab(null);
    setDropdownDragOverTab(null);
    setIsDropdownDragging(false);
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-white">
          {/* Top bar */}
          <div className="flex justify-between items-center p-6 max-w-7xl mx-auto">
            <span className="text-xl font-semibold">
              Welcome to Our Platform
            </span>
            <div>
              <button
                onClick={() => setShowForm(true)}
                className="rounded bg-yellow-100 px-4 py-2 hover:bg-yellow-200 transition flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} className="text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start now</span>
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center px-6 py-12">
            {showForm ? (
              <div style={{ width: '320px', maxWidth: '320px' }} className="mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
                  {isLogin ? 'Sign In' : 'Register'}
                </h2>
                
                <div className="bg-gray-50 rounded-lg p-8 overflow-visible" style={{ width: '100%' }}>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {!isLogin && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(focus.username || username) && (
                          <label className="block text-xs text-blue-600 font-medium transition-all duration-200">
                            Username
                          </label>
                        )}
                        <input
                          type="text"
                          placeholder={(!focus.username && !username) ? 'Enter your username' : ''}
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            if (usernameError) setUsernameError('');
                          }}
                          onFocus={() => {
                            setFocus(f => ({ ...f, username: true }));
                            if (usernameError) setUsernameError('');
                          }}
                          onBlur={() => setFocus(f => ({ ...f, username: false }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                          style={{ width: '100%', boxSizing: 'border-box', height: '48px' }}
                        />
                        {usernameError && (
                          <div className="text-gray-700 text-xs mt-1 bg-gray-100 px-3 py-2 rounded-md shadow-sm border border-gray-200">
                            {usernameError}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(focus.email || email) && (
                        <label className="block text-xs text-blue-600 font-medium transition-all duration-200">
                          Email Address
                        </label>
                      )}
                      <input
                        type="email"
                        placeholder={(!focus.email && !email) ? 'Enter your email' : ''}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        onFocus={() => {
                          setFocus(f => ({ ...f, email: true }));
                          if (emailError) setEmailError('');
                        }}
                        onBlur={() => setFocus(f => ({ ...f, email: false }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                        style={{ width: '100%', boxSizing: 'border-box', height: '48px' }}
                      />
                      {emailError && (
                        <div className="text-gray-700 text-xs mt-1 bg-gray-100 px-3 py-2 rounded-md shadow-sm border border-gray-200">
                          {emailError}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(focus.password || password) && (
                        <label className="block text-xs text-blue-600 font-medium transition-all duration-200">
                          Password
                        </label>
                      )}
                      <input
                        type="password"
                        placeholder={(!focus.password && !password) ? 'Enter your password' : ''}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        onFocus={() => {
                          setFocus(f => ({ ...f, password: true }));
                          if (passwordError) setPasswordError('');
                        }}
                        onBlur={() => setFocus(f => ({ ...f, password: false }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                        style={{ width: '100%', boxSizing: 'border-box', height: '48px' }}
                      />
                      {!isLogin && (
                        <div style={{ 
                          fontSize: '12px', 
                          marginTop: '4px', 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          border: '1px solid #f3f4f6', 
                          backgroundColor: '#fafafa', 
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <svg style={{ width: '12px', height: '12px', marginRight: '8px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Password must be at least 8 characters with at least one uppercase letter and one number.</span>
                        </div>
                      )}
                      {passwordError && (
                        <div className="text-gray-700 text-xs mt-1 bg-gray-100 px-3 py-2 rounded-md shadow-sm border border-gray-200">
                          {passwordError}
                        </div>
                      )}
                    </div>

                    {!isLogin && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(focus.confirmPassword || confirmPassword) && (
                          <label className="block text-xs text-blue-600 font-medium transition-all duration-200">
                            Confirm Password
                          </label>
                        )}
                        <input
                          type="password"
                          placeholder={(!focus.confirmPassword && !confirmPassword) ? 'Confirm your password' : ''}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (confirmPasswordError) setConfirmPasswordError('');
                          }}
                          onFocus={() => {
                            setFocus(f => ({ ...f, confirmPassword: true }));
                            if (confirmPasswordError) setConfirmPasswordError('');
                          }}
                          onBlur={() => setFocus(f => ({ ...f, confirmPassword: false }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                          style={{ width: '100%', boxSizing: 'border-box', height: '48px' }}
                        />
                        {confirmPasswordError && (
                          <div className="text-gray-700 text-xs mt-1 bg-gray-100 px-3 py-2 rounded-md shadow-sm border border-gray-200">
                            {confirmPasswordError}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        
                        // Clear previous errors
                        setEmailError('');
                        setPasswordError('');
                        setUsernameError('');
                        setConfirmPasswordError('');
                        
                        let hasErrors = false;
                        
                        // Check for empty fields first
                        if (!email || email.trim() === '') {
                          setEmailError('Please enter an email address.');
                          hasErrors = true;
                        } else {
                          // Check email format
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(email.trim())) {
                            setEmailError('Please enter an email address.');
                            hasErrors = true;
                          }
                        }
                        
                        if (!password || password.trim() === '') {
                          setPasswordError('Please enter the password.');
                          hasErrors = true;
                        }
                        
                        if (!isLogin) {
                          if (!username || username.trim() === '') {
                            setUsernameError('Please enter a username.');
                            hasErrors = true;
                          }
                          if (!confirmPassword || confirmPassword.trim() === '') {
                            setConfirmPasswordError('Please confirm your password.');
                            hasErrors = true;
                          }
                          // Check password format first, then check if passwords match
                          const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
                          if (!passwordRegex.test(password)) {
                            setPasswordError('Password must be at least 8 characters with at least one uppercase letter and one number.');
                            hasErrors = true;
                          } else if (password !== confirmPassword) {
                            setConfirmPasswordError('Passwords do not match.');
                            hasErrors = true;
                          }
                        }
                        
                        if (hasErrors) {
                          return;
                        }
                        
                        // If all validations pass, submit the form
                        handleSubmit(e);
                      }}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      // not working tailwind classes: color classes. round-corner class
                      className="w-full hover:bg-blue-900 font-medium text-sm flex items-center justify-center space-x-2"
                      style={{ 
                        border: '1px solid #2563eb', 
                        height: '48px',
                        backgroundColor: isHovered ? '#1d4ed8' : '#2563eb', // #2563eb = blue-600
                        color: '#ffffff', // Force white text
                        borderRadius: '0.375rem'
                      }}
                    >
                      <svg style={{ width: '14px', height: '14px' }} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>{isLogin ? 'Sign In' : 'Register'}</span>
                    </button>
                  </form>

                  {/* Action buttons */}
                  <div style={{ marginTop: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {isLogin ? (
                      <>
                        {/* Login page: Two buttons in same line */}
                        <div className="w-full max-w-md mx-auto flex gap-4 mt-2">
                          <button
                            onClick={() => {
                              setIsLogin(!isLogin);
                              setErrorMessage('');
                              setEmailError('');
                              setPasswordError('');
                              setUsernameError('');
                              setConfirmPasswordError('');
                              setEmail('');
                              setPassword('');
                              setConfirmPassword('');
                              setUsername('');
                            }}
                            className="w-1/2 h-12 bg-white border border-gray-200 rounded-md font-medium flex items-center justify-center hover:bg-gray-50 transition space-x-2"
                            type="button"
                          >
                            <svg style={{ width: '16px', height: '16px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Need to register?</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setErrorMessage('Forgot password functionality coming soon!');
                            }}
                            className="w-1/2 h-12 bg-white border border-gray-200 rounded-md font-medium flex items-center justify-center hover:bg-gray-50 transition space-x-2"
                            type="button"
                          >
                            <svg style={{ width: '16px', height: '16px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span>Forgot Password</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Register page: Full width button */}
                        <button
                          onClick={() => {
                            setIsLogin(!isLogin);
                            setErrorMessage('');
                            setEmailError('');
                            setPasswordError('');
                            setUsernameError('');
                            setConfirmPasswordError('');
                            setEmail('');
                            setPassword('');
                            setConfirmPassword('');
                            setUsername('');
                          }}
                          className="w-full bg-white text-blue-600 flex items-center justify-center gap-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium text-sm"
                          style={{ height: '48px' }}
                        >
                          <svg style={{ width: '12px', height: '12px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>Have an account?</span>
                        </button>
                      </>
                    )}

                    {/* Language selector */}
                    <div className="pt-2 flex justify-center">
                      <button className="bg-white text-gray-500 text-xs flex items-center gap-1 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200"
                        style={{ height: '48px', padding: '0 16px' }}>
                        <svg style={{ width: '12px', height: '12px' }} className="text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>EN</span>
                        <svg style={{ width: '8px', height: '8px' }} className="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Cancel button */}
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setErrorMessage('');
                          setEmail('');
                          setPassword('');
                          setConfirmPassword('');
                          setUsername('');
                          setEmailError('');
                          setPasswordError('');
                          setUsernameError('');
                          setConfirmPasswordError('');
                          setIsLogin(true);
                        }}
                        className="bg-white text-gray-500 text-xs flex items-center gap-1 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200"
                        style={{ height: '48px', padding: '0 16px' }}
                      >
                        <svg style={{ width: '12px', height: '12px' }} className="text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome to Our Platform
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Please sign in or register to continue
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex items-center space-x-2 mx-auto"
                >
                  <svg style={{ width: '18px', height: '18px' }} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
                {showErrorDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              margin: '0 16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${errorMessage.includes('successful') ? 'text-green-600' : 'text-gray-900'}`}>
                  {errorMessage.includes('successful') ? 'Success' : 'Message'}
                </h3>
                <button
                  onClick={() => setShowErrorDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center mb-4">
                {errorMessage.includes('successful') && (
                  <svg style={{ width: '20px', height: '20px' }} className="text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <p className={`${errorMessage.includes('successful') ? 'text-green-700' : 'text-gray-700'}`}>{errorMessage}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorDialog(false)}
                  className={`px-4 py-2 text-white rounded-md transition ${
                    errorMessage.includes('successful') 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Welcome page after authentication
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyles }} />
      <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Area */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-xl font-semibold text-gray-800">
            Welcome, {username || 'User'}
          </span>
        </div>

        {/* Center - Empty space */}
        <div className="flex-1"></div>

        {/* Right side - Language, Settings, Logout */}
        <div className="flex items-center space-x-4">
          
          <div className="relative">
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="text-gray-600 hover:text-gray-800 transition p-2 rounded hover:bg-gray-100" 
              title="Language"
            >
              <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </button>
            
            {/* Language Dropdown */}
            {showLanguageDropdown && (
              <div 
                className="absolute top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                style={{ 
                  right: '0',
                  transform: 'translateX(0)',
                  width: '200px',
                  backgroundColor: '#ffffff',
                  backdropFilter: 'none'
                }}
              >
                <div className="py-1 bg-white">
                  <div className="px-3 py-1 text-xs font-normal text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-white">
                    Language
                  </div>
                  {['Auto-detect', 'English', 'Spanish', 'French'].map((language) => (
                    <button
                      key={language}
                      onClick={() => {
                        setSelectedLanguage(language);
                        setShowLanguageDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition ${
                        selectedLanguage === language ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* API Key Status Indicator */}
          <div className="relative">
            <button 
              onClick={() => {
                setSelectedSettingCategory('security');
                setShowSettingsDropdown(true);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition ${
                apiKeyLoading
                  ? 'bg-gray-50 text-gray-500 border border-gray-200 cursor-not-allowed'
                  : hasStoredApiKey 
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                    : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
              }`}
              title={
                hasStoredApiKey 
                  ? `API Key is stored securely\nLast used: ${apiKeyStatus?.lastUsedAt ? new Date(apiKeyStatus.lastUsedAt).toLocaleDateString() : 'Never'}\nCreated: ${apiKeyStatus?.createdAt ? new Date(apiKeyStatus.createdAt).toLocaleDateString() : 'Unknown'}`
                  : 'API Key not stored - click to manage'
              }
            >
              <svg style={{ width: '14px', height: '14px' }} className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="text-xs font-medium">
                {apiKeyLoading ? 'Checking...' : (hasStoredApiKey ? 'API Key ✓' : 'API Key ○')}
              </span>
            </button>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => {
                setSelectedSettingCategory('general');
                setShowSettingsDropdown(true);
              }}
              className="text-gray-600 hover:text-gray-800 transition p-2 rounded hover:bg-gray-100" 
              title="Settings"
            >
              <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Settings Modal */}
            {showSettingsDropdown && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  maxWidth: '800px',
                  width: '90%',
                  height: '600px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Settings
                    </h3>
                    <button
                      onClick={() => setShowSettingsDropdown(false)}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Categories */}
                    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
                      <div className="space-y-1">
                        {/* General */}
                        <button
                          onClick={() => setSelectedSettingCategory('general')}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition ${
                            selectedSettingCategory === 'general' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">General</span>
                        </button>
                        
                        {/* Notifications */}
                        <button
                          onClick={() => setSelectedSettingCategory('notifications')}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition ${
                            selectedSettingCategory === 'notifications' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.19A2 2 0 004 6v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-1.81 1.19z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Notifications</span>
                        </button>
                        
                        {/* Personalization */}
                        <button
                          onClick={() => setSelectedSettingCategory('personalization')}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition ${
                            selectedSettingCategory === 'personalization' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Personalization</span>
                        </button>
                        
                        {/* Data Controls */}
                        <button
                          onClick={() => setSelectedSettingCategory('data')}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition ${
                            selectedSettingCategory === 'data' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Data Controls</span>
                        </button>
                        
                        {/* Security */}
                        <button
                          onClick={() => setSelectedSettingCategory('security')}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition ${
                            selectedSettingCategory === 'security' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Security</span>
                        </button>
                        
                        {/* Account */}
                        <button
                          onClick={() => setSelectedSettingCategory('account')}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition ${
                            selectedSettingCategory === 'account' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Account</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Right Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      {selectedSettingCategory === 'general' && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-6">General</h4>
                          <div className="space-y-6">
                            {/* Theme */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Theme</span>
                              <select className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white">
                                <option>System</option>
                                <option>Light</option>
                                <option>Dark</option>
                              </select>
                            </div>
                            

                          </div>
                        </div>
                      )}
                      
                      {selectedSettingCategory === 'security' && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-6">Security</h4>
                          <div className="space-y-6">
                            {/* Success/Error Messages */}
                            {apiKeySuccess && (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <div className="flex items-center">
                                  <svg style={{ width: '16px', height: '16px' }} className="text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm text-green-800">{apiKeySuccess}</span>
                                </div>
                              </div>
                            )}
                            {apiKeyError && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <div className="flex items-center">
                                  <svg style={{ width: '16px', height: '16px' }} className="text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="text-sm text-red-800">{apiKeyError}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* API Key Management */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <h5 className="text-sm font-semibold text-gray-800 mb-4">API Key Management</h5>
                              
                              {/* Status */}
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-700">Status:</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  hasStoredApiKey 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                  {hasStoredApiKey ? '✓ Stored' : '○ Not stored'}
                                </span>
                              </div>
                              
                              {/* Details */}
                              {hasStoredApiKey && apiKeyStatus && (
                                <div className="text-xs text-gray-500 space-y-1 mb-4">
                                  <div>Last used: {apiKeyStatus.lastUsedAt ? new Date(apiKeyStatus.lastUsedAt).toLocaleDateString() : 'Never'}</div>
                                  <div>Created: {apiKeyStatus.createdAt ? new Date(apiKeyStatus.createdAt).toLocaleDateString() : 'Unknown'}</div>
                                </div>
                              )}
                              
                              {/* Action Button */}
                              {hasStoredApiKey ? (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-gray-700">API Key</div>
                                    <div className="text-xs text-gray-500">Securely stored</div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setShowDeleteApiKeyModal(true);
                                      setShowSettingsDropdown(false);
                                    }}
                                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 text-center py-2">
                                  No API key stored
                                </div>
                              )}
                            </div>
                            
                            {/* Password Management */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <h5 className="text-sm font-semibold text-gray-800 mb-4">Password Management</h5>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-700">Password</div>
                                  <div className="text-xs text-gray-500">Last changed: 3 months ago</div>
                                </div>
                                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                                  Change
                                </button>
                              </div>
                            </div>
                            

                          </div>
                        </div>
                      )}
                      
                      {/* Account Settings */}
                      {selectedSettingCategory === 'account' && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-6">Account</h4>
                          <div className="space-y-6">
                            {/* User ID Display and Edit */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <h5 className="text-sm font-semibold text-blue-800 mb-4">User Information</h5>
                              
                              <div className="space-y-3">
                                
                                {/* Username (Editable) */}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-blue-700">Username:</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-blue-900">{username || 'Not set'}</span>
                                    {isAuthenticated && (
                                      <button
                                        onClick={async () => {
                                          const newUsername = prompt('Enter new username:', username);
                                          if (newUsername && newUsername.trim()) {
                                            try {
                                              const result = await userService.updateProfile(userId, newUsername.trim());
                                              setUsername(newUsername.trim());
                                              showToastNotification('Username updated successfully!', 'success');
                                            } catch (error) {
                                              console.error('Failed to update username:', error);
                                              showToastNotification(error.message || 'Failed to update username', 'error');
                                            }
                                          }
                                        }}
                                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                        title="Change Username"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Authentication Status */}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-blue-700">Status:</span>
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    isAuthenticated 
                                      ? 'bg-green-100 text-green-800 border border-green-200' 
                                      : 'bg-red-100 text-red-800 border border-red-200'
                                  }`}>
                                    {isAuthenticated ? '✓ Authenticated' : '○ Not authenticated'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            

                            
                            {/* Password */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-700">Password</div>
                                <div className="text-xs text-gray-500">Last changed: 3 months ago</div>
                              </div>
                              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                                Change
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Placeholder content for other categories */}
                      {selectedSettingCategory !== 'general' && selectedSettingCategory !== 'security' && selectedSettingCategory !== 'account' && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-6 capitalize">{selectedSettingCategory}</h4>
                          <div className="text-center py-12">
                            <svg style={{ width: '48px', height: '48px' }} className="mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500">Settings for {selectedSettingCategory} will be implemented soon.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className="text-gray-600 hover:text-gray-800 transition p-2 rounded hover:bg-gray-100"
            title="Logout"
          >
            <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Task Area */}
      <div className="flex-1 flex">
        {/* Project Sidebar */}
        <div 
          ref={sidebarRef}
          className={`bg-white border-r border-gray-200 transition-all duration-300 relative flex-shrink-0 ${sidebarCollapsed ? 'w-12' : ''}`}
          style={{ width: sidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            {!sidebarCollapsed && <span className="font-semibold text-gray-800">Projects</span>}
            <div className="flex items-center space-x-2">
              {!sidebarCollapsed && (
                <button
                  onClick={addProject}
                  className="p-1 rounded hover:bg-blue-100 transition bg-blue-50"
                  title="New Project"
                >
                  <svg style={{ width: '14px', height: '14px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded hover:bg-gray-100 transition bg-gray-50"
                title={sidebarCollapsed ? "Expand" : "Collapse"}
              >
                <svg style={{ width: '14px', height: '14px' }} className={`text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="p-2">
              {projects.map(project => (
                <div key={project.id} className="mb-2">
                  <div
                    className={`flex items-center justify-between p-2 rounded cursor-pointer group ${
                      selectedPage.projectId === project.id 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'hover:bg-blue-50'
                    } ${
                      isDraggingProject && draggedProject === project.id ? 'opacity-50' : ''
                    } ${
                      dragOverProject === project.id ? 'border-l-2 border-l-blue-500 bg-blue-100' : ''
                    }`}
                    style={{ 
                      cursor: isDraggingProject ? 'grabbing' : 'grab'
                    }}
                    onClick={() => {
                      if (!isDraggingProject) {
                        toggleProjectExpansion(project.id);
                      }
                    }}
                    onContextMenu={(e) => handleProjectContextMenu(e, project.id)}
                    draggable={true}
                    onDragStart={(e) => handleProjectDragStart(e, project.id)}
                    onDragEnter={(e) => handleProjectDragOver(e, project.id)}
                    onDragOver={(e) => handleProjectDragOver(e, project.id)}
                    onDragLeave={handleProjectDragLeave}
                    onDrop={(e) => handleProjectDrop(e, project.id)}
                    onDragEnd={handleProjectDragEnd}
                  >
                    <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                      <svg style={{ width: '12px', height: '12px' }} className="text-gray-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      {project.pages && project.pages.length > 0 && (
                        <svg 
                          style={{ width: '12px', height: '12px' }} 
                          className={`text-gray-500 mr-2 transition-transform ${(project.isExpanded || project.expanded) ? 'rotate-90' : ''} flex-shrink-0`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      <svg style={{ width: '14px', height: '14px' }} className="text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {editingItem.type === 'project' && editingItem.id === project.id ? (
                        <input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          onBlur={() => handleEditSave(editingItem.name)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditSave(editingItem.name);
                            } else if (e.key === 'Escape') {
                              handleEditCancel();
                            }
                          }}
                          className="text-sm text-gray-700 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 flex-1 min-w-0"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <span 
                            className={`text-sm block w-full ${
                              selectedPage.projectId === project.id 
                                ? 'text-blue-800 font-semibold' 
                                : 'text-gray-700'
                            }`}
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={project.name}
                          >
                            {project.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addPage(project.id);
                      }}
                      className="p-1 rounded hover:bg-green-100 transition opacity-0 group-hover:opacity-100 bg-green-50"
                      title="Add Page"
                    >
                      <svg style={{ width: '12px', height: '12px' }} className="text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  

                  

                  
                  {/* Project Pages */}
                                        {(project.isExpanded || project.expanded) && (
                    <div className="ml-6 space-y-1">
                      {/* Drop zone for empty project or before first page */}
                      <div
                        className={`h-2 rounded transition-colors ${
                          dragOverPage?.projectId === project.id && dragOverPage?.pageId === 'empty' ? 'bg-green-200 border border-green-400' : 'bg-transparent'
                        }`}
                        style={{ marginLeft: '20px' }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedPage && (draggedPage.projectId !== project.id || draggedPage.pageId !== 'empty')) {
                            setDragOverPage({ projectId: project.id, pageId: 'empty' });
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dragOverPage?.projectId === project.id && dragOverPage?.pageId === 'empty') {
                            setDragOverPage(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedPage && (draggedPage.projectId !== project.id || draggedPage.pageId !== 'empty')) {
                            handlePageDrop(e, project.id, 'empty');
                          }
                        }}
                      />
                      
                      {(project.pages || []).map((page, index) => (
                        <div key={page.id}>
                          {/* Drop zone between pages */}
                          {index > 0 && (
                            <div
                              className={`h-2 rounded transition-colors ${
                                dragOverPage?.projectId === project.id && dragOverPage?.pageId === `between-${page.id}` ? 'bg-green-200 border border-green-400' : 'bg-transparent'
                              }`}
                              style={{ marginLeft: '20px' }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedPage && (draggedPage.projectId !== project.id || draggedPage.pageId !== `between-${page.id}`)) {
                                  setDragOverPage({ projectId: project.id, pageId: `between-${page.id}` });
                                }
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (dragOverPage?.projectId === project.id && dragOverPage?.pageId === `between-${page.id}`) {
                                  setDragOverPage(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedPage && (draggedPage.projectId !== project.id || draggedPage.pageId !== `between-${page.id}`)) {
                                  handlePageDrop(e, project.id, `between-${page.id}`);
                                }
                              }}
                            />
                          )}
                          
                          <div
                            className={`flex items-center p-1.5 rounded cursor-pointer group ${
                              selectedPage.projectId === project.id && selectedPage.pageId === page.id 
                                ? 'bg-green-100 border border-green-300' 
                                : 'hover:bg-green-50'
                            } ${
                              isDraggingPage && draggedPage?.projectId === project.id && draggedPage?.pageId === page.id ? 'opacity-50' : ''
                            } ${
                              dragOverPage?.projectId === project.id && dragOverPage?.pageId === page.id ? 'border-l-2 border-l-green-500 bg-green-100' : ''
                            }`}
                            style={{ 
                              marginLeft: '20px',
                              cursor: isDraggingPage ? 'grabbing' : 'grab'
                            }}
                            onClick={() => {
                              if (!isDraggingPage) {
                                selectPage(project.id, page.id);
                              }
                            }}
                            onContextMenu={(e) => handlePageContextMenu(e, project.id, page.id)}
                            draggable={true}
                            onDragStart={(e) => handlePageDragStart(e, project.id, page.id)}
                            onDragEnter={(e) => handlePageDragOver(e, project.id, page.id)}
                            onDragOver={(e) => handlePageDragOver(e, project.id, page.id)}
                            onDragLeave={handlePageDragLeave}
                            onDrop={(e) => handlePageDrop(e, project.id, page.id)}
                            onDragEnd={handlePageDragEnd}
                          >
                            <svg style={{ width: '10px', height: '10px' }} className="text-gray-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <svg style={{ width: '12px', height: '12px' }} className="text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {editingItem.type === 'page' && editingItem.id.projectId === project.id && editingItem.id.pageId === page.id ? (
                              <input
                                type="text"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                onBlur={() => handleEditSave(editingItem.name)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditSave(editingItem.name);
                                  } else if (e.key === 'Escape') {
                                    handleEditCancel();
                                  }
                                }}
                                className="text-xs text-gray-600 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 flex-1 min-w-0"
                                autoFocus
                              />
                            ) : (
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <span 
                                  className={`text-xs block w-full ${
                                    selectedPage.projectId === project.id && selectedPage.pageId === page.id 
                                      ? 'text-green-800 font-semibold' 
                                      : 'text-gray-600'
                                  }`}
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={page.name}
                                >
                                  {page.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Drop zone after last page */}
                      {project.pages && project.pages.length > 0 && (
                        <div
                          className={`h-2 rounded transition-colors ${
                            dragOverPage?.projectId === project.id && dragOverPage?.pageId === 'end' ? 'bg-green-200 border border-green-400' : 'bg-transparent'
                          }`}
                          style={{ marginLeft: '20px' }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (draggedPage && (draggedPage.projectId !== project.id || draggedPage.pageId !== 'end')) {
                              setDragOverPage({ projectId: project.id, pageId: 'end' });
                            }
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragOverPage?.projectId === project.id && dragOverPage?.pageId === 'end') {
                              setDragOverPage(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (draggedPage && (draggedPage.projectId !== project.id || draggedPage.pageId !== 'end')) {
                              handlePageDrop(e, project.id, 'end');
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors z-10 bg-gray-200"
              onMouseDown={handleMouseDown}
              style={{ 
                cursor: isResizing ? 'col-resize' : 'col-resize',
                background: isResizing ? '#3B82F6' : '#e5e7eb'
              }}
            />
          )}
        </div>

        {/* Information Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab Bar */}
          <div className="bg-white border-b border-gray-200 flex items-center">
            {/* Left scroll arrow - Fixed on left side */}
            {showLeftArrow && (
              <button
                onClick={scrollTabsLeft}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition flex-shrink-0 border-r border-gray-200 bg-white"
                title="Scroll Left"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Scrollable tabs container */}
            <div className="flex-1 relative overflow-hidden min-w-0" style={{ maxWidth: 'calc(100vw - 400px)' }}>
              <div
                ref={tabContainerRef}
                className="flex items-center bg-white overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={handleTabScroll}
              >
                {(() => {
                  const currentProject = projects.find(p => p.id === selectedPage.projectId);
                  const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                  const currentTabs = currentPage?.tabs || [];
                  
                  return currentTabs.map(tab => (
                    <div
                      key={tab.id}
                      className={`flex items-center px-4 py-2 border-r border-gray-200 cursor-pointer group ${
                        (tab.isActive || tab.active) ? 'bg-blue-50 border-b-2 border-blue-500' : 'hover:bg-gray-50'
                      } ${
                        isDragging && draggedTab === tab.id ? 'opacity-50' : ''
                      } ${
                        dragOverTab === tab.id ? 'border-l-2 border-l-blue-500 bg-blue-100' : ''
                      } ${
                        tab.locked ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''
                      }`}
                      style={{ 
                        cursor: isDragging ? 'grabbing' : 'grab',
                        minWidth: '180px',
                        maxWidth: '180px',
                        flexShrink: 0
                      }}
                      onClick={async (e) => {
                        if (!isDragging) {
                          await selectTab(tab.id);
                        }
                      }}
                      onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                      draggable={true}
                      onDragStart={(e) => handleTabDragStart(e, tab.id)}
                      onDragEnter={(e) => handleTabDragEnter(e, tab.id)}
                      onDragOver={(e) => handleTabDragOver(e, tab.id)}
                      onDragLeave={handleTabDragLeave}
                      onDrop={(e) => handleTabDrop(e, tab.id)}
                      onDragEnd={handleTabDragEnd}
                    >
                      <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                        <svg style={{ width: '12px', height: '12px' }} className="text-gray-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        {editingItem.type === 'tab' && editingItem.id.projectId === selectedPage.projectId && editingItem.id.pageId === selectedPage.pageId && editingItem.id.tabId === tab.id ? (
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            onBlur={() => handleEditSave(editingItem.name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditSave(editingItem.name);
                              } else if (e.key === 'Escape') {
                                handleEditCancel();
                              }
                            }}
                            className="text-sm text-gray-700 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 flex-1 min-w-0"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <span 
                              className="text-sm text-gray-700 block w-full"
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={tab.name}
                            >
                              {tab.name}
                            </span>
                          </div>
                        )}
                      </div>
                      {currentTabs.length > 1 && !tab.locked && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await closeTab(tab.id);
                          }}
                          className="ml-2 p-1 rounded hover:bg-red-100 transition opacity-0 group-hover:opacity-100 bg-red-50 flex-shrink-0"
                          title="Close Tab"
                        >
                          <svg style={{ width: '10px', height: '10px' }} className="text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {tab.locked && (
                        <div className="ml-2 p-1 flex-shrink-0" title="Tab is locked">
                          <svg style={{ width: '10px', height: '10px' }} className="text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            {/* Right scroll arrow - Fixed on right side */}
            {showRightArrow && (
              <button
                onClick={scrollTabsRight}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition flex-shrink-0 border-l border-gray-200 bg-white"
                title="Scroll Right"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {/* Fixed right side controls - positioned at far right edge */}
            <div className="flex items-center flex-shrink-0 bg-white border-l border-gray-200 ml-auto">
              {/* Tab Dropdown button */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTabDropdown(!showTabDropdown);
                  }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                  title="Tab Menu"
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu - Right-aligned to dropdown button */}
                {showTabDropdown && (
                  <div 
                    className="absolute top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                    style={{ 
                      right: '0',
                      transform: 'translateX(0)',
                      width: '280px',
                      backgroundColor: '#ffffff',
                      backdropFilter: 'none'
                    }}
                  >
                    <div className="py-1 bg-white">
                      <div className="px-3 py-1 text-xs font-normal text-gray-200 uppercase tracking-wider border-b border-gray-100 bg-white">
                        Current tabs
                      </div>
                      {(() => {
                        const currentProject = projects.find(p => p.id === selectedPage.projectId);
                        const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                        const currentTabs = currentPage?.tabs || [];
                        
                        return currentTabs.map(tab => (
                          <div
                            key={tab.id}
                            className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                              isDropdownDragging && dropdownDraggedTab === tab.id ? 'opacity-50' : ''
                            } ${
                              dropdownDragOverTab === tab.id ? 'border-l-2 border-l-blue-500 bg-blue-100' : ''
                            }`}
                            style={{ 
                              cursor: isDropdownDragging ? 'grabbing' : 'grab'
                            }}
                            onClick={async () => {
                              if (!isDropdownDragging) {
                                await selectTab(tab.id);
                                setShowTabDropdown(false);
                              }
                            }}
                            draggable={true}
                            onDragStart={(e) => handleDropdownDragStart(e, tab.id)}
                            onDragEnter={(e) => handleDropdownDragEnter(e, tab.id)}
                            onDragOver={(e) => handleDropdownDragOver(e, tab.id)}
                            onDragLeave={handleDropdownDragLeave}
                            onDrop={(e) => handleDropdownDrop(e, tab.id)}
                            onDragEnd={handleDropdownDragEnd}
                          >
                            <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                              <svg style={{ width: '12px', height: '12px' }} className="text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                              {editingItem.type === 'tab' && editingItem.id.projectId === selectedPage.projectId && editingItem.id.pageId === selectedPage.pageId && editingItem.id.tabId === tab.id ? (
                                <input
                                  type="text"
                                  value={editingItem.name}
                                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                  onBlur={() => handleEditSave(editingItem.name)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditSave(editingItem.name);
                                    } else if (e.key === 'Escape') {
                                      handleEditCancel();
                                    }
                                  }}
                                  className="text-sm text-gray-700 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 flex-1 min-w-0"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <span 
                                    className="text-sm text-gray-700 block w-full"
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={tab.name}
                                  >
                                    {tab.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            {currentTabs.length > 1 && !tab.locked && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await closeTab(tab.id);
                                  setShowTabDropdown(false);
                                }}
                                className="ml-2 p-1 rounded hover:bg-red-100 transition"
                                title="Close Tab"
                              >
                                <svg style={{ width: '10px', height: '10px' }} className="text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            {tab.locked && (
                              <div className="ml-2 p-1 flex-shrink-0" title="Tab is locked">
                                <svg style={{ width: '10px', height: '10px' }} className="text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Add Tab button - Fixed on far right */}
              <button
                onClick={addTab}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-blue-100 transition bg-blue-50"
                title="Add Tab"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {(() => {
              const currentProject = projects.find(p => p.id === selectedPage.projectId);
              const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
              
              // No projects
              if (projects.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg style={{ width: '64px', height: '64px' }} className="mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-600">Create your first project and its page to start</p>
                    </div>
                  </div>
                );
              }
              
              // Check if any project has pages
              const hasAnyPages = projects.some(project => project.pages && project.pages.length > 0);
              
              // Have projects but no pages in any project
              if (!hasAnyPages) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg style={{ width: '64px', height: '64px' }} className="mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages yet</h3>
                      <p className="text-gray-600">Add a page to your project to create tabs</p>
                    </div>
                  </div>
                );
              }
              
              // Have pages but no page is selected
              if (!currentPage) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg style={{ width: '64px', height: '64px' }} className="mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a page</h3>
                      <p className="text-gray-600">Choose a page from the sidebar to manage tabs</p>
                    </div>
                  </div>
                );
              }
              
              // Have projects and pages, show tab content
              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{(() => {
                    const currentProject = projects.find(p => p.id === selectedPage.projectId);
                    const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                    const activeTab = findActiveTabOrWelcome(currentPage?.tabs);
                    return activeTab?.name || 'Welcome';
                  })()}</span>
                </h2>
                <select 
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm flex items-center space-x-2 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
                  value={(() => {
                    const currentProject = projects.find(p => p.id === selectedPage.projectId);
                    const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                    const activeTab = findActiveTabOrWelcome(currentPage?.tabs);
                    return mapTabTypeToDisplayName(activeTab?.type || activeTab?.tabType) || 'Design Tables';
                  })()}
                  onChange={(e) => {
                    const currentProject = projects.find(p => p.id === selectedPage.projectId);
                    const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                    const activeTab = findActiveTabOrWelcome(currentPage?.tabs);
                    if (activeTab) {
                      handleTabTypeChange(activeTab.id, e.target.value);
                    }
                  }}
                >
                  <option>Design Tables</option>
                  <option>Snow Load</option>
                  <option>Wind Load</option>
                  <option>Seismic Template</option>
                </select>
              </div>
              
              <div className="text-gray-600">
                {(() => {
                  const currentProject = projects.find(p => p.id === selectedPage.projectId);
                  const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                  const activeTab = findActiveTabOrWelcome(currentPage?.tabs);
                  
                  // Only create Welcome tab if NO tabs exist at all (not just no active tab)
                  if (currentPage && (!currentPage.tabs || currentPage.tabs.length === 0)) {
                    console.log('No tabs found, creating Welcome tab for page:', currentPage.id);
                    createWelcomeTabIfNeeded(currentPage.id);
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Creating Welcome tab...</p>
                        </div>
                      </div>
                    );
                  }

                  // If tabs exist but no active tab, this should be handled by findActiveTabOrWelcome
                  if (!activeTab) {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-gray-600">Loading tab content...</p>
                        </div>
                      </div>
                    );
                  }
                  
                  if (activeTab?.type === 'snow_load' || activeTab?.tabType === 'snow_load') {
                    const tabKey = `${selectedPage.projectId}_${selectedPage.pageId}_${activeTab.id}`;
                    const snowDefaults = {
                      location: 'North Vancouver',
                      slope: 1,
                      is: 1,
                      ca: 1,
                      cb: 0.8
                    };
                    // Use merged data from database + template, fallback to local state for immediate updates
                    const mergedSnowDefaults = activeTab.mergedData?.snowDefaults || {};
                    const localSnowData = snowLoadTabData[tabKey] || {};
                    const data = { ...snowDefaults, ...mergedSnowDefaults, ...localSnowData };
                    
                    const handleSnowChange = async (field, value) => {
                      // Update local state immediately for responsive UI
                      setSnowLoadTabData(prev => ({
                        ...prev,
                        [tabKey]: {
                          ...prev[tabKey],
                          [field]: value
                        }
                      }));
                      
                      // Save to database via workspace service (DELTA ONLY)
                      try {
                        // Only send the changed field, not the entire structure
                        const deltaData = {
                          snowDefaults: {
                            [field]: value
                          }
                        };
                        await workspaceStateService.updateTabData(activeTab.id, 'snow_load', deltaData);
                      } catch (error) {
                        console.error('Error saving snow load data:', error);
                        showToastNotification('Failed to save changes: ' + error.message, 'error');
                      }
                    };

                    // Snow Drifting Load Calculator state and calculations
                    const driftDefaults = {
                      // General Input
                      a: 1.0, // Horizontal gap between upper and lower roofs
                      h: 5.0, // Difference in elevation between lower roof surface and top of the parapet of the upper roof
                      hp_lower: 2.0, // Parapet height of lower-roof source area
                      x: 3.0, // Optional: Point of interest
                      
                      // Case 1 Input
                      ws_upper: 10.0, // Shorter dimension of (upper roof) source area in Case 1
                      ls_upper: 15.0, // Longer dimension of (upper roof) source area in Case 1
                      hp_upper: 1.0, // Parapet height of upper-roof source area in Case 1
                      
                      // Case 2 Input
                      ws_lower2: 15.0, // Shorter dimension of (lower roof) source area in Case 2
                      ls_lower2: 20.0, // Longer dimension of (lower roof) source area in Case 2
                      
                      // Case 3 Input
                      ws_lower3: 15.0, // Shorter dimension of (lower roof) source area in Case 3
                      ls_lower3: 25.0, // Longer dimension of (lower roof) source area in Case 3
                      
                      // Additional parameters needed for calculations
                      Ss: 2.0, // Ground snow load (kPa)
                      Sr: 0.0, // Rain load (kPa) - will be updated from location data
                      γ: 3.0, // Snow density (kN/m³)
                      Cb: 1.0, // Basic roof snow load factor
                      Cs_default: 1.0, // Default slope factor
                      Is: 1.0, // Importance factor
                      Ca: 1.0, // Accumulation factor
                      Cw: 1.0 // Wind factor
                    };

                    // Use merged data from database + template, fallback to local state for immediate updates
                    const mergedDriftDefaults = activeTab.mergedData?.driftDefaults || {};
                    const localDriftData = snowLoadTabData[tabKey] || {};
                    const driftData = { ...driftDefaults, ...mergedDriftDefaults, ...localDriftData };
                    
                    // Sync drift inputs with current Snow Load table (B2–B18) for live updates
                    const driftLocationData = snowLoadData.find(item => item.city === data.location);
                    const ssLive = driftLocationData?.groundSnowLoadKpa ?? driftData.Ss;
                    const srLive = driftLocationData?.rainSnowLoadKpa ?? driftData.Sr;
                    const alphaLive = Math.atan((data.slope || 0) / 12) * (180 / Math.PI);
                    const gammaLive = Math.min(4, 0.43 * ssLive + 2.2);
                    const csLive = alphaLive <= 30 ? 1 : (alphaLive > 70 ? 0 : (70 - alphaLive) / 40);
                    driftData.Ss = ssLive;            // B7
                    driftData.Sr = srLive;            // B8
                    driftData.γ = gammaLive;          // B10
                    driftData.Cb = data.cb;           // B6
                    driftData.Cw = driftData.Cw;      // B12 - Use the value from driftDefaults
                    driftData.Cs_default = csLive;    // B13
                    driftData.Is = data.is;           // B4
                    // Keep an explicit field for display-only distribution table
                    driftData.Ss_for_distribution = ssLive;

                    const handleDriftChange = async (field, value) => {
                      // Update local state immediately for responsive UI
                      setSnowLoadTabData(prev => ({
                        ...prev,
                        [tabKey]: {
                          ...prev[tabKey],
                          [field]: value
                        }
                      }));
                      
                      // Save to database via workspace service (DELTA ONLY)
                      try {
                        // Only send the changed drift field, not the entire structure
                        const deltaData = {
                          driftDefaults: {
                            [field]: value
                          }
                        };
                        await workspaceStateService.updateTabData(activeTab.id, 'snow_load', deltaData);
                      } catch (error) {
                        console.error('Error saving drift data:', error);
                        showToastNotification('Failed to save changes: ' + error.message, 'error');
                      }
                    };

                    // Case I Calculations
                    const caseI_Ics = 2 * Math.min(driftData.ws_upper, driftData.ls_upper) - Math.pow(Math.min(driftData.ws_upper, driftData.ls_upper), 2) / Math.max(driftData.ws_upper, driftData.ls_upper);
                    const caseI_hp_prime = Math.max(0, Math.min(driftData.hp_upper - 0.8 * driftData.Ss / driftData.γ, caseI_Ics / 5));
                    const caseI_F = Math.min(0.35 * 1.00 * Math.sqrt(driftData.γ * (caseI_Ics - 5 * caseI_hp_prime) / driftData.Ss) + driftData.Cb, 5);
                    const caseI_Ca0_1 = caseI_F / driftData.Cb;
                    const caseI_Ca0_2 = 1.00 * driftData.γ * driftData.h / (driftData.Cb * driftData.Ss);
                    const caseI_Ca0_I = (driftData.a > 5 || driftData.h <= 0.8 * driftData.Ss / driftData.γ) ? "NOT APPLICABLE" : Math.min(caseI_Ca0_1, caseI_Ca0_2);
                    const caseI_xd_I = 5 * driftData.Cb * driftData.Ss / driftData.γ * (caseI_Ca0_I - 1);

                    const caseI = {
                      β: 1.00,
                      Ics: caseI_Ics,
                      Cw: 1.00,
                      hp_prime: caseI_hp_prime,
                      Cs: driftData.h > 0 ? 1 : driftData.Cs_default,
                      F: caseI_F,
                      Ca0_1: caseI_Ca0_1,
                      Ca0_2: caseI_Ca0_2,
                      Ca0_I: caseI_Ca0_I,
                      xd_I: caseI_xd_I
                    };

                    // Case II Calculations
                    const caseII_Ics = 2 * Math.min(driftData.ws_lower2, driftData.ls_lower2) - Math.pow(Math.min(driftData.ws_lower2, driftData.ls_lower2), 2) / Math.max(driftData.ws_lower2, driftData.ls_lower2);
                    const caseII_hp_prime = Math.max(0, Math.min(driftData.hp_lower - 0.8 * driftData.Ss / driftData.γ, caseII_Ics / 5));
                    const caseII_F = Math.min(0.35 * 0.67 * Math.sqrt(driftData.γ * (caseII_Ics - 5 * caseII_hp_prime) / driftData.Ss) + driftData.Cb, 5);
                    const caseII_Ca0_1 = caseII_F / driftData.Cb;
                    const caseII_Ca0_2 = 0.67 * driftData.γ * driftData.h / (driftData.Cb * driftData.Ss);
                    const caseII_Ca0_II = (driftData.a > 5 || driftData.h <= 0.8 * driftData.Ss / driftData.γ) ? "NOT APPLICABLE" : Math.min(caseII_Ca0_1, caseII_Ca0_2);
                    const caseII_xd_II = 5 * driftData.Cb * driftData.Ss / driftData.γ * (caseII_Ca0_II - 1);

                    const caseII = {
                      β: 0.67,
                      Ics: caseII_Ics,
                      Cw: 1.00,
                      hp_prime: caseII_hp_prime,
                      Cs: driftData.h > 0 ? 1 : driftData.Cs_default,
                      F: caseII_F,
                      Ca0_1: caseII_Ca0_1,
                      Ca0_2: caseII_Ca0_2,
                      Ca0_II: caseII_Ca0_II,
                      xd_II: caseII_xd_II
                    };

                    // Case III Calculations
                    const caseIII_Ics = 2 * Math.min(driftData.ws_lower3, driftData.ls_lower3) - Math.pow(Math.min(driftData.ws_lower3, driftData.ls_lower3), 2) / Math.max(driftData.ws_lower3, driftData.ls_lower3);
                    const caseIII_hp_prime = Math.max(0, Math.min(driftData.hp_lower - 0.8 * driftData.Ss / driftData.γ, caseIII_Ics / 5));
                    const caseIII_F = Math.min(0.35 * 0.67 * Math.sqrt(driftData.γ * (caseIII_Ics - 5 * caseIII_hp_prime) / driftData.Ss) + driftData.Cb, 5);
                    const caseIII_Ca0_1 = caseIII_F / driftData.Cb;
                    const caseIII_Ca0_2 = 0.67 * driftData.γ * driftData.h / (driftData.Cb * driftData.Ss);
                    const caseIII_Ca0_III = (driftData.a > 5 || driftData.h <= 0.8 * driftData.Ss / driftData.γ) ? "NOT APPLICABLE" : Math.min(caseIII_Ca0_1, caseIII_Ca0_2);
                    const caseIII_xd_III = 5 * driftData.Cb * driftData.Ss / driftData.γ * (caseIII_Ca0_III - 1);

                    const caseIII = {
                      β: 0.67,
                      Ics: caseIII_Ics,
                      Cw: 1.00,
                      hp_prime: caseIII_hp_prime,
                      Cs: driftData.h > 0 ? 1 : driftData.Cs_default,
                      F: caseIII_F,
                      Ca0_1: caseIII_Ca0_1,
                      Ca0_2: caseIII_Ca0_2,
                      Ca0_III: caseIII_Ca0_III,
                      xd_III: caseIII_xd_III
                    };

                    // Load snow data if not loaded
                    if (snowLoadData.length === 0 && !loadingSnowData) {
                      fetchSnowLoadData();
                    }

                    // Find location data
                    const snowLocationData = snowLoadData.find(item => item.city === data.location);
                    const ss = snowLocationData?.groundSnowLoadKpa || 0;
                    const sr = snowLocationData?.rainSnowLoadKpa || 0;

                    // Calculations
                    const alpha = Math.atan(data.slope / 12) * (180 / Math.PI);
                    const gamma = Math.min(4, 0.43 * ss + 2.2);
                    const limitHeight = 1 + ss / gamma;
                    const cs = alpha <= 30 ? 1 : (alpha > 70 ? 0 : (70 - alpha) / 40);
                    const ssCombined = ss * data.cb * driftData.Cw * cs * data.ca;
                    const snowLoad = data.is * (ssCombined + Math.min(sr, ssCombined));
                    const snowLoadPsf = snowLoad * 20.88543;
                    const snowLoadPart9 = Math.max(0.55 * ss + sr, 1);
                    const snowLoadPart9Psf = snowLoadPart9 * 20.88543;

                    return (
                      <>
                        <div className="max-w-4xl mx-auto bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <h3 className="text-xl font-bold text-blue-800 mb-4">Snow Load Calculator 1.0 (ULS)</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Input Area */}
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-semibold text-blue-700 mb-3">Input Area</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Location</label>
                                <select 
                                  className="col-span-2 px-2 py-1 border rounded text-sm"
                                  value={data.location}
                                  onChange={e => handleSnowChange('location', e.target.value)}
                                >
                                  {snowLoadData.map(item => (
                                    <option key={item.id} value={item.city}>{item.city}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Slope</label>
                                <input 
                                  type="number" 
                                  className="px-2 py-1 border rounded text-sm"
                                  value={data.slope}
                                  onChange={e => handleSnowChange('slope', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-sm">: 12</span>
                              </div>

                              <div>
                                <h4 className="font-semibold text-blue-700 mb-3">Default Inputs</h4>
                              </div>

                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Is</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  className="px-2 py-1 border rounded text-sm"
                                  value={data.is}
                                  onChange={e => handleSnowChange('is', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-xs text-gray-600">normal=1; SLS → 0.9</span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Ca</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  className="px-2 py-1 border rounded text-sm"
                                  value={data.ca}
                                  onChange={e => handleSnowChange('ca', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-xs text-gray-600">Ca = 1 for simple cases; complicated when consider particular situations</span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Cb</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  className="px-2 py-1 border rounded text-sm"
                                  value={data.cb}
                                  onChange={e => handleSnowChange('cb', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-xs text-gray-600">(1) Cb=0.8 if smaller dimension of roof w≤35m (115'); (2) Cb=1.0 if roof height ≤ Limit. Height ≈ 2m (6.5'); (3) Otherwise, refer to the Code.</span>
                              </div>
                              

                            </div>
                            
                            {snowLoadError && (
                              <div className="mt-3 text-red-600 text-sm">{snowLoadError}</div>
                            )}
                          </div>

                          {/* Calculation Area */}
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-semibold text-green-700 mb-3">Calculation Area</h4>
                            <div className="space-y-0">
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Ss</span>
                                <span className="font-mono">{ss.toFixed(2)}</span>
                                <span className="text-xs text-gray-600">1-in-50-year ground snow load</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Sr</span>
                                <span className="font-mono">{sr.toFixed(2)}</span>
                                <span className="text-xs text-gray-600">1-in-50-year associated rain load</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">α</span>
                                <span className="font-mono">{alpha.toFixed(2)}</span>
                                <span className="text-xs text-gray-600">°</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">γ</span>
                                <span className="font-mono">{gamma.toFixed(2)}</span>
                                <span className="text-xs text-gray-600">γ=min.&#123;4.0 kN/m³, 0.43Ss+2.2 kN/m³&#125;</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Limit. Height</span>
                                <span className="font-mono">{limitHeight.toFixed(2)}</span>
                                <span className="text-xs text-gray-600">= 1 + Ss/γ (m); if a mean height of roof is less than 1 + Ss/γ → Cb=1.</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Cw</span>
                                <span className="font-mono">{Number(driftData.Cw).toFixed(2)}</span>
                                <span className="text-xs text-gray-600">Conservative</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Cs</span>
                                <span className="font-mono">{cs.toFixed(2)}</span>
                                <span className="text-xs text-gray-600">Cs=1.0 where α≤30°; (70°-α)/40° where 30°&lt;α≤70°; 0 where α&gt;70°</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Ss(CbCwCsCa)</span>
                                <span className="font-mono">{ssCombined.toFixed(2)}</span>
                                <span></span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Results */}
                                                  <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <h4 className="font-semibold text-yellow-800 mb-3">Results</h4>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-medium">Snow loads</span>
                              <span className="font-mono">{snowLoad.toFixed(2)} kPa</span>
                              <span className="font-mono">{snowLoadPsf.toFixed(1)} psf</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-medium">Snow loads (Part 9)</span>
                              <span className="font-mono">{snowLoadPart9.toFixed(2)} kPa</span>
                              <span className="font-mono">{snowLoadPart9Psf.toFixed(1)} psf</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Snow Drifting Load Calculator (Multi-level Roofs) 1.0 */}
                      <div className="mt-8 max-w-6xl mx-auto bg-purple-50 rounded-lg p-6 border border-purple-200">
                        <h3 className="text-xl font-bold text-purple-800 mb-4">Snow Drifting Load Calculator (Multi-level Roofs) 1.0</h3>
                        
                        <div className="grid grid-cols-1 gap-6">
                          {/* Part 1: Inputs */}
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-semibold text-purple-700 mb-3">Part 1: Inputs</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-3">
                                <h5 className="font-medium text-purple-600">General Input</h5>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">a (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="1.0"
                                    value={driftData.a}
                                    onChange={(e) => handleDriftChange('a', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Horizontal gap between upper and lower roofs</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">h (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="5.0"
                                    value={driftData.h}
                                    onChange={(e) => handleDriftChange('h', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Difference in elevation between lower roof surface and top of the parapet of the upper roof</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">hp_lower (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="2.0"
                                    value={driftData.hp_lower}
                                    onChange={(e) => handleDriftChange('hp_lower', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">parapet height of lower-roof source area</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">x (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="3.0"
                                    value={driftData.x}
                                    onChange={(e) => handleDriftChange('x', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Optional: Point of interest</span>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <h5 className="font-medium text-purple-600">Case 1 Input</h5>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">ws_upper (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="10.0"
                                    value={driftData.ws_upper}
                                    onChange={(e) => handleDriftChange('ws_upper', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Shorter dimension of (upper roof) source area in Case 1</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">ls_upper (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="15.0"
                                    value={driftData.ls_upper}
                                    onChange={(e) => handleDriftChange('ls_upper', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Longer dimension of (upper roof) source area in Case 1</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">hp_upper (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="1.0"
                                    value={driftData.hp_upper}
                                    onChange={(e) => handleDriftChange('hp_upper', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">parapet height of upper-roof source area in Case 1</span>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <h5 className="font-medium text-purple-600">Case 2 & 3 Input</h5>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">ws_lower2 (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="15.0"
                                    value={driftData.ws_lower2}
                                    onChange={(e) => handleDriftChange('ws_lower2', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Shorter dimension of (lower roof) source area in Case 2</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">ls_lower2 (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="20.0"
                                    value={driftData.ls_lower2}
                                    onChange={(e) => handleDriftChange('ls_lower2', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Longer dimension of (lower roof) source area in Case 2</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">ws_lower3 (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="15.0"
                                    value={driftData.ws_lower3}
                                    onChange={(e) => handleDriftChange('ws_lower3', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Shorter dimension of (lower roof) source area in Case 3</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium">ls_lower3 (m)</label>
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="25.0"
                                    value={driftData.ls_lower3}
                                    onChange={(e) => handleDriftChange('ls_lower3', parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-600">Longer dimension of (lower roof) source area in Case 3</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Part 2-4: Unified Snow Drifting Load Results */}
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-semibold text-purple-700 mb-3">Part 2-4: Snow Drifting Load Results</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                  <tr className="bg-purple-100">
                                    <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Parameter</th>
                                    <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case I</th>
                                    <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case II</th>
                                    <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case III</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">β</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.β.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.β.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.β.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">Ics</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.Ics.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.Ics.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.Ics.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">Cw</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.Cw.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.Cw.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.Cw.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">hp'</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.hp_prime.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.hp_prime.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.hp_prime.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">Cs</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.Cs.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.Cs.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.Cs.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">F</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.F.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.F.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.F.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">Ca0_1</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.Ca0_1.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.Ca0_1.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.Ca0_1.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">Ca0_2</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.Ca0_2.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.Ca0_2.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.Ca0_2.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">Ca0</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{typeof caseI.Ca0_I === 'string' ? caseI.Ca0_I : caseI.Ca0_I.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{typeof caseII.Ca0_II === 'string' ? caseII.Ca0_II : caseII.Ca0_II.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{typeof caseIII.Ca0_III === 'string' ? caseIII.Ca0_III : caseIII.Ca0_III.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">xd (m)</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseI.xd_I.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseII.xd_II.toFixed(2)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{caseIII.xd_III.toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Snow Load Distribution Table */}
                            <div className="mt-6">
                              <h5 className="font-semibold text-purple-600 mb-3">Snow Load Distribution</h5>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-purple-100">
                                      <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case I Location x (ft)</th>
                                      <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case I S (psf)</th>
                                      <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case II Location x (ft)</th>
                                      <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case II S (psf)</th>
                                      <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case III Location x (ft)</th>
                                      <th className="border border-gray-300 px-3 py-2 text-sm font-medium">Case III S (psf)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">0.00</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-red-600">
                                        {typeof caseI.Ca0_I === 'number' ? (driftData.Is * (driftData.Ss * driftData.Cb * driftData.Cw * driftData.Cs_default * caseI.Ca0_I + driftData.Sr) * 20.88543).toFixed(1) : 'N/A'}
                                      </td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">0.00</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-red-600">
                                        {typeof caseII.Ca0_II === 'number' ? (driftData.Is * (driftData.Ss * driftData.Cb * driftData.Cw * driftData.Cs_default * caseII.Ca0_II + driftData.Sr) * 20.88543).toFixed(1) : 'N/A'}
                                      </td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">0.00</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-red-600">
                                        {typeof caseIII.Ca0_III === 'number' ? (driftData.Is * (driftData.Ss * driftData.Cb * driftData.Cw * driftData.Cs_default * caseIII.Ca0_III + driftData.Sr) * 20.88543).toFixed(1) : 'N/A'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{(caseI.xd_I * 3.28).toFixed(2)}</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">
                                        {(driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                      </td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{(caseII.xd_II * 3.28).toFixed(2)}</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">
                                        {(driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                      </td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{(caseIII.xd_III * 3.28).toFixed(2)}</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">
                                        {(driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{(driftData.x * 3.28).toFixed(2)}</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-red-600">
                                        {typeof caseI.Ca0_I === 'number' && (driftData.x * 3.28) <= (caseI.xd_I * 3.28) ? 
                                          ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseI.Ca0_I + driftData.Sr) * 20.88543) - 
                                           ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseI.Ca0_I + driftData.Sr) * 20.88543) - 
                                            (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543)) * 
                                           (driftData.x * 3.28) / (caseI.xd_I * 3.28)).toFixed(1) : 
                                          (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                      </td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{(driftData.x * 3.28).toFixed(2)}</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-red-600">
                                        {typeof caseII.Ca0_II === 'number' && (driftData.x * 3.28) <= (caseII.xd_II * 3.28) ? 
                                          ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseII.Ca0_II + driftData.Sr) * 20.88543) - 
                                           ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseII.Ca0_II + driftData.Sr) * 20.88543) - 
                                            (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543)) * 
                                           (driftData.x * 3.28) / (caseII.xd_II * 3.28)).toFixed(1) : 
                                          (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                      </td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{(driftData.x * 3.28).toFixed(2)}</td>
                                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-red-600">
                                        {typeof caseIII.Ca0_III === 'number' && (driftData.x * 3.28) <= (caseIII.xd_III * 3.28) ? 
                                          ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseIII.Ca0_III + driftData.Sr) * 20.88543) - 
                                           ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseIII.Ca0_III + driftData.Sr) * 20.88543) - 
                                            (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543)) * 
                                           (driftData.x * 3.28) / (caseIII.xd_III * 3.28)).toFixed(1) : 
                                          (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      </>
                    );
                  }
                  
                  if (activeTab?.type === 'wind_load' || activeTab?.tabType === 'wind_load') {
                    const tabKey = `${selectedPage.projectId}_${selectedPage.pageId}_${activeTab.id}`;
                    const windDefaults = {
                      location: 'Richmond',
                      iw: 1,
                      ce: 0.7,
                      ct: 1,
                      cgMain: 2,
                      cgCladding: 2.5,
                      cpWindward: 0.8,
                      cpLeeward: -0.5,
                      cpParallel: -0.7,
                      cpRoof: -1,
                      cpCladding: 0.9,
                      cei: 0.7,
                      cgi: 2,
                      cpiMin: -0.45,
                      cpiMax: 0.3
                    };
                    // Use merged data from database + template, fallback to local state for immediate updates
                    const mergedWindDefaults = activeTab.mergedData?.windDefaults || {};
                    const localWindData = windLoadTabData[tabKey] || {};
                    const data = { ...windDefaults, ...mergedWindDefaults, ...localWindData };
                    
                    const handleWindChange = async (field, value) => {
                      // Update local state immediately for responsive UI
                      setWindLoadTabData(prev => ({
                        ...prev,
                        [tabKey]: {
                          ...prev[tabKey],
                          [field]: value
                        }
                      }));
                      
                      // Save to database via workspace service (DELTA ONLY)
                      try {
                        // Only send the changed field, not the entire structure
                        const deltaData = {
                          windDefaults: {
                            [field]: value
                          }
                        };
                        await workspaceStateService.updateTabData(activeTab.id, 'wind_load', deltaData);
                      } catch (error) {
                        console.error('Error saving wind load data:', error);
                        showToastNotification('Failed to save changes: ' + error.message, 'error');
                      }
                    };

                    // Load wind data if not loaded
                    if (windLoadData.length === 0 && !loadingWindData) {
                      fetchWindLoadData();
                    }

                    // Find location data
                    const locationData = windLoadData.find(item => item.city === data.location);
                    const q = locationData?.windPressureKpa || 0;

                    // External Pressure Calculations: P = Iw * q * Ce * Ct * Cg * Cp
                    const windwardSurface = data.iw * q * data.ce * data.ct * data.cgMain * data.cpWindward;
                    const windwardSurfacePsf = windwardSurface * 20.88543;
                    const leewardSurface = data.iw * q * data.ce * data.ct * data.cgMain * data.cpLeeward;
                    const leewardSurfacePsf = leewardSurface * 20.88543;
                    const parallelSurface = data.iw * q * data.ce * data.ct * data.cgMain * data.cpParallel;
                    const parallelSurfacePsf = parallelSurface * 20.88543;
                    const roofSurface = data.iw * q * data.ce * data.ct * data.cgMain * data.cpRoof;
                    const roofSurfacePsf = roofSurface * 20.88543;
                    // Cladding surface = B3*B6*B4*B5*B8*0.9 (using fixed value 0.9, not Cp_cladding variable)
                    // Positive pressure (wind pushing against surface)
                    const claddingSurfaceKpaPos = data.iw * q * data.ce * data.ct * data.cgCladding * 0.9;
                    const claddingSurfacePsfPos = claddingSurfaceKpaPos * 20.88543;
                    // Negative pressure (wind pulling away from surface)
                    const claddingSurfaceKpaNeg = data.iw * q * data.ce * data.ct * data.cgCladding * (-0.9);
                    const claddingSurfacePsfNeg = claddingSurfaceKpaNeg * 20.88543;

                    // Internal Pressure Calculation: Pi = Iw * q * Cei * Cgi * Cpi
                    const internalPressureMin = data.iw * q * data.cei * data.cgi * data.cpiMin;
                    const internalPressureMinPsf = internalPressureMin * 20.88543;
                    const internalPressureMax = data.iw * q * data.cei * data.cgi * data.cpiMax;
                    const internalPressureMaxPsf = internalPressureMax * 20.88543;

                    return (
                      <div className="max-w-6xl mx-auto bg-green-50 rounded-lg p-6 border border-green-200">
                        <h3 className="text-xl font-bold text-green-800 mb-4">Wind Load Calculator 1.0</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Input Area: Location only */}
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-semibold text-green-700 mb-3">Input Area</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Location</label>
                                <select 
                                  className="col-span-2 px-2 py-1 border rounded text-sm"
                                  value={data.location}
                                  onChange={e => handleWindChange('location', e.target.value)}
                                >
                                  {windLoadData.map(item => (
                                    <option key={item.id} value={item.city}>{item.city}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Default Inputs */}
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-semibold text-green-700 mb-3">Default Inputs</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Iw</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  className="px-2 py-1 border rounded text-sm"
                                  value={data.iw}
                                  onChange={e => handleWindChange('iw', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-xs text-gray-600">Importance Factor: normal(ULS)=1; SLS=0.8</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Ce</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  className="px-2 py-1 border rounded text-sm"
                                  value={data.ce}
                                  onChange={e => handleWindChange('ce', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-xs text-gray-600">Exposure factor: (1) Ce=0.7, rough (suburban, urban or wooded terrain), H≤12m(39'); (2) Ce=0.9~1, open terrain, H≤12m(39')</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Ct</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  className="px-2 py-1 border rounded text-sm"
                                  value={data.ct}
                                  onChange={e => handleWindChange('ct', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-xs text-gray-600">Topographic Factor: Ct=1 for normal, else for hill/slope (refer to Code)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Calculation Area: from q to Cpi */}
                        <div className="mt-6 bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-blue-700 mb-3">Calculation Area</h4>
                                                      <div className="space-y-0">
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">q</span><span className="font-mono">{q.toFixed(2)}</span><span className="text-xs text-gray-600">Hourly Wind Pressures kPa, 1/50</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cg_main</span><span className="font-mono">{data.cgMain}</span><span className="text-xs text-gray-600">Gust Effect Factor: Cg=2 for main structure</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cg_cladding</span><span className="font-mono">{data.cgCladding}</span><span className="text-xs text-gray-600">Gust Effect Factor: 2.5 for cladding</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp windward</span><span className="font-mono">{data.cpWindward}</span><span className="text-xs text-gray-600">External Pressure Coefficients: For normal buildings; Conservative Value (H/D≥1)</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp leeward</span><span className="font-mono">{data.cpLeeward}</span><span/>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp parallel</span><span className="font-mono">{data.cpParallel}</span><span/>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp roof</span><span className="font-mono">{data.cpRoof}</span><span/>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp cladding</span><span className="font-mono">±0.9</span><span className="text-xs text-gray-600">For walls, balcony guards → but not for the corner part</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cei</span><span className="font-mono">{data.cei}</span><span className="text-xs text-gray-600">Normally equal to Ce; 0.7, rough, H≤12m(39')</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cgi</span><span className="font-mono">{data.cgi}</span><span className="text-xs text-gray-600">Internal Gust Effect Factor: Cgi=2</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cpi (min)</span><span className="font-mono">{data.cpiMin}</span><span className="text-xs text-gray-600">Internal Pressure Coefficient: Non-uniformly distributed openings of which none is significant or significant openings that are wind-resistant and closed during storms</span>
                              </div>
                              <hr className="border-gray-200" />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cpi (max)</span><span className="font-mono">{data.cpiMax}</span><span/>
                              </div>
                            </div>
                        </div>

                        {/* External Pressure Area */}
                        <div className="mt-6 bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-green-700 mb-3">External Pressure: P = Iw × q × Ce × Ct × Cg × Cp</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-300 px-3 py-2 text-left">Surface</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Value</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Windward Surface</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{windwardSurface.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">Kpa</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2"></td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono text-red-600">{windwardSurfacePsf.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center text-red-600">psf</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Leeward Surface</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{leewardSurface.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">Kpa</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2"></td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono text-red-600">{leewardSurfacePsf.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center text-red-600">psf</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Parallel Surface</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{parallelSurface.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">Kpa</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2"></td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono text-red-600">{parallelSurfacePsf.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center text-red-600">psf</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Roof Surface</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{roofSurface.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">Kpa</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2"></td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono text-red-600">{roofSurfacePsf.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center text-red-600">psf</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Cladding Surface</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{claddingSurfaceKpaPos.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">Kpa</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2"></td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono text-red-600">{claddingSurfacePsfPos.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center text-red-600">psf</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Internal Pressure Area */}
                        <div className="mt-6 bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-green-700 mb-3">Internal Pressure: P = Iw × q × Cei × Ct × Cgi × Cpi</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-300 px-3 py-2 text-left">Surface</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Value</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Surface Max.</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{internalPressureMax.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">Kpa</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2"></td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono text-red-600">{internalPressureMaxPsf.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center text-red-600">psf</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Surface Min.</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{internalPressureMin.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">Kpa</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2"></td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono text-red-600">{internalPressureMinPsf.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center text-red-600">psf</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Main Structure */}
                        <div className="mt-6 bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-blue-700 mb-3">Main Structure (Whole Building)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-300 px-3 py-2 text-left">Component</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Value</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Unit</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Max pressure</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{windwardSurfacePsf.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">windward surface, Cp=0.8</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Max suction</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{parallelSurfacePsf.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">parallel surface, Cp=-0.7</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Roof</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{(roofSurfacePsf - internalPressureMaxPsf).toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">external roof + internal pressure, Cp= -1-0.3 = -1.3</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Windward Direction as a Whole</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{(windwardSurfacePsf - leewardSurfacePsf).toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">windward - leeward surface, Cp = 0.8 - (-0.5) = 1.3</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Components */}
                        <div className="mt-6 bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-purple-700 mb-3">Components</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-300 px-3 py-2 text-left">Component</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Value</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Unit</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Wall Cladding - Inward</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{(claddingSurfacePsfPos - internalPressureMinPsf).toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">external cladding pressure + internal suction, Cp = 0.9- (-0.45) =1.35</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Wall Cladding - Outward</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{(claddingSurfacePsfNeg - internalPressureMaxPsf).toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">external cladding suction + internal pressure, Cp = -0.9-0.3 = -1.2</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Balcony guards</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{claddingSurfacePsfPos.toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">external cladding pressure, Cp = 0.9</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Canopy */}
                        <div className="mt-6 bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-orange-700 mb-3">Canopy</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-300 px-3 py-2 text-left">Component</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Value</th>
                                  <th className="border border-gray-300 px-3 py-2 text-center">Unit</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Canopy (Positive Pressure)</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{(data.iw * q * data.ce * data.ct * 1.5 * 20.88543).toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">Attached Canopies on Low Buildings with a Height H ≤ 20 m: (1) Net gust pressure → Pnet = Iw × q × Ce × Ct × (CgCp)net; (2) + → downward, - → upward;</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-3 py-2 font-medium">Canopy (Negative Pressure)</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{(data.iw * q * data.ce * data.ct * (-3.2) * 20.88543).toFixed(2)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">psf</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">(3) Conservative value: (CgCp)net = 1.5(max.) / -3.2(min.)</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  

                  
                  if (activeTab?.type === 'seismic' || activeTab?.tabType === 'seismic') {
                    // Unique key for this tab
                    const tabKey = `${selectedPage.projectId}_${selectedPage.pageId}_${activeTab.id}`;
                    // Use merged data from database + template, fallback to local state for immediate updates
                    const seismicDefaults = {
                      designer: '',
                      address: '',
                      project: '',
                      revision: '',
                      date: '',
                      bldgCode: '',
                      apiKey: ''
                    };
                    const mergedSeismicData = activeTab.mergedData?.seismicTabData || {};
                    const localSeismicData = seismicTabData[tabKey] || {};
                    const data = { ...seismicDefaults, ...mergedSeismicData, ...localSeismicData };
                    
                    // Use seismic results from database if available, otherwise use local React state
                    const persistedSeismicResults = activeTab.mergedData?.seismicResults || {};
                    const localSeismicResults = seismicResults[tabKey] || null;
                    const seismicResult = localSeismicResults || (persistedSeismicResults.site_class ? persistedSeismicResults : null);
                    const handleChange = async (field, value) => {
                      // Update local state immediately for responsive UI
                      setSeismicTabData(prev => ({
                        ...prev,
                        [tabKey]: {
                          ...prev[tabKey],
                          [field]: value
                        }
                      }));
                      
                      // Clear validation error when user starts typing in required fields
                      if ((field === 'address' || field === 'apiKey') && value.trim()) {
                        setSeismicFormError('');
                        setShowSeismicValidationError(false);
                      }
                      
                      // Save to database via workspace service (DELTA ONLY)
                      // NOTE: API key should never be stored in tab_data as it's managed globally
                      if (field !== 'apiKey') {
                        try {
                          // Only send the changed field, not the entire structure
                          const deltaData = {
                            seismicTabData: {
                              [field]: value
                            }
                          };
                          await workspaceStateService.updateTabData(activeTab.id, 'seismic', deltaData);
                        } catch (error) {
                          console.error('Error saving seismic data:', error);
                          showToastNotification('Failed to save changes: ' + error.message, 'error');
                        }
                      }
                    };
                    return (
                      <div className="max-w-md mx-auto bg-orange-100 rounded-lg p-4 border border-orange-200">
                        <div className="grid grid-cols-2 gap-2 items-center text-purple-700 text-base font-medium">
                          <div className="text-right pr-2">Designer</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.designer || ''} onChange={e => handleChange('designer', e.target.value)} />
                          <div className="text-right pr-2">Address *</div>
                          <input 
                            className={`bg-orange-50 rounded px-2 py-1 ${showSeismicValidationError && !data.address ? 'border-2 border-red-500' : ''}`} 
                            value={data.address || ''} 
                            onChange={e => handleChange('address', e.target.value)} 
                            placeholder="Enter the address" 
                          />
                          <div className="text-right pr-2">Project #</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.project || ''} onChange={e => handleChange('project', e.target.value)} />
                          <div className="text-right pr-2">Revision</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.revision || ''} onChange={e => handleChange('revision', e.target.value)} />
                          <div className="text-right pr-2">Date</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.date || ''} onChange={e => handleChange('date', e.target.value)} />
                          <div className="text-right pr-2">Bldg code</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.bldgCode || ''} onChange={e => handleChange('bldgCode', e.target.value)} />
                          <div className="text-right pr-2">Api_key *</div>
                          {hasStoredApiKey ? (
                            <div className="relative">
                              <input
                                type="text"
                                value="Securely stored - no need to enter"
                                disabled={true}
                                className="bg-green-50 rounded px-2 py-1 border border-green-300 text-green-700 text-sm cursor-not-allowed w-full"
                                style={{ minWidth: '280px' }}
                              />

                            </div>
                          ) : (
                            <input
                              type="password"
                              value={data.apiKey || ''}
                              onChange={(e) => handleChange('apiKey', e.target.value)}
                              placeholder="Enter your API key"
                              disabled={apiKeyLoading}
                              className={`bg-orange-50 rounded px-2 py-1 border focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 ${
                                showSeismicValidationError && !data.apiKey 
                                  ? 'border-red-500 focus:border-red-500' 
                                  : 'border-orange-200 focus:border-orange-400'
                              }`}
                            />
                          )}
                          
                        </div>
                        
                        {/* API Key Status Note - moved outside the grid for better positioning */}
                        {hasStoredApiKey && (
                          <div className="text-xs text-green-600 text-center mt-4 mb-3 px-4 py-2 bg-green-50 rounded border border-green-200">
                            ✓ API key securely stored - can be managed in Settings
                          </div>
                        )}
                        
                        {/* API Key Options - only show when no key is stored */}
                        {!hasStoredApiKey && (
                          <div className="flex items-center justify-center space-x-2 mt-2 mb-2">
                            <input
                              type="checkbox"
                              id="remember-key"
                              checked={rememberApiKey}
                              onChange={(e) => setRememberApiKey(e.target.checked)}
                              disabled={apiKeyLoading}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <label htmlFor="remember-key" className="text-sm text-gray-700">
                              Remember my API key securely
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowSecurityInfoModal(true)}
                              className="text-blue-600 text-sm hover:text-blue-800 underline"
                              disabled={apiKeyLoading}
                            >
                              Learn more about security
                            </button>
                          </div>
                        )}
                        
                        {/* Required Fields Note */}
                        <div className="text-xs text-gray-500 text-center mt-2">
                          * Required fields
                        </div>
                        
                        {/* Retrieve Data Button */}
                        <div className="flex justify-center mt-6">
                          <button
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                            style={{ minWidth: '180px' }}
                            onClick={async () => {
                              setSeismicFormError("");
                              setSeismicResults(prev => ({
                                ...prev,
                                [tabKey]: null
                              }));
                              if (!data.address || (!data.apiKey && !hasStoredApiKey)) {
                                setSeismicFormError("Address and API key are required.");
                                setShowSeismicValidationError(true);
                                return;
                              }
                              setShowSeismicValidationError(false);
                              let currentSedimentTypes = sedimentTypes;
                              if (currentSedimentTypes.length === 0) {
                                try {
                                  setLoadingSediments(true);
                                  const res = await fetch("http://localhost:8080/api/sediment-types");
                                  if (!res.ok) throw new Error("Failed to fetch sediment types");
                                  currentSedimentTypes = await res.json();
                                  setSedimentTypes(currentSedimentTypes);
                                } catch (err) {
                                  setSeismicFormError("Error fetching sediment types from backend.");
                                  setSedimentTypes([]);
                                  setLoadingSediments(false);
                                  return;
                                }
                              }
                              setLoadingSediments(true);
                              try {
                                // Determine which API key to use
                                let apiKeyToUse = data.apiKey;
                                
                                // If no API key in input but we have a stored one, retrieve it
                                if (!apiKeyToUse && hasStoredApiKey) {
                                  try {
                                    // Simple retrieval without password for authenticated users
                                    const response = await fetch(`http://localhost:8080/api/user/${userId}/api-key/retrieve`, {
                                      method: 'GET',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                        'Content-Type': 'application/json'
                                      }
                                    });
                                    
                                    if (response.ok) {
                                      const storedKeyResult = await response.json();
                                      if (storedKeyResult.hasStoredKey && storedKeyResult.requiresPassword) {
                                        // Password required - show decryption modal
                                        setPendingSeismicData({ data, currentSedimentTypes, tabKey });
                                        setShowSeismicDecryptModal(true);
                                        setLoadingSediments(false);
                                        return;
                                      } else if (storedKeyResult.hasStoredKey && storedKeyResult.apiKey) {
                                        apiKeyToUse = storedKeyResult.apiKey;
                                      } else {
                                        setSeismicFormError('Failed to retrieve stored API key. Please enter it manually.');
                                        setLoadingSediments(false);
                                        return;
                                      }
                                    } else {
                                      setSeismicFormError('Failed to retrieve stored API key. Please enter it manually.');
                                      setLoadingSediments(false);
                                      return;
                                    }
                                  } catch (error) {
                                    setSeismicFormError('Failed to retrieve stored API key. Please enter it manually.');
                                    setLoadingSediments(false);
                                    return;
                                  }
                                }
                                
                                const res = await fetch('http://localhost:5001/api/seismic-info', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    address: data.address,
                                    api_key: apiKeyToUse,
                                    soil_table: currentSedimentTypes
                                  })
                                });
                                if (!res.ok) throw new Error('Failed to fetch seismic info');
                                const result = await res.json();
                                console.log('🎯 Seismic API response received:', result);
                                setSeismicResults(prev => ({
                                  ...prev,
                                  [tabKey]: result
                                }));
                                console.log('🎯 About to save seismic results to database...');
                                
                                // Save seismic results to database for persistence
                                try {
                                  const seismicResultsDelta = {
                                    seismicResults: {
                                      site_class: result.site_class,
                                      coordinates: result.coordinates,
                                      address_checked: result.address_checked,
                                      rgb: result.rgb,
                                      most_similar_soil: result.most_similar_soil,
                                      soil_pressure: result.soil_pressure,
                                      sa_site: result.sa_site,
                                      sa_x450: result.sa_x450
                                    }
                                  };
                                  console.log('🔍 Saving seismic results to database:', seismicResultsDelta);
                                  await workspaceStateService.saveTabDataImmediately(activeTab.id, 'seismic', seismicResultsDelta);
                                  console.log('✅ Seismic results saved successfully');
                                } catch (error) {
                                  console.error('❌ Error saving seismic results:', error);
                                  // Don't show error to user as this is background save - the UI is already working
                                }
                                
                                // Optionally update sedimentTypes with probabilities
                                if (result.most_similar_soil && result.rgb && currentSedimentTypes.length > 0) {
                                  const rgb = result.rgb;
                                  const probs = currentSedimentTypes.map(row => {
                                    const soil_rgb = [row.color_r, row.color_g, row.color_b];
                                    // Cosine similarity
                                    const dot = rgb[0]*soil_rgb[0] + rgb[1]*soil_rgb[1] + rgb[2]*soil_rgb[2];
                                    const norm1 = Math.sqrt(rgb[0]**2 + rgb[1]**2 + rgb[2]**2);
                                    const norm2 = Math.sqrt(soil_rgb[0]**2 + soil_rgb[1]**2 + soil_rgb[2]**2);
                                    return norm1 && norm2 ? dot/(norm1*norm2) : 0;
                                  });
                                  setSedimentTypes(currentSedimentTypes.map((row, i) => ({ ...row, probability: probs[i] })));
                                }
                                
                                // Show API key storage option if successful, user has API key, and they checked "Remember my API key securely"
                                if (data.apiKey && !hasStoredApiKey && !dontShowStorePrompt && rememberApiKey) {
                                  setShowStoreApiKeyModal(true);
                                }
                              } catch (err) {
                                setSeismicFormError('Error retrieving data.');
                                setSeismicResults(prev => ({
                                  ...prev,
                                  [tabKey]: null
                                }));
                              } finally {
                                setLoadingSediments(false);
                              }
                            }}
                          >
                            {loadingSediments ? 'Loading...' : 'Retrieve Data'}
                          </button>
                          <button
                            className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition ml-4"
                            style={{ minWidth: '120px' }}
                            onClick={async () => {
                              setSeismicResults(prev => ({
                                ...prev,
                                [tabKey]: null
                              }));
                              setSeismicFormError("");
                              setShowSeismicValidationError(false);
                              // Clear the fields for the current tab
                              setSeismicTabData(prev => ({
                                ...prev,
                                [tabKey]: {
                                  designer: '',
                                  address: '',
                                  project: '',
                                  revision: '',
                                  date: '',
                                  bldgCode: '',
                                  apiKey: ''
                                }
                              }));
                              
                              // Clear data from database as well
                              try {
                                // Use the new replace method to completely replace with empty object
                                await workspaceApiService.replaceTabData(activeTab.id, {});
                                console.log('✅ Seismic data completely replaced with empty object in database');
                              } catch (error) {
                                console.error('Error clearing seismic data:', error);
                                showToastNotification('Failed to clear data: ' + error.message, 'error');
                              }
                            }}
                          >
                            Clear Data
                          </button>
                        </div>
                        {/* After the Retrieve Data button and before the sedimentTypes table, render the new info and seismic hazard table: */}
                        {seismicResult && (
                          <div className="mt-6">
                            <div className="mb-2 text-sm">
                              <div><b>address_checked:</b> {seismicResult.address_checked}</div>
                              <div><b>site_class:</b> {seismicResult.site_class}</div>
                              <div><b>longitude:</b> {seismicResult.coordinates?.lon}</div>
                              <div><b>latitude:</b> {seismicResult.coordinates?.lat}</div>
                            </div>
                            {/* Seismic Hazard Table */}
                            <div className="overflow-x-auto mb-4">
                              <table className="min-w-full text-xs text-center border border-gray-300 bg-white rounded">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-2 py-1 border">T (s)</th>
                                    <th className="px-2 py-1 border">Sa(T,X)</th>
                                    <th className="px-2 py-1 border">Sa(T,X450)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {['0.2','0.5','1.0','2.0','5.0','10.0','PGA'].map((T, i) => (
                                    <tr key={T}>
                                      <td className="border px-2 py-1">{T}</td>
                                      <td className="border px-2 py-1">{seismicResult.sa_site ? seismicResult.sa_site[i] : ''}</td>
                                      <td className="border px-2 py-1">{seismicResult.sa_x450 ? seismicResult.sa_x450[i] : ''}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {/* Sediment Types Table */}
                        <div className="mt-6">
                          {(() => {
                            const showProbability = seismicResult && seismicResult.rgb;
                            return (
                              <>
                                {showSeismicValidationError && seismicFormError && <div className="text-red-600 text-center mb-2">{seismicFormError}</div>}
                                {seismicResult && sedimentTypes.length > 0 && (
                                  <div className="overflow-x-auto mt-6">
                                    <table className="min-w-full text-xs text-center border border-gray-300 bg-white rounded">
                                      <thead className="bg-gray-200 font-bold">
                                        <tr>
                                          <th className="px-2 py-1 border">Type</th>
                                          <th className="px-2 py-1 border">Sediments</th>
                                          <th className="px-2 py-1 border">Site Class</th>
                                          <th className="px-2 py-1 border">Soil Pressure(psf)</th>
                                          <th className="px-2 py-1 border">Colour</th>
                                          <th className="px-2 py-1 border">R</th>
                                          <th className="px-2 py-1 border">G</th>
                                          <th className="px-2 py-1 border">B</th>
                                          {showProbability && <th className="px-2 py-1 border">Probability</th>}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sedimentTypes.map((row) => (
                                          <tr key={row.id}>
                                            <td className="border px-2 py-1">{row.id}</td>
                                            <td className="border px-2 py-1">{row.sediment_name}</td>
                                            <td className="border px-2 py-1">{row.site_class}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.soil_pressure_psf}</td>
                                            <td className="border px-2 py-1">
                                              <span style={{
                                                display: 'inline-block',
                                                width: '32px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                backgroundColor: `rgb(${row.color_r},${row.color_g},${row.color_b})`,
                                                border: '1px solid #ccc'
                                              }} />
                                            </td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.color_r}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.color_g}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.color_b}</td>
                                            {showProbability && <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.probability !== undefined ? (row.probability*100).toFixed(3) + '%' : ''}</td>}
                                          </tr>
                                        ))}
                                        {showProbability && seismicResult && seismicResult.most_similar_soil && (
                                          <tr style={{ color: 'red', fontWeight: 'bold', background: '#ffe4b2' }}>
                                            <td className="border px-2 py-1">Result</td>
                                            <td className="border px-2 py-1">{seismicResult.most_similar_soil.sediment_name}</td>
                                            <td className="border px-2 py-1">{seismicResult.most_similar_soil.site_class}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{seismicResult.most_similar_soil.soil_pressure_psf}</td>
                                            <td className="border px-2 py-1">
                                              <span style={{
                                                display: 'inline-block',
                                                width: '32px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                backgroundColor: `rgb(${seismicResult.most_similar_soil.color_r},${seismicResult.most_similar_soil.color_g},${seismicResult.most_similar_soil.color_b})`,
                                                border: '1px solid #ccc'
                                              }} />
                                            </td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{seismicResult.most_similar_soil.color_r}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{seismicResult.most_similar_soil.color_g}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{seismicResult.most_similar_soil.color_b}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{(() => {
                                              if (!sedimentTypes.length) return '';
                                              const rgb = seismicResult.rgb;
                                              const soil_rgb = [seismicResult.most_similar_soil.color_r, seismicResult.most_similar_soil.color_g, seismicResult.most_similar_soil.color_b];
                                              const dot = rgb[0]*soil_rgb[0] + rgb[1]*soil_rgb[1] + rgb[2]*soil_rgb[2];
                                              const norm1 = Math.sqrt(rgb[0]**2 + rgb[1]**2 + rgb[2]**2);
                                              const norm2 = Math.sqrt(soil_rgb[0]**2 + soil_rgb[1]**2 + soil_rgb[2]**2);
                                              return norm1 && norm2 ? (dot/(norm1*norm2)*100).toFixed(3) + '%' : '';
                                            })()}</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  }
                  
                  // Default content for other tabs
                  return (
                    <>
                      {(activeTab?.type === 'Welcome' || activeTab?.tabType === 'Welcome' || activeTab?.type === 'welcome' || activeTab?.tabType === 'welcome') ? (
                        <div className="welcome-content">
                          <div className="feature-overview mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Tools:</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                              <li><strong>Snow Load Calculator</strong> - Calculate snow loads for various roof configurations</li>
                              <li><strong>Wind Load Calculator</strong> - Determine wind pressure loads for structures</li>
                              <li><strong>Seismic Analysis</strong> - Get seismic hazard data for specific locations</li>
                            </ul>
                          </div>
                          <div className="getting-started">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Getting Started:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-gray-600">
                              <li>Create a new tab using the "+" button</li>
                              <li>Select the appropriate calculator type</li>
                              <li>Enter your project parameters</li>
                              <li>Review the calculated results</li>
                            </ol>
                          </div>
                        </div>
                      ) : (activeTab?.type === 'design_tables' || activeTab?.tabType === 'design_tables') ? (
                        <div className="design-tables-content">
                          <div className="workspace-area">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Design Tables & Diagrams</h3>
                            <p className="text-gray-600 mb-6">This is your workspace for helper diagrams, reference tables, and design documentation.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="table-placeholder border-2 border-dashed border-gray-300 rounded-lg p-6">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">Helper Tables</h4>
                                <p className="text-gray-500">Add structural design tables, load charts, and reference data here.</p>
                              </div>
                              <div className="diagram-placeholder border-2 border-dashed border-gray-300 rounded-lg p-6">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">Design Diagrams</h4>
                                <p className="text-gray-500">Create and manage structural diagrams, sketches, and visual aids.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p>Welcome to the {activeTab?.name || 'workspace'} area.</p>
                          <p className="mt-2">This is where you can manage your project information and calculations.</p>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
            })()}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'project' && (
            <>
              <button
                onClick={() => handleContextMenuAction('rename')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Rename</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('copy')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('delete')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('newPage')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Page</span>
              </button>
            </>
          )}
          
          {contextMenu.type === 'page' && (
            <>
              <button
                onClick={() => handleContextMenuAction('rename')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Rename</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('copy')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('delete')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
              
              {clipboard.type && (
                <button
                  onClick={() => handleContextMenuAction('paste')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <svg style={{ width: '14px', height: '14px' }} className="text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Paste Tab</span>
                </button>
              )}
            </>
          )}
          
          {contextMenu.type === 'tab' && (
            <>
              <button
                onClick={() => handleContextMenuAction('rename')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Rename</span>
              </button>
              
              <button
                onClick={() => handleContextMenuAction('copy')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} className="text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy this tab</span>
              </button>
              
              <button
                onClick={() => handleContextMenuAction('copyToClipboard')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy to Clipboard</span>
              </button>
              
              <button
                onClick={() => handleContextMenuAction('cutToClipboard')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} className="text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Cut to Clipboard</span>
              </button>
              
              {clipboard.type && (
                <button
                  onClick={() => handleContextMenuAction('pasteAfterThisTab')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <svg style={{ width: '14px', height: '14px' }} className="text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Paste after this tab</span>
                </button>
              )}
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                onClick={() => handleContextMenuAction('newTabRight')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Tab to the Right</span>
              </button>
              
              {(() => {
                const { projectId, pageId } = selectedPage;
                const project = projects.find(p => p.id === projectId);
                const page = project?.pages.find(p => p.id === pageId);
                const tab = page?.tabs.find(t => t.id === contextMenu.itemId);
                return tab?.locked ? (
                  <button
                    onClick={() => handleContextMenuAction('unlockTab')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>Unlock Tab</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleContextMenuAction('lockTab')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Lock Tab</span>
                  </button>
                );
              })()}
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                onClick={() => handleContextMenuAction('moveToStart')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                <span>Move to Start</span>
              </button>
              
              <button
                onClick={() => handleContextMenuAction('moveToEnd')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                <span>Move to End</span>
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                onClick={() => handleContextMenuAction('closeOthers')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close Other Tabs</span>
              </button>
              
              <button
                onClick={() => handleContextMenuAction('closeAll')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close All Tabs</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Security Info Modal */}
      {showSecurityInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                API Key Security
              </h3>
              <button
                onClick={() => setShowSecurityInfoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center mb-4">
              <svg style={{ width: '20px', height: '20px' }} className="text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-gray-700 flex-1">
                <h4 className="font-semibold mb-2 text-gray-800">How we protect your API key:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your API key is encrypted using your password</li>
                  <li>We never store your password or API key in plain text</li>
                  <li>Your key is only accessible when you're logged in</li>
                  <li>You can delete your stored key at any time</li>
                  <li>We use industry-standard AES-256 encryption</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowSecurityInfoModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store API Key Modal */}
      {showStoreApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Store API Key Securely
              </h3>
              <button
                onClick={() => {
                  setShowStoreApiKeyModal(false);
                  setCurrentUserPassword('');
                  setApiKeyError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center mb-4">
              <svg style={{ width: '20px', height: '20px' }} className="text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-gray-700 flex-1">
                <p className="text-sm mb-4">
                  Your API key was used successfully. Would you like to store it securely so you don't need to enter it again?
                </p>
                
                <div className="space-y-3" style={{ marginBottom: '30px' }}>
                  <label className="block text-sm font-medium text-gray-700">
                    Enter your password to store the API key:
                  </label>
                  <input
                    type="password"
                    value={currentUserPassword}
                    onChange={(e) => setCurrentUserPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your password"
                  />
                </div>
                
                {apiKeyError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    {apiKeyError}
                  </div>
                )}
                
                {/* Don't show again option */}
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="dont-show-again"
                    checked={dontShowStorePrompt}
                    onChange={(e) => setDontShowStorePrompt(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="dont-show-again" className="ml-2 text-sm text-gray-600">
                    Don't show this prompt again
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3" style={{ paddingTop: '40px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowStoreApiKeyModal(false);
                  setCurrentUserPassword('');
                  setApiKeyError('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                disabled={apiKeyLoading}
              >
                Don't Store
              </button>
              <button
                onClick={() => {
                  const currentProject = projects.find(p => p.id === selectedPage.projectId);
                  const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                  const activeTab = findActiveTab(currentPage?.tabs);
                  const tabKey = `${selectedPage.projectId}_${selectedPage.pageId}_${activeTab?.id}`;
                  // Use merged data from database + template, fallback to local state
                  const mergedSeismicData = activeTab.mergedData?.seismicTabData || {};
                  const localSeismicData = seismicTabData[tabKey] || {};
                  const currentData = { ...mergedSeismicData, ...localSeismicData };
                  
                  // If user has stored API key, we'll retrieve it in handleStoreApiKey
                  // If not, use the one from the input field
                  const apiKeyToStore = hasStoredApiKey ? '' : (currentData.apiKey || '');
                  handleStoreApiKey(apiKeyToStore, true);
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                disabled={apiKeyLoading}
              >
                {apiKeyLoading ? 'Storing...' : 'Store Securely'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete API Key Modal */}
      {showDeleteApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete API Key
              </h3>
              <button
                onClick={() => {
                  setShowDeleteApiKeyModal(false);
                  setDeleteApiKeyPassword('');
                  setApiKeyError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center mb-4">
              <svg style={{ width: '20px', height: '20px' }} className="text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-gray-700 flex-1">
                <p className="text-sm mb-4">
                  Are you sure you want to delete your stored API key? You'll need to enter it again when using seismic features.
                </p>
                
                <div className="space-y-3" style={{ marginBottom: '30px' }}>
                  <label className="block text-sm font-medium text-gray-700">
                    Enter your password to confirm deletion:
                  </label>
                  <input
                    type="password"
                    value={deleteApiKeyPassword}
                    onChange={(e) => setDeleteApiKeyPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Your password"
                  />
                </div>
                
                {apiKeyError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    {apiKeyError}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-center space-x-3" style={{ paddingTop: '40px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowDeleteApiKeyModal(false);
                  setDeleteApiKeyPassword('');
                  setApiKeyError('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                disabled={apiKeyLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApiKey}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                disabled={apiKeyLoading}
              >
                {apiKeyLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seismic API Key Decryption Modal */}
      {showSeismicDecryptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Decrypt API Key
              </h3>
              <button
                onClick={() => {
                  setShowSeismicDecryptModal(false);
                  setSeismicDecryptPassword('');
                  setSeismicDecryptError('');
                  setPendingSeismicData(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center mb-8">
              <svg style={{ width: '24px', height: '24px' }} className="text-blue-500 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-gray-700">
                Enter your password to decrypt your stored API key for seismic analysis.
              </p>
            </div>
            
            <div className="space-y-4" style={{ marginBottom: '30px' }}>
              <label className="block text-sm font-medium text-gray-700">
                Enter your password:
              </label>
              <input
                type="password"
                value={seismicDecryptPassword}
                onChange={(e) => setSeismicDecryptPassword(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your password"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSeismicDecrypt();
                  }
                }}
              />
            </div>
            
            {seismicDecryptError && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {seismicDecryptError}
              </div>
            )}
            
            <div className="flex justify-center space-x-4" style={{ paddingTop: '40px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowSeismicDecryptModal(false);
                  setSeismicDecryptPassword('');
                  setSeismicDecryptError('');
                  setPendingSeismicData(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                disabled={seismicDecryptLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSeismicDecrypt}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                disabled={seismicDecryptLoading}
              >
                {seismicDecryptLoading ? 'Decrypting...' : 'Decrypt & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border pointer-events-auto ${
            toastType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : toastType === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <svg style={{ width: '20px', height: '20px' }} className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {toastType === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : toastType === 'info' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <span className="text-sm font-medium">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}