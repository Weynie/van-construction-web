'use client';  // Important: enable client-side hooks in App Router

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiKeyService } from '../services/apiKeyService';
import { userService } from '../services/userService';
import { workspaceStateService } from '../services/workspaceStateService';
import { tabTemplateService } from '../services/tabTemplateService';
import { workspaceApiService } from '../services/workspaceApiService';
import { themePreferenceService } from '../services/themePreferenceService';

import SeismicResultsTable from '../components/SeismicResultsTable';
import SedimentTypesTable from '../components/SedimentTypesTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NumberInput } from '@/components/ui/number-input';
import { toast } from 'sonner';
import { ModeToggle } from '@/components/mode-toggle';
import { useTheme } from 'next-themes';
import { 
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, ChevronDown,
  Key, UserPlus, LogIn, Lock, Unlock,
  X, Plus, Info, CheckCircle, AlertTriangle, Edit, Copy, Trash2, Scissors, RefreshCw,
  Settings, Bell, Palette, Database, Shield, User,
  Folder, FileText, Globe, GripVertical
} from 'lucide-react';

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
  console.log('🚀 HomePage component rendered');
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
  const [deletingTabs, setDeletingTabs] = useState(new Set());
  
  // Drag and drop state for projects and pages
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);
  const [draggedPage, setDraggedPage] = useState(null);
  const [dragOverPage, setDragOverPage] = useState(null);
  const [isDraggingProject, setIsDraggingProject] = useState(false);
  const [isDraggingPage, setIsDraggingPage] = useState(false);
  const [isDraggingTabToPage, setIsDraggingTabToPage] = useState(false);
  
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

  // Add state for seismic hazards fields per tab
  const [seismicTabData, setSeismicTabData] = useState({});
  
  // Encryption state - always enabled for authenticated users
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [encryptionLoading, setEncryptionLoading] = useState(false);
  const [userPassword, setUserPassword] = useState(''); // Store user's login password for automatic encryption
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordPromptCallback, setPasswordPromptCallback] = useState(null);
  
  // State to track current tab type for dropdown (prevents flickering)
  const [currentTabType, setCurrentTabType] = useState('');
  const debounceTimeoutRef = useRef(null);

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
  const { theme, setTheme } = useTheme();
  const [settingsTheme, setSettingsTheme] = useState(theme || 'system');

  // Sync settings theme with actual theme
  useEffect(() => {
    if (theme) {
      setSettingsTheme(theme);
    }
  }, [theme]);
  
  // API key decryption modal state for seismic hazards
  const [showSeismicDecryptModal, setShowSeismicDecryptModal] = useState(false);
  const [seismicDecryptPassword, setSeismicDecryptPassword] = useState('');
  const [seismicDecryptError, setSeismicDecryptError] = useState('');
  const [seismicDecryptLoading, setSeismicDecryptLoading] = useState(false);
  const [pendingSeismicData, setPendingSeismicData] = useState(null);
  
  // Username edit dialog state
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameDialogError, setUsernameDialogError] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  

  

  
  // Workspace state management
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(null);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('Starting authentication check...');
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userId');
        console.log('Found in localStorage:', { token: !!token, userId: storedUserId });
        
        if (token && storedUserId) {
          const userId = parseInt(storedUserId);
          console.log('Setting authentication state for user:', userId);
          setIsAuthenticated(true);
          setUserId(userId);
          
          // Restore password from sessionStorage if available
          const storedPassword = sessionStorage.getItem('userPassword');
          console.log('🔑 Stored password found:', !!storedPassword);
          if (storedPassword) {
            setUserPassword(storedPassword);
          }
          
          // Fetch user profile data
          try {
            console.log('👤 Fetching user profile...');
            const profile = await userService.getUserProfile(userId);
            setUsername(profile.username);
            console.log('User profile loaded:', profile.username);
            
            // Load user's theme preference
            try {
              console.log('Loading theme preference...');
              const themePreference = await themePreferenceService.getThemePreference(userId);
                              console.log('Theme preference loaded:', themePreference);
              
              // Apply the theme preference using next-themes
              // Add a small delay to ensure theme system is ready
              setTimeout(() => {
                setTheme(themePreference);
              }, 100);
              
              // Also save to localStorage for immediate access
              themePreferenceService.saveThemeToLocalStorage(themePreference);
            } catch (themeError) {
              console.warn('⚠️ Failed to load theme preference, using localStorage fallback:', themeError);
              // Use localStorage fallback
              const fallbackTheme = themePreferenceService.getThemeFromLocalStorage();
              console.log('Using fallback theme:', fallbackTheme);
              setTimeout(() => {
                setTheme(fallbackTheme);
              }, 100);
            }
            
            // Initialize workspace after successful authentication
            // Pass the stored password directly to ensure it's available immediately
            console.log('🚀 Starting workspace initialization...');
            await initializeWorkspace(storedPassword);
          } catch (error) {
            console.error('❌ Failed to fetch user profile:', error);
            // If profile fetch fails, user might not be authenticated anymore
            // Clear authentication state
            setIsAuthenticated(false);
            setUserId(null);
            setUsername('');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
          }
        } else {
          console.log('No authentication data found in localStorage');
        }
      } else {
        console.log('Window or localStorage not available');
      }
    };
    
    checkAuthentication();
    

  }, []);

  // Update current tab type when active tab changes (prevents dropdown flickering)
  useEffect(() => {
    // Clear any pending timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the update to prevent rapid changes
    debounceTimeoutRef.current = setTimeout(() => {
      const currentProject = projects.find(p => p.id === selectedPage.projectId);
      const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
      
      if (!currentPage || !currentPage.tabs || currentPage.tabs.length === 0) {
        setCurrentTabType('');
        return;
      }
      
      // Use the SAME logic as the tab name display to prevent mismatches
      const activeTab = findActiveTabOrWelcome(currentPage.tabs);
      
      if (activeTab) {
        const tabType = activeTab.type || activeTab.tabType;
        
        if (tabType === 'Welcome' || tabType === 'welcome') {
          setCurrentTabType('');
        } else {
          const displayName = mapTabTypeToDisplayName(tabType) || '';
          if (displayName !== currentTabType) {
            setCurrentTabType(displayName);
          }
        }
      } else {
        // No tab found, use blank for stability
        setCurrentTabType('');
      }
    }, 50); // Reduced debounce for better responsiveness
    
    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [projects, selectedPage.projectId, selectedPage.pageId]);

  // Initialize workspace data - OPTIMIZED VERSION
  const initializeWorkspace = async (providedPassword = null) => {
    try {
      setWorkspaceLoading(true);
      setWorkspaceError(null);
      
      const passwordToUse = providedPassword || userPassword;
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Workspace loading timeout')), 30000)
      );
      
      const workspaceDataPromise = workspaceStateService.loadWorkspaceData(passwordToUse);
      
      const workspaceData = await Promise.race([workspaceDataPromise, timeoutPromise]);
      
      // Check if any tabs need password for decryption
      const needsPassword = workspaceData.projects?.some(project =>
        project.pages?.some(page =>
          page.tabs?.some(tab => tab.needsPassword)
        )
      );
      
      if (needsPassword && !passwordToUse) {

        setShowPasswordPrompt(true);
        setPasswordPromptCallback(() => async (enteredPassword) => {
          setUserPassword(enteredPassword);
          // Store in sessionStorage for future page refreshes
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem('userPassword', enteredPassword);
          }
          setShowPasswordPrompt(false);

          // Retry workspace initialization with the provided password
          await initializeWorkspace(enteredPassword);
        });
        setWorkspaceLoading(false);
        return;
      }
      
      if (workspaceData.projects && workspaceData.projects.length > 0) {
        // OPTIMIZED: Set projects immediately, then handle active state
        setProjects(workspaceData.projects);
        
        // Try to restore the last active state
        try {
          const restoredState = await workspaceStateService.restoreActiveState(workspaceData);
          
          if (restoredState.activeProject && restoredState.activePage) {
            
            // Update the projects array with the restored expansion state
            const updatedProjects = workspaceData.projects.map(project => {
              if (project.id === restoredState.activeProject.id) {
                return {
                  ...project,
                  isExpanded: restoredState.activeProject.isExpanded
                };
              }
              return project;
            });
            
            // OPTIMIZED: Batch state updates
            React.startTransition(() => {
              setProjects(updatedProjects);
              setSelectedPage({ 
                projectId: restoredState.activeProject.id, 
                pageId: restoredState.activePage.id 
              });
            });
          } else {

            // Fallback to first project and page
            const firstProject = workspaceData.projects[0];
            if (firstProject && firstProject.pages && firstProject.pages.length > 0) {
              const firstPage = firstProject.pages[0];
              React.startTransition(() => {
                setSelectedPage({ projectId: firstProject.id, pageId: firstPage.id });
              });
            }
          }
        } catch (activeStateError) {
          console.warn('⚠️ Failed to restore active state, using defaults:', activeStateError);
          // Fallback to first project and page
          const firstProject = workspaceData.projects[0];
          if (firstProject && firstProject.pages && firstProject.pages.length > 0) {
            const firstPage = firstProject.pages[0];
            React.startTransition(() => {
              setSelectedPage({ projectId: firstProject.id, pageId: firstPage.id });
            });
          }
        }
      } else {
        console.log('📝 No existing projects, initializing default workspace...');
        // Initialize workspace with default structure
        await workspaceStateService.initializeWorkspace();
        // Reload data after initialization
        const initializedData = await workspaceStateService.loadWorkspaceData();
        console.log('Setting initialized projects:', initializedData.projects);
        
        // OPTIMIZED: Batch state updates for new workspace
        React.startTransition(() => {
          setProjects(initializedData.projects);
          
          if (initializedData.projects && initializedData.projects.length > 0) {
            const firstProject = initializedData.projects[0];
            if (firstProject && firstProject.pages && firstProject.pages.length > 0) {
              const firstPage = firstProject.pages[0];
              setSelectedPage({ projectId: firstProject.id, pageId: firstPage.id });
            }
          }
        });
      }
      
      // OPTIMIZED: Set workspace loaded with transition
      React.startTransition(() => {
        setWorkspaceLoaded(true);
      });
      console.log('🎉 Workspace initialization completed!');
    } catch (error) {
      console.error('❌ Error initializing workspace:', error);
      setWorkspaceError(error.message);
      setWorkspaceLoading(false);
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
          console.log('TAB_UPDATED_OPTIMISTIC:', change.tabId, 'updates:', change.updates);
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
          
        case 'TAB_DATA_REPLACED':
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
          
        case 'TAB_DELETED_OPTIMISTIC':
          // Optimistically remove the tab from the UI while preserving project expansion state
          setProjects(prev => {
            // Store current expansion states before the update
            const expansionStates = new Map();
            prev.forEach(project => {
              const wasExpanded = project.isExpanded || project.expanded;
              expansionStates.set(project.id, wasExpanded);
            });
            
            const updatedProjects = prev.map(project => {
              const preservedExpansion = expansionStates.get(project.id);
              return {
                ...project,
                // Explicitly preserve project expansion state
                isExpanded: preservedExpansion,
                expanded: preservedExpansion,
                pages: (project.pages || []).map(page => ({
                  ...page,
                  tabs: (page.tabs || []).filter(tab => tab.id !== change.tabId)
                }))
              };
            });
            
            return updatedProjects;
          });
          break;
          
        case 'TAB_DELETED':
          // Tab was successfully deleted from backend
          console.log('Tab deleted successfully:', change.tabId);
          // The optimistic update already removed it from the UI
          break;
          
        case 'TAB_DELETE_FAILED':
          // Tab deletion failed - reload the workspace to restore the tab
          console.error('❌ Tab deletion failed:', change.tabId, change.error);
          showToastNotification('Failed to delete tab: ' + change.error, 'error');
          // Reload workspace to restore the failed deletion
          initializeWorkspace(currentUserPassword);
          break;
          
        case 'TAB_DATA_SAVED':
          // Tab data was successfully saved to backend
          console.log('Tab data saved successfully:', change.tabId);
          break;
          
        case 'TAB_DATA_SAVE_FAILED':
          // Tab data save failed - could implement rollback here if needed
          console.error('❌ Tab data save failed:', change.tabId, change.error);
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
  const tabDropdownRef = useRef(null);
  
  // Debug wrapper for setShowTabDropdown
  const debugSetShowTabDropdown = useCallback((value) => {
    setShowTabDropdown(value);
  }, [showTabDropdown]);
  
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
    setIsDraggingTabToPage(true);
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId.toString());
    // Store the source page information for cross-page movement
    e.dataTransfer.setData('application/json', JSON.stringify({
      tabId: tabId,
      sourceProjectId: selectedPage.projectId,
      sourcePageId: selectedPage.pageId
    }));
  }, [selectedPage]);

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
    setIsDraggingTabToPage(false);
    setDraggedTab(null);
    setDragOverTab(null);
    setDragOverPage(null);
  }, []);

  // Function to move a tab from one page to another
  const moveTabToPage = useCallback(async (tabId, sourceProjectId, sourcePageId, targetProjectId, targetPageId) => {
    console.log(`Moving tab ${tabId} from page ${sourcePageId} to page ${targetPageId}`);
    
    const updatedProjects = [...projects];
    const sourceProject = updatedProjects.find(p => p.id === sourceProjectId);
    const targetProject = updatedProjects.find(p => p.id === targetProjectId);
    
    if (!sourceProject || !targetProject) {
      throw new Error('Source or target project not found');
    }
    
    const sourcePage = sourceProject.pages.find(p => p.id === sourcePageId);
    const targetPage = targetProject.pages.find(p => p.id === targetPageId);
    
    if (!sourcePage || !targetPage) {
      throw new Error('Source or target page not found');
    }
    
    const sourceTabIndex = sourcePage.tabs.findIndex(tab => tab.id === tabId);
    if (sourceTabIndex === -1) {
      throw new Error('Source tab not found');
    }
    
    const movedTab = sourcePage.tabs[sourceTabIndex];
    
    try {
      console.log('Starting moveTabToPage function');
      
      // Step 1: Get the tab data before moving (to preserve it)
      let tabData = null;
      try {
        if (encryptionEnabled && userPassword) {
          tabData = await workspaceStateService.getTabDataForMerging(tabId, userPassword);
        } else {
          tabData = await workspaceApiService.getTabData(tabId);
        }
        console.log('Retrieved tab data for move:', tabData);
      } catch (dataError) {
        console.warn('⚠️ Could not retrieve tab data, will use template defaults:', dataError);
        // Continue with move even if data retrieval fails
      }
      
      // Step 2: Create new tab in target page
      const originalTabName = movedTab.name;
      const newTabType = movedTab.tabType || movedTab.type;
      const position = targetPage.tabs.length; // Add at the end
      
      // Check for duplicate tab names in target page
      const existingTabNames = targetPage.tabs.map(tab => tab.name);
      const newTabName = handleDuplicateName(originalTabName, existingTabNames);
      
      console.log(`📝 Creating new tab "${newTabName}" in target page ${targetPageId}`);
      if (newTabName !== originalTabName) {
        console.log(`Tab name changed from "${originalTabName}" to "${newTabName}" to avoid duplicate`);
      }
      
      const newTab = await workspaceApiService.createTab(targetPageId, newTabName, newTabType, position);
              console.log('New tab created:', newTab);
              console.log('New tab details:', {
        id: newTab.id,
        name: newTab.name,
        type: newTab.type,
        tabType: newTab.tabType,
        position: newTab.position
      });
      
              console.log('About to start Step 3: Copy tab data');
      
      // Step 3: Copy tab data to new tab if available
      if (tabData && tabData.data) {
        try {
          console.log('Copying tab data to new tab');
          if (encryptionEnabled && userPassword) {
            await workspaceStateService.replaceTabDataEncrypted(newTab.id, tabData.data, userPassword);
          } else {
            await workspaceApiService.replaceTabDataSmart(newTab.id, tabData.data);
          }
                      console.log('Tab data copied successfully');
        } catch (dataCopyError) {
          console.warn('⚠️ Failed to copy tab data, continuing with move:', dataCopyError);
        }
      }
      
              console.log('About to start Step 4: Handle seismic results');
      
      // Step 4: Handle seismic results if this is a seismic tab
      const originalTabKey = `${sourceProjectId}_${sourcePageId}_${tabId}`;
      const newTabKey = `${targetProjectId}_${targetPageId}_${newTab.id}`;
      
                console.log('Checking seismic results for key:', originalTabKey);
          console.log('Available seismic results keys:', Object.keys(seismicResults));
      
      if (seismicResults[originalTabKey]) {
        console.log('🌊 Moving seismic results to new tab');
        setSeismicResults(prev => ({
          ...prev,
          [newTabKey]: seismicResults[originalTabKey]
        }));
        // Remove from original location
        setSeismicResults(prev => {
          const updated = { ...prev };
          delete updated[originalTabKey];
          return updated;
        });
      } else {
        console.log('🌊 No seismic results to move');
      }
      
              console.log('About to start Step 5: Update local state');
      
      // Step 5: Update local state - remove from source, add to target
              console.log('Starting state update...');
              console.log('Source project ID:', sourceProjectId, 'Target project ID:', targetProjectId);
        console.log('Source page ID:', sourcePageId, 'Target page ID:', targetPageId);
      
      const updatedProjectsAfterMove = updatedProjects.map(project => {
                  console.log(`Processing project ${project.id}:`, project.name);
        
        // Handle case where source and target are the same project
        if (project.id === sourceProjectId && project.id === targetProjectId) {
                      console.log(`Processing same project for both source and target: ${sourceProjectId}`);
          return {
            ...project,
            pages: project.pages.map(page => {
              if (page.id === sourcePageId && page.id === targetPageId) {
                // Same page - remove the tab and add it back with new ID
                console.log(`Processing same page for both source and target: ${sourcePageId}`);
                const filteredTabs = page.tabs.filter(tab => tab.id !== tabId);
                const newTabs = [...filteredTabs, newTab];
                                  console.log(`Same page: removed tab ${tabId}, added tab ${newTab.id}, total tabs:`, newTabs.length);
                return {
                  ...page,
                  tabs: newTabs
                };
              } else if (page.id === sourcePageId) {
                // Source page only - remove the tab
                const filteredTabs = page.tabs.filter(tab => tab.id !== tabId);
                console.log(`Removed tab ${tabId} from source page ${sourcePageId}, remaining tabs:`, filteredTabs.length);
                return {
                  ...page,
                  tabs: filteredTabs
                };
              } else if (page.id === targetPageId) {
                // Target page only - add the new tab
                console.log(`Target page ${targetPageId} before update:`, page.tabs.length, 'tabs');
                const newTabs = [...page.tabs, newTab];
                console.log(`Added tab ${newTab.id} to target page ${targetPageId}, total tabs:`, newTabs.length);
                console.log(`New tabs array:`, newTabs.map(t => ({ id: t.id, name: t.name })));
                return {
                  ...page,
                  tabs: newTabs
                };
              }
              return page;
            })
          };
        } else if (project.id === sourceProjectId) {
          console.log(`Processing source project ${sourceProjectId}`);
          return {
            ...project,
            pages: project.pages.map(page => {
                          if (page.id === sourcePageId) {
              const filteredTabs = page.tabs.filter(tab => tab.id !== tabId);
              console.log(`Removed tab ${tabId} from source page ${sourcePageId}, remaining tabs:`, filteredTabs.length);
              return {
                ...page,
                tabs: filteredTabs
              };
              }
              return page;
            })
          };
        } else if (project.id === targetProjectId) {
          console.log(`Processing target project ${targetProjectId}`);
          return {
            ...project,
            pages: project.pages.map(page => {
              console.log(`Processing page ${page.id} in target project`);
              if (page.id === targetPageId) {
                console.log(`Target page ${targetPageId} before update:`, page.tabs.length, 'tabs');
                const newTabs = [...page.tabs, newTab];
                console.log(`Added tab ${newTab.id} to target page ${targetPageId}, total tabs:`, newTabs.length);
                console.log(`New tabs array:`, newTabs.map(t => ({ id: t.id, name: t.name })));
                return {
                  ...page,
                  tabs: newTabs
                };
              }
              return page;
            })
          };
        }
        return project;
      });
      
      console.log('Updating projects state with moved tab');
      setProjects(updatedProjectsAfterMove);
      
      // Debug: Check if the state was updated correctly
      setTimeout(() => {
        const updatedTargetPage = updatedProjectsAfterMove
          .find(p => p.id === targetProjectId)
          ?.pages.find(p => p.id === targetPageId);
        console.log(`After state update - Target page ${targetPageId} has ${updatedTargetPage?.tabs?.length || 0} tabs`);
        if (updatedTargetPage?.tabs) {
          console.log(`Target page tabs:`, updatedTargetPage.tabs.map(t => ({ id: t.id, name: t.name })));
        }
      }, 100);
      
      // Step 6: Update selected page if the moved tab was the active tab
      if (selectedPage.projectId === sourceProjectId && selectedPage.pageId === sourcePageId) {
        const updatedSourcePage = updatedProjectsAfterMove
          .find(p => p.id === sourceProjectId)
          ?.pages.find(p => p.id === sourcePageId);
        
        if (updatedSourcePage && updatedSourcePage.tabs.length > 0) {
          // Select the first remaining tab in source page
          setSelectedPage({ projectId: sourceProjectId, pageId: sourcePageId });
        } else {
          // If no tabs left in source page, select the target page
          setSelectedPage({ projectId: targetProjectId, pageId: targetPageId });
        }
      }
      
      // Step 7: Delete the original tab
      console.log('Deleting original tab');
      await workspaceApiService.deleteTab(tabId);
              console.log('Original tab deleted');
      
      // Step 8: Force a re-render to ensure UI updates
              console.log('Forcing UI update');
      setProjects(prevProjects => {
        const forceUpdate = prevProjects.map(project => ({ ...project }));
        return forceUpdate;
      });
      
      showToastNotification(`Tab "${newTabName}" moved to "${targetPage.name}"`, 'success');
      
    } catch (error) {
      console.error('Error moving tab:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to move tab: ${error.message}`);
    }
  }, [projects, selectedPage, encryptionEnabled, userPassword, seismicResults]);

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
    // Handle tab-to-page drag over
    if (isDraggingTabToPage && draggedTab) {
      setDragOverPage({ projectId, pageId });
    }
  }, [draggedPage, isDraggingTabToPage, draggedTab]);

  const handlePageDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPage(null);
  }, []);

  const handlePageDrop = useCallback(async (e, targetProjectId, targetPageId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Handle tab-to-page drop
    if (isDraggingTabToPage && draggedTab) {
      try {
        const dragData = e.dataTransfer.getData('application/json');
        if (dragData) {
          const { sourceProjectId, sourcePageId } = JSON.parse(dragData);
          
          // Only allow dropping if it's a different page
          if (sourceProjectId !== targetProjectId || sourcePageId !== targetPageId) {
            await moveTabToPage(draggedTab, sourceProjectId, sourcePageId, targetProjectId, targetPageId);
          }
        }
      } catch (error) {
        console.error('Error moving tab to page:', error);
        showToastNotification('Failed to move tab: ' + error.message, 'error');
      }
      // Reset all drag states
      setIsDraggingTabToPage(false);
      setDraggedTab(null);
      setDragOverPage(null);
      setIsDragging(false);
      return;
    }
    
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
      
      // Get the most up-to-date seismic results (local state takes precedence over database)
      const localSeismicResults = seismicResults[originalTabKey] || null;
      const databaseSeismicResults = tab.mergedData?.seismicResults || {};
      const mostRecentSeismicResults = localSeismicResults || (databaseSeismicResults.site_class ? databaseSeismicResults : null);
      
      const tabData = {
        seismicData: seismicTabData[originalTabKey] || null,
        seismicResults: mostRecentSeismicResults,  // Use the most recent results
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
              console.log('Tab copied to clipboard:', { 
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
        console.log('Tab removed from UI for cut operation (keeping data intact):', tabId);
      }
    }
  }, [projects, selectedPage]);

  const pasteTabFromClipboard = useCallback(async (targetProjectId, targetPageId) => {
            console.log('Attempting to paste tab from clipboard:', { 
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
        console.log('Starting cut/paste operation for tab:', tab.id, 'name:', tab.name);
        
        // Step 1: Delete the original tab from backend to avoid name conflicts
        await workspaceStateService.deleteTab(tab.id);
        console.log('Original tab deleted from backend:', tab.id);
        
        // Step 2: Wait a moment to ensure deletion is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 3: Create new tab in target location with potentially same name
        console.log('Creating new tab with name:', newTabName, 'type:', tab.tabType || tab.type);
        // For paste to page, add to the end
        const targetPage = projects.find(p => p.id === targetProjectId)?.pages?.find(pg => pg.id === targetPageId);
        const position = targetPage?.tabs?.length || 0;
        const movedTab = await workspaceApiService.createTab(targetPageId, newTabName, tab.tabType || tab.type, position);
        console.log('New tab created in target location:', movedTab.id);
        
        // Step 4: Restore the original data to the new tab (only delta data)
        if (tabData && tabData.mergedData) {
          const deltaData = tabTemplateService.extractDelta(tab.tabType || tab.type, tabData.mergedData);
          if (Object.keys(deltaData).length > 0) {
            await workspaceApiService.replaceTabDataSmart(movedTab.id, deltaData);
            console.log('Original delta data restored to new tab');
          }
        }
        
        // Step 4.5: Restore seismic results to local state if they exist
        if (tabData && tabData.seismicResults) {
          const newTabKey = `${targetProjectId}_${targetPageId}_${movedTab.id}`;
          setSeismicResults(prev => ({
            ...prev,
            [newTabKey]: tabData.seismicResults
          }));
          console.log('Seismic results restored to local state for moved tab');
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
        console.log('Tab moved successfully (cut/paste):', newTabName);
        showToastNotification(`Tab "${newTabName}" moved successfully`, 'success');
      } catch (error) {
        console.error('Failed to move tab:', error);
        showToastNotification('Failed to move tab: ' + error.message, 'error');
      }
    } else {
      // For copy operation: Create new tab (existing logic)
      try {
        // For paste to page, add to the end
        const targetPage = projects.find(p => p.id === targetProjectId)?.pages?.find(pg => pg.id === targetPageId);
        const position = targetPage?.tabs?.length || 0;
        const createdTab = await workspaceApiService.createTab(targetPageId, newTabName, tab.tabType || tab.type, position);
        
        // Copy the tab data if it exists in the clipboard (only delta data)
        if (tabData && tabData.mergedData) {
          const deltaData = tabTemplateService.extractDelta(tab.tabType || tab.type, tabData.mergedData);
          if (Object.keys(deltaData).length > 0) {
            await workspaceApiService.replaceTabDataSmart(createdTab.id, deltaData);
          }
        }
        
        // Restore seismic results to local state if they exist
        if (tabData && tabData.seismicResults) {
          const newTabKey = `${targetProjectId}_${targetPageId}_${createdTab.id}`;
          setSeismicResults(prev => ({
            ...prev,
            [newTabKey]: tabData.seismicResults
          }));
          console.log('Seismic results restored to local state for copied tab');
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
        console.log('Tab copied successfully:', newTabName);
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
        console.log('Attempting to paste tab after specific tab:', {
      hasClipboard: !!clipboard.data, 
      clipboardType: clipboard.type,
      targetTabId 
    });
    if (!clipboard.data || clipboard.type === null) {
      console.log('No clipboard data available');
      return;
    }
    
    const { tab, tabData, sourceProjectId, sourcePageId, sourceTabId } = clipboard.data;
            console.log('Clipboard data:', { 
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
            console.log('Target page lookup:', { 
      targetProjectId, 
      targetPageId, 
      foundPage: !!targetPage,
      pageTabsCount: targetPage?.tabs?.length || 0 
    });
    if (!targetPage) {
              console.log('Target page not found');
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
    
            console.log('Operation details:', { 
      isSamePage, 
      isCutOperation, 
      finalTabName: newTabName 
    });
    
    if (isCutOperation) {
      // For cut operation: Delete original first, then create new with preserved data
      try {
        console.log('Starting cut/paste after tab operation for tab:', tab.id, 'name:', tab.name);
        
        // Step 1: Delete the original tab from backend to avoid name conflicts
        await workspaceStateService.deleteTab(tab.id);
        console.log('Original tab deleted from backend:', tab.id);
        
        // Step 2: Wait a moment to ensure deletion is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 3: Create new tab in target location
        console.log('Creating new tab with name:', newTabName, 'type:', tab.tabType || tab.type);
        // Calculate position after the target tab
        const targetTabIndex = targetPage.tabs.findIndex(t => t.id === targetTabId);
        const position = targetTabIndex + 1;
        const movedTab = await workspaceApiService.createTab(targetPageId, newTabName, tab.tabType || tab.type, position);
        console.log('New tab created in target location:', movedTab.id);
        
        // Step 4: Restore the original data to the new tab (only delta data)
        if (tabData && tabData.mergedData) {
          const deltaData = tabTemplateService.extractDelta(tab.tabType || tab.type, tabData.mergedData);
          if (Object.keys(deltaData).length > 0) {
            await workspaceApiService.replaceTabDataSmart(movedTab.id, deltaData);
            console.log('Original delta data restored to new tab');
          }
        }
        
        // Step 4.5: Restore seismic results to local state if they exist
        if (tabData && tabData.seismicResults) {
          const newTabKey = `${targetProjectId}_${targetPageId}_${movedTab.id}`;
          setSeismicResults(prev => ({
            ...prev,
            [newTabKey]: tabData.seismicResults
          }));
          console.log('Seismic results restored to local state for moved tab (after)');
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
        console.log('Tab moved successfully (cut/paste after tab):', newTabName);
              } catch (error) {
          console.error('Failed to move tab:', error);
          showToastNotification('Failed to move tab: ' + error.message, 'error');
        }
    } else {
      // For copy operation: Create new tab (existing logic)
      try {
        // Calculate position after the target tab
        const targetTabIndex = targetPage.tabs.findIndex(t => t.id === targetTabId);
        const position = targetTabIndex + 1;
        const createdTab = await workspaceApiService.createTab(targetPageId, newTabName, tab.tabType || tab.type, position);
        
        // Copy the tab data if it exists in the clipboard (only delta data)
        if (tabData && tabData.mergedData) {
          const deltaData = tabTemplateService.extractDelta(tab.tabType || tab.type, tabData.mergedData);
          if (Object.keys(deltaData).length > 0) {
            await workspaceApiService.replaceTabDataSmart(createdTab.id, deltaData);
          }
        }
        
        // Restore seismic results to local state if they exist
        if (tabData && tabData.seismicResults) {
          const newTabKey = `${targetProjectId}_${targetPageId}_${createdTab.id}`;
          setSeismicResults(prev => ({
            ...prev,
            [newTabKey]: tabData.seismicResults
          }));
          console.log('Seismic results restored to local state for copied tab (after)');
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
              console.log('Tab pasted after specific tab successfully:', newTabName);
    } catch (error) {
              console.error('Failed to paste tab after specific tab:', error);
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
    if (showTabDropdown && tabDropdownRef.current) {
      // Check if the click was inside the dropdown using ref
      const isInsideDropdown = tabDropdownRef.current.contains(event.target);
      
      // Alternative check - look for any dropdown-related elements in the path
      const clickPath = event.composedPath();
      const hasDropdownInPath = clickPath.some(element => 
        element === tabDropdownRef.current || 
        (element.classList && (
          element.classList.contains('hover:bg-destructive') ||
          element.classList.contains('ml-2') ||
          element.getAttribute && element.getAttribute('title') === 'Close Tab'
        ))
      );
      
      if (!isInsideDropdown && !hasDropdownInPath) {
        debugSetShowTabDropdown(false);
      }
    }
  }, [contextMenu.show, showTabDropdown, debugSetShowTabDropdown]);

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

      // Active tab persistence
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
            console.log('Sediment probability useEffect triggered');
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
                    console.log('Probabilities calculated and set!');
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
          
          // Store user's password for automatic encryption/decryption
          setUserPassword(password);
          // Also store in sessionStorage for persistence across page refreshes
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem('userPassword', password);
          }
          console.log('Password stored for automatic encryption (memory + session)');
          
          // Fetch user profile to ensure we have the latest data
                  try {
          const profile = await userService.getUserProfile(data.userId);
            setUsername(profile.username);
          } catch (error) {
            console.error('Failed to fetch user profile after login:', error);
            // Fallback to username from login response
            setUsername(data.username || username);
          }
          
          // Initialize workspace after successful login with automatic decryption
          try {
            const workspaceData = await workspaceStateService.loadWorkspaceData(password);
            console.log('📊 Loaded workspace data with automatic decryption:', workspaceData);
            
            if (workspaceData.projects && workspaceData.projects.length > 0) {
              console.log('Setting projects:', workspaceData.projects.length, 'projects');
              setProjects(workspaceData.projects);
              
              // Try to restore the last active state
              try {
                const restoredState = await workspaceStateService.restoreActiveState(workspaceData);
                console.log('Restored active state:', restoredState);
                
                if (restoredState.activeProject && restoredState.activePage) {
                                      console.log('Restoring last active project and page');
                  
                  // Update the projects array with the restored expansion state
                  const updatedProjects = workspaceData.projects.map(project => {
                    if (project.id === restoredState.activeProject.id) {
                      return {
                        ...project,
                        isExpanded: restoredState.activeProject.isExpanded
                      };
                    }
                    return project;
                  });
                  
                  setProjects(updatedProjects);
                  setSelectedPage({
                    projectId: restoredState.activeProject.id,
                    pageId: restoredState.activePage.id
                  });
                } else {
                  console.log('No previous state, using first project/page');
                  if (workspaceData.projects[0] && workspaceData.projects[0].pages && workspaceData.projects[0].pages[0]) {
                    setSelectedPage({
                      projectId: workspaceData.projects[0].id,
                      pageId: workspaceData.projects[0].pages[0].id
                    });
                  }
                }
              } catch (error) {
                console.error('❌ Failed to restore active state:', error);
              }
            }
            console.log('Workspace initialized after login with encryption');
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
    // Clear password from both memory and session storage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('userPassword');
    }
    setIsAuthenticated(false);
    setUsername('');
    setUserId(null);
    setUserPassword('');
    setHasStoredApiKey(false);
    setApiKeyStatus(null);
            console.log('Password cleared from session on logout');
  };

  // Toast notification helper
  const showToastNotification = (message, type = 'success') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
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
              console.log('Saving seismic results to database (decrypt path):', seismicResultsDelta);
                              console.log('Using tab ID:', tabId);
              await workspaceStateService.saveTabDataEncryptedImmediately(tabId, 'seismic', seismicResultsDelta, userPassword);
                              console.log('Seismic results saved successfully (decrypt path)');
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

  const handleUsernameUpdate = async () => {
    if (!newUsername || !newUsername.trim()) {
      setUsernameDialogError('Please enter a username');
      return;
    }

    setUsernameLoading(true);
    setUsernameDialogError('');

    try {
      const result = await userService.updateProfile(userId, newUsername.trim());
      setUsername(newUsername.trim());
      setShowUsernameDialog(false);
      setNewUsername('');
      showToastNotification('Username updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update username:', error);
      setUsernameDialogError(error.message || 'Failed to update username');
    } finally {
      setUsernameLoading(false);
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

  const selectProject = async (projectId) => {
    try {
      // Save active project state to backend
      await workspaceStateService.updateActiveProject(projectId);
      
      // If this project has pages, select the first page
      const project = projects.find(p => p.id === projectId);
      if (project && project.pages && project.pages.length > 0) {
        const firstPage = project.pages[0];
        await selectPage(projectId, firstPage.id);
      }
    } catch (error) {
      console.error('❌ Failed to save active project:', error);
      // Don't show error to user as this is background save
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
            console.log('Project copied to backend:', newProjectId);
            
            // Copy all pages from original project
            for (const originalPage of project.pages) {
              const pageNames = getExistingNames('page', newProjectId);
              const newPageName = generateUniqueName(originalPage.name, pageNames);
              const newPage = await workspaceStateService.createPage(newProjectId, newPageName);
              const newPageId = newPage.id; // Use the real ID from the returned page object
              console.log('Page copied to backend:', newPageId);
              
              // Copy all tabs from original page with their data
              if (originalPage.tabs && originalPage.tabs.length > 0) {
                for (const originalTab of originalPage.tabs) {
                  const tabNames = getExistingNames('tab', newProjectId, newPageId);
                  const newTabName = generateUniqueName(originalTab.name, tabNames);
                  
                  // Create the tab
                  const createdTab = await workspaceStateService.createTab(newPageId, newTabName, originalTab.type || originalTab.tabType || 'design_tables');
                  console.log('Tab created:', newTabName);
                  
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
                      console.log('Tab data copied:', newTabName);
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
            console.log('Project deleted from backend:', projectId);
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
            console.log('Page copied to backend:', newPageId);
            
            // Copy all tabs from original page with their data
            if (page.tabs && page.tabs.length > 0) {
              for (const originalTab of page.tabs) {
                const tabNames = getExistingNames('tab', projectId, newPageId);
                const newTabName = generateUniqueName(originalTab.name, tabNames);
                
                // Create the tab
                const createdTab = await workspaceStateService.createTab(newPageId, newTabName, originalTab.type || originalTab.tabType || 'design_tables');
                console.log('Tab created:', newTabName);
                
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
                                          console.log('Tab data copied:', newTabName);
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
            console.log('Page deleted from backend:', pageId);
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
            console.log('Tab copied successfully:', newTabName);
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
            
            console.log('New tab created to the right:', newTabNameRight);
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
            console.log('Tab locked successfully');
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
            console.log('Tab unlocked successfully');
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
            console.log('Tab moved to start successfully');
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
            console.log('Tab moved to end successfully');
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
        case 'resetToTemplate':
          // Reset tab to its default template state
          try {
            const tabKey = `${projectId}_${pageId}_${tabId}`;
            
            // Clear all local state for this tab
            setSeismicResults(prev => ({ ...prev, [tabKey]: null }));
            setSeismicTabData(prev => ({ ...prev, [tabKey]: {} }));
            setSnowLoadTabData(prev => ({ ...prev, [tabKey]: {} }));
            setWindLoadTabData(prev => ({ ...prev, [tabKey]: {} }));
            
            // Clear database data - replace with empty template data
            const emptyTemplateData = {};
            await workspaceApiService.replaceTabDataSmart(tabId, emptyTemplateData);
            
            // Immediately update the tab's mergedData to reflect the reset state
            setProjects(prevProjects => prevProjects.map(p => {
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
                              mergedData: {}
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
            }));
            
            console.log('✅ Tab reset to template successfully');
            showToastNotification('Tab reset to template successfully', 'success');
          } catch (error) {
            console.error('❌ Failed to reset tab to template:', error);
            showToastNotification('Failed to reset tab: ' + error.message, 'error');
          }
          break;
        case 'closeTabsToRight':
          // Close all tabs to the right of the current tab (except locked tabs)
          try {
            const currentPage = project.pages.find(p => p.id === pageId);
            const currentTabIndex = currentPage.tabs.findIndex(t => t.id === tabId);
            
            if (currentTabIndex === -1) {
              console.error('❌ Current tab not found');
              return;
            }
            
            // Get all tabs to the right of the current tab (excluding locked tabs)
            const tabsToDelete = currentPage.tabs
              .slice(currentTabIndex + 1)
              .filter(t => !t.locked && !t.isLocked);
            
            if (tabsToDelete.length === 0) {
              console.log('📝 No tabs to close to the right');
              return;
            }
            
            // Delete tabs from backend
            for (const tabToDelete of tabsToDelete) {
              await workspaceStateService.deleteTab(tabToDelete.id);
            }
            
            // Update frontend state
            const updatedProjectsCloseToRight = projects.map(p => {
              if (p.id === projectId) {
                return {
                  ...p,
                  pages: p.pages.map(pa => {
                    if (pa.id === pageId) {
                      // Keep tabs up to and including the current tab, plus any locked tabs to the right
                      const tabsToKeep = pa.tabs.slice(0, currentTabIndex + 1);
                      const lockedTabsToRight = pa.tabs
                        .slice(currentTabIndex + 1)
                        .filter(t => t.locked || t.isLocked);
                      
                      const remainingTabs = [...tabsToKeep, ...lockedTabsToRight];
                      
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
            
            setProjects(updatedProjectsCloseToRight);
            console.log(`✅ Closed ${tabsToDelete.length} tabs to the right successfully`);
            showToastNotification(`Closed ${tabsToDelete.length} tabs to the right`, 'success');
          } catch (error) {
            console.error('❌ Failed to close tabs to the right:', error);
            showToastNotification('Failed to close tabs to the right: ' + error.message, 'error');
          }
          break;
        case 'closeThisTab':
          // Close the current tab
          try {
            await closeTab(tabId);
            console.log('✅ Tab closed successfully');
          } catch (error) {
            console.error('❌ Failed to close tab:', error);
            showToastNotification('Failed to close tab: ' + error.message, 'error');
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
    console.log('🔄 closeTab called for:', tabId);
    
    // Check if this tab is already being deleted
    if (deletingTabs.has(tabId)) {
      console.warn('⚠️ Tab deletion already in progress:', tabId);
      return;
    }
    
    const { projectId, pageId } = selectedPage;
    
    // Find the tab to check if it's locked or if it even exists
    const project = projects.find(p => p.id === projectId);
    const page = project?.pages?.find(p => p.id === pageId);
    const tabToClose = page?.tabs?.find(tab => tab.id === tabId);
    
    // Check if tab exists and is not already being deleted
    if (!tabToClose) {
      console.warn('⚠️ Tab not found or already deleted:', tabId);
      return;
    }
    
    if (tabToClose.locked) {
      console.warn('🔒 Cannot delete locked tab:', tabId);
      return; // Don't close locked tabs
    }
    
    // Mark this tab as being deleted
    setDeletingTabs(prev => new Set(prev).add(tabId));
    console.log('🗑️ Starting tab deletion process for:', tabId);
    
    // Delete using workspace state service (which handles optimistic updates and state preservation)
    try {
      await workspaceStateService.deleteTab(tabId);
      console.log('✅ Tab deletion completed successfully for:', tabId);
      
      // Note: Tab selection after deletion is handled by the UI automatically
      // when the optimistic update removes the tab from the list
    } catch (error) {
      console.error('❌ Failed to delete tab:', tabId, error);
      // Only show error notification if it's not a "Tab not found" error (which might be expected due to optimistic updates)
      if (!error.message.includes('Tab not found')) {
        showToastNotification('Failed to delete tab: ' + error.message, 'error');
      }
    } finally {
      // Remove the tab from the deleting set
      setDeletingTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tabId);
        return newSet;
      });
      console.log('🧹 Removed tab from deleting set:', tabId);
    }
  };

  const selectTab = async (tabId) => {
    const { projectId, pageId } = selectedPage;
    
    // Store current project expansion state
    const project = projects.find(p => p.id === projectId);
    const currentProjectExpanded = project?.isExpanded || project?.expanded || false;

    
    // Update local state immediately
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          // Preserve project expansion state
          isExpanded: currentProjectExpanded,
          expanded: currentProjectExpanded,
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
    // Only call backend for real tabs (UUIDs), not temporary Welcome tabs (timestamps)
    const isValidUUID = typeof tabId === 'string' && tabId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    if (isValidUUID) {
      try {
        await workspaceApiService.updateActiveTab(tabId);
        console.log('✅ Tab selected and active status saved:', tabId);
      } catch (error) {
        console.error('❌ Failed to save active tab status:', error);
        // Don't show error to user as this is background save
      }
    } else {
      console.log('📝 Skipping backend save for temporary Welcome tab:', tabId);
    }
  };

  const selectPage = async (projectId, pageId) => {
    setSelectedPage({ projectId, pageId });
    
    // Save active project state first (since we're selecting a page within this project)
    try {
      await workspaceStateService.updateActiveProject(projectId);
    } catch (error) {
      console.error('❌ Failed to save active project:', error);
      // Don't show error to user as this is background save
    }
    
    // Save active page state to backend
    try {
      await workspaceStateService.updateActivePage(pageId);
    } catch (error) {
      console.error('❌ Failed to save active page:', error);
      // Don't show error to user as this is background save
    }
    
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
      'Seismic Hazards': 'seismic'
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
      'seismic': 'Seismic Hazards'
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
    
      // Check if this is a valid UUID (not a temporary Welcome tab)
      const isValidUUID = typeof tabId === 'string' && tabId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      if (!isValidUUID) {
        console.log('📝 Cannot change type of temporary Welcome tab with timestamp ID:', tabId);
        showToastNotification('Please create a real tab first before changing its type', 'error');
        return;
      }
    
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
        <div className="min-h-screen bg-background">
          {/* Top bar */}
          <div className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          </div>

          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center px-6 py-12">
            {showForm ? (
              <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">
                    {isLogin ? 'Sign In' : 'Register'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                      <div className="space-y-2">
                        {(focus.username || username) && (
                          <Label className="text-xs text-primary font-medium">
                            Username
                          </Label>
                        )}
                        <Input
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
                          className="h-12"
                        />
                        {usernameError && (
                          <div className="text-destructive text-xs mt-1 bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                            {usernameError}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {(focus.email || email) && (
                        <Label className="text-xs text-primary font-medium">
                          Email Address
                        </Label>
                      )}
                      <Input
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
                        className="h-12"
                      />
                      {emailError && (
                        <div className="text-destructive text-xs mt-1 bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                          {emailError}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(focus.password || password) && (
                        <Label className="text-xs text-primary font-medium">
                          Password
                        </Label>
                      )}
                      <Input
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
                        className="h-12"
                      />
                      {!isLogin && (
                        <div className="text-xs mt-1 p-3 rounded-md border border-muted bg-muted/50 text-muted-foreground flex items-center">
                          <Info size={12} className="mr-2" />
                          <span>Password must be at least 8 characters with at least one uppercase letter and one number.</span>
                        </div>
                      )}
                      {passwordError && (
                        <div className="text-destructive text-xs mt-1 bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                          {passwordError}
                        </div>
                      )}
                    </div>

                    {!isLogin && (
                      <div className="space-y-2">
                        {(focus.confirmPassword || confirmPassword) && (
                          <Label className="text-xs text-primary font-medium">
                            Confirm Password
                          </Label>
                        )}
                        <Input
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
                          className="h-12"
                        />
                        {confirmPasswordError && (
                          <div className="text-destructive text-xs mt-1 bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                            {confirmPasswordError}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
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
                      className="w-full h-12 flex items-center justify-center space-x-2"
                    >
                      {isLogin ? (
                        <ArrowRight size={14} className="text-primary-foreground" />
                      ) : (
                        <UserPlus size={14} className="text-primary-foreground" />
                      )}
                      <span>{isLogin ? 'Sign In' : 'Register'}</span>
                    </Button>
                  </form>

                  {/* Action buttons */}
                  <div className="mt-8 text-center space-y-4">
                    {isLogin ? (
                      <>
                        {/* Login page: Two buttons in same line */}
                        <div className="w-full max-w-md mx-auto flex gap-4 mt-2">
                          <Button
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
                            variant="outline"
                            className="w-1/2 h-12 flex items-center justify-center space-x-2"
                            type="button"
                          >
                            <ArrowRight size={16} className="text-foreground" />
                            <span>Need to register?</span>
                          </Button>
                          
                          <Button
                            onClick={() => {
                              setErrorMessage('Forgot password functionality coming soon!');
                            }}
                            variant="outline"
                            className="w-1/2 h-12 flex items-center justify-center space-x-2"
                            type="button"
                          >
                            <Key size={16} className="text-foreground" />
                            <span>Forgot Password</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Register page: Full width button */}
                        <Button
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
                          variant="outline"
                          className="w-full h-12 flex items-center justify-center gap-2"
                        >
                          <ArrowLeft size={12} className="text-foreground" />
                          <span>Have an account?</span>
                        </Button>
                      </>
                    )}

                    {/* Language selector */}
                    <div className="pt-2 flex justify-center">
                      <Button variant="outline" size="sm" className="h-12 px-4 flex items-center gap-1">
                        <Globe size={12} className="text-muted-foreground" />
                        <span>EN</span>
                        <ChevronDown size={8} className="text-muted-foreground" />
                      </Button>
                    </div>

                    {/* Cancel button */}
                    <div className="pt-2 flex justify-center">
                      <Button
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
                        variant="outline"
                        size="sm"
                        className="h-12 px-4 flex items-center gap-1"
                      >
                        <X size={12} className="text-gray-500" />
                        <span>Cancel</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Welcome to Construction Van
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Please sign in or register to continue
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="px-8 py-3 text-lg font-semibold flex items-center space-x-2 mx-auto"
                >
                  <ArrowRight size={18} className="text-primary-foreground" />
                  <span>Get Started</span>
                </Button>
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
                <h3 className={`text-lg font-semibold ${errorMessage.includes('successful') ? 'text-green-600' : 'text-foreground'}`}>
                  {errorMessage.includes('successful') ? 'Success' : 'Message'}
                </h3>
                <Button
                  onClick={() => setShowErrorDialog(false)}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </Button>
              </div>
              <div className="flex items-center mb-4">
                {errorMessage.includes('successful') && (
                  <CheckCircle size={20} className="text-green-500 mr-3 flex-shrink-0" />
                )}
                <p className={`${errorMessage.includes('successful') ? 'text-green-700' : 'text-foreground'}`}>{errorMessage}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowErrorDialog(false)}
                  variant={errorMessage.includes('successful') ? 'default' : 'default'}
                  className={errorMessage.includes('successful') ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // If authenticated but workspace not loaded yet, show loading screen
          console.log('Auth check - isAuthenticated:', isAuthenticated, 'workspaceLoaded:', workspaceLoaded);
  if (!workspaceLoaded) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyles }} />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            {workspaceLoading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Loading Workspace...</h2>
                <p className="text-muted-foreground">Please wait while we load your data</p>
              </>
            ) : workspaceError ? (
              <>
                <div className="text-destructive mb-4">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load Workspace</h2>
                <p className="text-muted-foreground mb-4">{workspaceError}</p>
                <Button onClick={() => {
                  setWorkspaceError(null);
                  initializeWorkspace();
                }}>
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <div className="animate-pulse rounded-full h-12 w-12 bg-muted mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Initializing...</h2>
                <p className="text-muted-foreground">Setting up your workspace</p>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // Welcome page after authentication
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyles }} />
              <div className="h-screen flex flex-col bg-background">
      {/* Header Area */}
              <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
                        <span className="text-xl font-semibold text-foreground">
            Welcome, {username || 'User'}
          </span>
        </div>

        {/* Center - Empty space */}
        <div className="flex-1"></div>

        {/* Right side - Mode Toggle, Settings, Logout */}
        <div className="flex items-center space-x-4">
          
          {/* Mode Toggle */}
          <ModeToggle userId={userId} />
          
          {/* API Key Status Indicator */}
          <div className="relative">
            <Button 
              onClick={() => {
                setSelectedSettingCategory('security');
                setShowSettingsDropdown(true);
              }}
              variant={apiKeyLoading ? "secondary" : (hasStoredApiKey ? "default" : "outline")}
              disabled={apiKeyLoading}
              className={`flex items-center space-x-2 ${
                hasStoredApiKey 
                  ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30' 
                  : 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/30'
              }`}
              title={
                hasStoredApiKey 
                  ? `API Key is stored securely\nLast used: ${apiKeyStatus?.lastUsedAt ? new Date(apiKeyStatus.lastUsedAt).toLocaleDateString() : 'Never'}\nCreated: ${apiKeyStatus?.createdAt ? new Date(apiKeyStatus.createdAt).toLocaleDateString() : 'Unknown'}`
                  : 'API Key not stored - click to manage'
              }
            >
              <Key size={14} className="flex-shrink-0" />
              <span className="text-xs font-medium">
                {apiKeyLoading ? 'Checking...' : (hasStoredApiKey ? 'API Key ✓' : 'API Key ○')}
              </span>
            </Button>
          </div>
          
          <div className="relative">
            <Button 
              onClick={() => {
                setSelectedSettingCategory('general');
                setShowSettingsDropdown(true);
              }}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800" 
              title="Settings"
            >
              <Settings size={16} className="text-gray-600" />
            </Button>
            
            {/* Settings Modal */}
            <Dialog open={showSettingsDropdown} onOpenChange={setShowSettingsDropdown}>
              <DialogContent className="!w-[50vw] !max-w-none h-[600px] flex flex-col p-0">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 pt-6">
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                
                {/* Content Area */}
                <div className="flex flex-1 overflow-hidden rounded-b-lg">
                    {/* Left Sidebar - Categories */}
                    <div className="w-72 bg-muted border-r border-border p-4 rounded-bl-lg">
                      <div className="space-y-1">
                        {/* General */}
                        <Button
                          onClick={() => setSelectedSettingCategory('general')}
                          variant={selectedSettingCategory === 'general' ? 'secondary' : 'ghost'}
                          className={`w-full justify-start ${
                            selectedSettingCategory === 'general' 
                              ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Settings size={16} className={`mr-3 ${selectedSettingCategory === 'general' ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                          <span>General</span>
                        </Button>
                        
                        {/* Notifications */}
                        <Button
                          onClick={() => setSelectedSettingCategory('notifications')}
                          variant={selectedSettingCategory === 'notifications' ? 'secondary' : 'ghost'}
                          className={`w-full justify-start ${
                            selectedSettingCategory === 'notifications' 
                              ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Bell size={16} className={`mr-3 ${selectedSettingCategory === 'notifications' ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                          <span>Notifications</span>
                        </Button>
                        
                        {/* Personalization */}
                        <Button
                          onClick={() => setSelectedSettingCategory('personalization')}
                          variant={selectedSettingCategory === 'personalization' ? 'secondary' : 'ghost'}
                          className={`w-full justify-start ${
                            selectedSettingCategory === 'personalization' 
                              ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Palette size={16} className={`mr-3 ${selectedSettingCategory === 'personalization' ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                          <span>Personalization</span>
                        </Button>
                        
                        {/* Data Controls */}
                        <Button
                          onClick={() => setSelectedSettingCategory('data')}
                          variant={selectedSettingCategory === 'data' ? 'secondary' : 'ghost'}
                          className={`w-full justify-start ${
                            selectedSettingCategory === 'data' 
                              ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Database size={16} className={`mr-3 ${selectedSettingCategory === 'data' ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                          <span>Data Controls</span>
                        </Button>
                        
                        {/* Security */}
                        <Button
                          onClick={() => setSelectedSettingCategory('security')}
                          variant={selectedSettingCategory === 'security' ? 'secondary' : 'ghost'}
                          className={`w-full justify-start ${
                            selectedSettingCategory === 'security' 
                              ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Shield size={16} className={`mr-3 ${selectedSettingCategory === 'security' ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                          <span>Security</span>
                        </Button>
                        
                        {/* Account */}
                        <Button
                          onClick={() => setSelectedSettingCategory('account')}
                          variant={selectedSettingCategory === 'account' ? 'secondary' : 'ghost'}
                          className={`w-full justify-start ${
                            selectedSettingCategory === 'account' 
                              ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <User size={16} className={`mr-3 ${selectedSettingCategory === 'account' ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                          <span>Account</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Right Content Area */}
                    <div className="flex-1 p-8 overflow-y-auto bg-background min-w-0 rounded-br-lg">
                      {selectedSettingCategory === 'general' && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-8">General</h4>
                          <div className="space-y-8">
                            {/* Theme */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground">Theme</span>
                              </div>
                              <Select 
                                value={settingsTheme} 
                                onValueChange={(value) => {
                                  setSettingsTheme(value);
                                  setTheme(value);
                                }}
                              >
                                <SelectTrigger className="w-[180px] flex-shrink-0">
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="light">Light</SelectItem>
                                  <SelectItem value="dark">Dark</SelectItem>
                                  <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            

                          </div>
                        </div>
                      )}
                      
                      {selectedSettingCategory === 'security' && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-8">Security</h4>
                          <div className="space-y-8">
                            {/* Success/Error Messages */}
                            {apiKeySuccess && (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <div className="flex items-center">
                                  <CheckCircle size={16} className="text-green-500 mr-2" />
                                  <span className="text-sm text-green-800">{apiKeySuccess}</span>
                                </div>
                              </div>
                            )}
                            {apiKeyError && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <div className="flex items-center">
                                  <X size={16} className="text-red-500 mr-2" />
                                  <span className="text-sm text-red-800">{apiKeyError}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* API Key Management */}
                            <div className="bg-muted rounded-lg p-6 border border-border">
                              <h5 className="text-sm font-semibold text-foreground mb-6">API Key Management</h5>
                              <p className="text-xs text-muted-foreground mb-6 max-w-4xl">
                                Your API key enables access to seismic data services and is stored securely on your device.
                              </p>
                              
                              {/* Status */}
                              <div className="flex items-center justify-between gap-4 mb-4">
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-foreground">Status</span>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Current state of your API key storage and authentication
                                  </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  hasStoredApiKey 
                    ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                                  {hasStoredApiKey ? '✓ Stored' : '○ Not stored'}
                                </span>
                              </div>
                              
                              {/* Details */}
                              {hasStoredApiKey && apiKeyStatus && (
                                <div className="bg-background/50 rounded-md p-4 mb-6">
                                  <h6 className="text-xs font-medium text-foreground mb-3">Key Information</h6>
                                  <div className="text-xs text-muted-foreground space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="min-w-0 flex-1">Last used:</span>
                                      <span className="font-medium ml-4">{apiKeyStatus.lastUsedAt ? new Date(apiKeyStatus.lastUsedAt).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="min-w-0 flex-1">Created:</span>
                                      <span className="font-medium ml-4">{apiKeyStatus.createdAt ? new Date(apiKeyStatus.createdAt).toLocaleDateString() : 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="min-w-0 flex-1">Storage:</span>
                                      <span className="font-medium text-green-600 dark:text-green-400 ml-4">Encrypted on device</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                                                            {/* Action Button */}
                              {hasStoredApiKey ? (
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground">API Key</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Your API key is securely stored and used automatically for data requests.
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={() => {
                                      setShowDeleteApiKeyModal(true);
                                      setShowSettingsDropdown(false);
                                    }}
                                    variant="destructive"
                                    size="sm"
                                    className="flex-shrink-0"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground text-center py-2">
                                  No API key stored
                                </div>
                              )}
                            </div>
                            
                            {/* Data Encryption */}
                            <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                              <h5 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-6">Data Encryption</h5>
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  All your workspace data is automatically encrypted and secure with industry-standard encryption.
                                </p>
                                <span className="px-3 py-1 text-sm bg-green-600 text-white rounded-md flex-shrink-0">
                                  ✓ Active
                                </span>
                              </div>
                            </div>
                            
                            {/* Password Management */}
                            <div className="bg-muted rounded-lg p-6 border border-border">
                              <h5 className="text-sm font-semibold text-foreground mb-6">Password Management</h5>
                              <p className="text-xs text-muted-foreground mb-6 max-w-4xl">
                                Manage your account password and security settings.
                              </p>
                              
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground">Password</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Your password secures your account and data.
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" className="flex-shrink-0">
                                  Change
                                </Button>
                              </div>
                            </div>
                            

                          </div>
                        </div>
                      )}
                      
                      {/* Account Settings */}
                      {selectedSettingCategory === 'account' && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-8">Account</h4>
                          <div className="space-y-8">
                                                          {/* User ID Display and Edit */}
                              <div className="bg-primary/10 rounded-lg p-6 border border-primary/20">
                                <h5 className="text-sm font-semibold text-primary mb-6">User Information</h5>
                                <p className="text-xs text-primary/70 mb-6 max-w-4xl">
                                  Manage your account information and authentication status.
                                </p>
                                
                                <div className="space-y-4">
                                
                                {/* Username (Editable) */}
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-primary">Username</span>
                                    <p className="text-xs text-primary/70 mt-1">
                                      Your display name used throughout the application
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-foreground">{username || 'Not set'}</span>
                                    {isAuthenticated && (
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setNewUsername(username || '');
                                          setUsernameDialogError('');
                                          setShowUsernameDialog(true);
                                        }}
                                        size="sm"
                                        title="Change Username"
                                      >
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Authentication Status */}
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-primary">Authentication Status</span>
                                    <p className="text-xs text-primary/70 mt-1">
                                      Current state of your account authentication and session
                                    </p>
                                  </div>
                                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isAuthenticated 
                    ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                }`}>
                                    {isAuthenticated ? '✓ Authenticated' : '○ Not authenticated'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            

                            

                          </div>
                        </div>
                      )}
                      
                      {/* Placeholder content for other categories */}
                      {selectedSettingCategory !== 'general' && selectedSettingCategory !== 'security' && selectedSettingCategory !== 'account' && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-6 capitalize">{selectedSettingCategory}</h4>
                          <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-muted-foreground">Settings for {selectedSettingCategory} will be implemented soon.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              </DialogContent>
            </Dialog>
          </div>
          <Button 
            onClick={logout}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-800"
            title="Logout"
          >
            <LogIn size={16} className="text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Task Area */}
      <div className="flex-1 flex">
        {/* Project Sidebar */}
        <div 
          ref={sidebarRef}
          className={`bg-card transition-all duration-300 relative flex-shrink-0 ${sidebarCollapsed ? 'w-12' : ''}`}
          style={{ width: sidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
        >
                      <div className="p-4 border-b border-border flex items-center justify-between">
                            {!sidebarCollapsed && <span className="font-semibold text-foreground">Projects</span>}
            <div className="flex items-center space-x-2">
              {!sidebarCollapsed && (
                <Button
                  onClick={addProject}
                  variant="ghost"
                  size="sm"
                  className="p-1 hover:bg-accent bg-accent/50"
                  title="New Project"
                >
                  <Plus size={14} className="text-primary" />
                </Button>
              )}
              <Button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-accent bg-muted"
                title={sidebarCollapsed ? "Expand" : "Collapse"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight size={14} className="text-gray-600" />
                ) : (
                  <ChevronLeft size={14} className="text-gray-600" />
                )}
              </Button>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="p-2">
              {projects.map(project => (
                <div key={project.id} className="mb-2">
                  <div
                    className={`flex items-center justify-between p-2 rounded cursor-pointer group ${
                      selectedPage.projectId === project.id 
                        ? 'bg-accent border border-border' 
                        : 'hover:bg-accent/50'
                    } ${
                      isDraggingProject && draggedProject === project.id ? 'opacity-50' : ''
                    } ${
                      dragOverProject === project.id ? 'border-l-2 border-l-primary bg-accent' : ''
                    }`}
                    style={{ 
                      cursor: isDraggingProject ? 'grabbing' : 'grab'
                    }}
                    onClick={() => {
                      if (!isDraggingProject) {
                        // Only select the project, don't toggle expansion
                        selectProject(project.id);
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
                      <GripVertical size={12} className="text-gray-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      {project.pages && project.pages.length > 0 && (
                        <ChevronRight 
                          size={12} 
                          className={`text-muted-foreground mr-2 transition-transform ${(project.isExpanded || project.expanded) ? 'rotate-90' : ''} flex-shrink-0 cursor-pointer hover:text-foreground`} 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectExpansion(project.id);
                          }}
                        />
                      )}
                      <Folder size={14} className="text-primary mr-2 flex-shrink-0" />
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
                          className="text-sm text-foreground bg-background border border-input rounded px-1 py-0.5 focus:outline-none focus:border-ring flex-1 min-w-0"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <span 
                            className={`text-sm block w-full ${
                              selectedPage.projectId === project.id 
                                ? 'text-primary font-semibold' 
                                : 'text-muted-foreground'
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
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        addPage(project.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="p-1 opacity-0 group-hover:opacity-100 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30"
                      title="Add Page"
                    >
                      <Plus size={12} className="text-green-600 dark:text-green-400" />
                    </Button>
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
                            } ${
                              isDraggingTabToPage && draggedTab && dragOverPage?.projectId === project.id && dragOverPage?.pageId === page.id ? 'border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
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
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (draggedPage && (draggedPage.projectId !== project.id || draggedPage.pageId !== page.id)) {
                                setDragOverPage({ projectId: project.id, pageId: page.id });
                              }
                              // Handle tab-to-page drag over
                              if (isDraggingTabToPage && draggedTab) {
                                setDragOverPage({ projectId: project.id, pageId: page.id });
                              }
                            }}
                            onDragLeave={handlePageDragLeave}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // Handle tab-to-page drop
                              if (isDraggingTabToPage && draggedTab) {
                                const dragData = e.dataTransfer.getData('application/json');
                                if (dragData) {
                                  try {
                                    const { sourceProjectId, sourcePageId } = JSON.parse(dragData);
                                    
                                    // Only allow dropping if it's a different page
                                    if (sourceProjectId !== project.id || sourcePageId !== page.id) {
                                      moveTabToPage(draggedTab, sourceProjectId, sourcePageId, project.id, page.id);
                                    }
                                  } catch (error) {
                                    console.error('Error moving tab to page:', error);
                                    showToastNotification('Failed to move tab: ' + error.message, 'error');
                                  }
                                }
                                // Reset all drag states
                                setIsDraggingTabToPage(false);
                                setDraggedTab(null);
                                setDragOverPage(null);
                                setIsDragging(false);
                                return;
                              }
                              
                              // Handle page drop
                              handlePageDrop(e, project.id, page.id);
                            }}
                            onDragEnd={handlePageDragEnd}
                          >
                            <GripVertical size={10} className="text-gray-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            <FileText size={12} className="text-gray-400 mr-2 flex-shrink-0" />
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
                                className="text-xs text-foreground bg-background border border-input rounded px-1 py-0.5 focus:outline-none focus:border-ring flex-1 min-w-0"
                                autoFocus
                              />
                            ) : (
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <span 
                                  className={`text-xs block w-full ${
                                    selectedPage.projectId === project.id && selectedPage.pageId === page.id 
                                      ? 'text-green-600 dark:text-green-400 font-semibold' 
                                      : 'text-muted-foreground'
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
                            // Handle tab-to-page drag over
                            if (isDraggingTabToPage && draggedTab) {
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
                            // Handle tab-to-page drop
                            if (isDraggingTabToPage && draggedTab) {
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

        {/* Vertical Separator */}
        <Separator orientation="vertical" className="min-h-screen" />

        {/* Information Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab Bar */}
          <div className="bg-card border-b border-border flex items-center">
            {/* Left scroll arrow - Fixed on left side */}
            {showLeftArrow && (
              <Button
                onClick={scrollTabsLeft}
                variant="ghost"
                size="sm"
                className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent flex-shrink-0 bg-card"
                title="Scroll Left"
              >
                <ChevronLeft size={16} />
              </Button>
            )}
            
            {/* Scrollable tabs container */}
            <div className="flex-1 relative overflow-hidden min-w-0" style={{ maxWidth: 'calc(100vw - 400px)' }}>
              <div
                ref={tabContainerRef}
                className="flex items-center bg-card overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={handleTabScroll}
              >
                {(() => {
                  const currentProject = projects.find(p => p.id === selectedPage.projectId);
                  const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                  const currentTabs = currentPage?.tabs || [];
                  

                  
                  return currentTabs.map((tab, index) => (
                    <React.Fragment key={tab.id}>
                      {index > 0 && <Separator orientation="vertical" className="h-8" />}
                      <div
                        className={`flex items-center px-4 py-2 cursor-pointer group ${
                          (tab.isActive || tab.active) ? 'bg-accent border-b-2 border-primary' : 'hover:bg-accent/50'
                        } ${
                          isDragging && draggedTab === tab.id ? 'opacity-50' : ''
                        } ${
                          dragOverTab === tab.id ? 'border-l-2 border-l-primary bg-accent' : ''
                        } ${
                          tab.locked ? 'bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-l-yellow-400 dark:border-l-yellow-500' : ''
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
                            className="text-sm text-foreground bg-background border border-input rounded px-1 py-0.5 focus:outline-none focus:border-ring flex-1 min-w-0"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <span 
                              className={`text-sm block w-full flex items-center ${
                                (tab.isActive || tab.active) 
                                  ? 'text-primary font-semibold' 
                                  : 'text-muted-foreground'
                              }`}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                WebkitMaskImage: 'linear-gradient(to right, black 0%, black 85%, transparent 100%)',
                                maskImage: 'linear-gradient(to right, black 0%, black 85%, transparent 100%)'
                              }}
                              title={tab.name}
                            >
                              {tab.name}
                            </span>
                          </div>
                        )}
                      </div>
                      {currentTabs.length > 1 && !tab.locked && (
                        <Button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await closeTab(tab.id);
                          }}
                          variant="ghost"
                          size="sm"
                          className="ml-2 p-1 opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 flex-shrink-0"
                          title="Close Tab"
                        >
                          <X size={10} className="text-red-600 dark:text-red-400" />
                        </Button>
                      )}
                      {tab.locked && (
                        <div className="ml-2 p-1 flex-shrink-0" title="Tab is locked">
                          <Lock size={10} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                      )}
                    </div>
                    </React.Fragment>
                  ));
                })()}
              </div>
            </div>
            
            {/* Right scroll arrow - Fixed on right side */}
            {showRightArrow && (
              <Button
                onClick={scrollTabsRight}
                variant="ghost"
                size="sm"
                className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent flex-shrink-0 bg-card"
                title="Scroll Right"
              >
                <ChevronRight size={16} />
              </Button>
            )}
            
            {/* Fixed right side controls - positioned at far right edge */}
            <div className="flex items-center flex-shrink-0 bg-card ml-auto">
              {/* Tab Dropdown button */}
              <div className="relative">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    debugSetShowTabDropdown(!showTabDropdown);
                  }}
                  variant="ghost"
                  size="sm"
                  className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Tab Menu"
                >
                  <ChevronDown size={16} />
                </Button>
                
                {/* Dropdown Menu - Right-aligned to dropdown button */}
                {showTabDropdown && (
                  <div 
                    ref={tabDropdownRef}
                    className="absolute top-full mt-1 bg-background border border-border rounded-md shadow-lg z-50"
                    style={{ 
                      right: '0',
                      transform: 'translateX(0)',
                      width: '280px'
                    }}
                  >
                    <div className="py-1 bg-background">
                      <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                        Current tabs
                      </div>
                      {(() => {
                        const currentProject = projects.find(p => p.id === selectedPage.projectId);
                        const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                        const currentTabs = currentPage?.tabs || [];
                        
                        return currentTabs.map(tab => (
                          <div
                            key={tab.id}
                            className={`flex items-center justify-between px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${
                              isDropdownDragging && dropdownDraggedTab === tab.id ? 'opacity-50' : ''
                            } ${
                              dropdownDragOverTab === tab.id ? 'border-l-2 border-l-primary bg-primary/10' : ''
                            }`}
                            style={{ 
                              cursor: isDropdownDragging ? 'grabbing' : 'grab'
                            }}
                            onClick={async () => {
                              if (!isDropdownDragging) {
                                await selectTab(tab.id);
                                console.log('🚫 Tab click: Closing tab dropdown after selecting tab:', tab.id);
                                debugSetShowTabDropdown(false);
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
                              <GripVertical size={12} className="text-muted-foreground mr-2 flex-shrink-0" />
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
                                  className="text-sm text-foreground bg-background border border-input rounded px-1 py-0.5 focus:outline-none focus:border-ring flex-1 min-w-0"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <span 
                                    className="text-sm text-foreground block w-full flex items-center"
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
                              <Button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await closeTab(tab.id);
                                  // Keep dropdown open for consecutive deletions
                                }}
                                disabled={deletingTabs.has(tab.id)}
                                variant="ghost"
                                size="sm"
                                className={`ml-2 p-1 hover:bg-destructive/10 hover:text-destructive ${deletingTabs.has(tab.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={deletingTabs.has(tab.id) ? "Deleting..." : "Close Tab"}
                              >
                                <X size={10} className="text-gray-500" />
                              </Button>
                            )}
                            {tab.locked && (
                              <div className="ml-2 p-1 flex-shrink-0" title="Tab is locked">
                                <Lock size={10} className="text-yellow-600" />
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
              <Button
                onClick={addTab}
                variant="ghost"
                size="sm"
                className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent bg-muted"
                title="Add Tab"
              >
                <Plus size={16} />
              </Button>
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
                      <Key size={64} className="mx-auto mb-4 text-gray-400" />
                                      <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
                <p className="text-muted-foreground">Create your first project and its page to start</p>
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
                      <FileText size={64} className="mx-auto mb-4 text-gray-400" />
                                      <h3 className="text-lg font-semibold text-foreground mb-2">No pages yet</h3>
                <p className="text-muted-foreground">Add a page to your project to create tabs</p>
                    </div>
                  </div>
                );
              }
              
              // Have pages but no page is selected
              if (!currentPage) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText size={64} className="mx-auto mb-4 text-gray-400" />
                                      <h3 className="text-lg font-semibold text-foreground mb-2">Select a page</h3>
                <p className="text-muted-foreground">Choose a page from the sidebar to manage tabs</p>
                    </div>
                  </div>
                );
              }
              
              // Have projects and pages, show tab content
              const activeTabForDisplay = findActiveTabOrWelcome(currentPage?.tabs);
              
              return (
                                  <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                  <FileText size={16} className="text-gray-600" />
                  <span>{activeTabForDisplay?.name || 'Welcome'}</span>
                </h2>
                <Select 
                  value={currentTabType}
                  onValueChange={(value) => {
                    // Only handle change if there's an active tab and a valid selection (not empty string)
                    if (activeTabForDisplay && value && value !== '') {
                      handleTabTypeChange(activeTabForDisplay.id, value);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select tab type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Design Tables">Design Tables</SelectItem>
                    <SelectItem value="Snow Load">Snow Load</SelectItem>
                    <SelectItem value="Wind Load">Wind Load</SelectItem>
                    <SelectItem value="Seismic Hazards">Seismic Hazards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
                              <div className="text-muted-foreground">
                {(() => {
                  // Only create Welcome tab if NO tabs exist at all (not just no active tab)
                  if (currentPage && (!currentPage.tabs || currentPage.tabs.length === 0)) {
                    console.log('No tabs found, creating Welcome tab for page:', currentPage.id);
                    createWelcomeTabIfNeeded(currentPage.id);
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-muted-foreground">Creating Welcome tab...</p>
                        </div>
                      </div>
                    );
                  }

                  // If tabs exist but no active tab, this should be handled by findActiveTabOrWelcome
                  if (!activeTabForDisplay) {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-muted-foreground">Loading tab content...</p>
                        </div>
                      </div>
                    );
                  }
                  
                  if (activeTabForDisplay?.type === 'snow_load' || activeTabForDisplay?.tabType === 'snow_load') {
                    const tabKey = `${selectedPage.projectId}_${selectedPage.pageId}_${activeTabForDisplay.id}`;
                    const snowDefaults = {
                      location: 'North Vancouver',
                      slope: 1,
                      is: 1,
                      ca: 1,
                      cb: 0.8
                    };
                    // Use merged data from database + template, fallback to local state for immediate updates
                    const mergedSnowDefaults = activeTabForDisplay.mergedData?.snowDefaults || {};
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
                        
                                                  if (encryptionEnabled && userPassword) {
                            // Use encrypted save operation with stored password
                            await workspaceStateService.updateTabDataEncrypted(activeTabForDisplay.id, 'snow_load', deltaData, userPassword);
                          } else {
                            // Use regular save operation
                            await workspaceStateService.updateTabData(activeTabForDisplay.id, 'snow_load', deltaData);
                          }
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
                    const mergedDriftDefaults = activeTabForDisplay.mergedData?.driftDefaults || {};
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
                                                  await workspaceStateService.updateTabData(activeTabForDisplay.id, 'snow_load', deltaData);
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
                        <div className="max-w-4xl mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-400 mb-4">Snow Load Calculator 1.0 (ULS)</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Input Area */}
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">Input Area</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Location</label>
                                <Select 
                                  value={data.location}
                                  onValueChange={(value) => handleSnowChange('location', value)}
                                >
                                  <SelectTrigger className="col-span-2 h-8">
                                    <SelectValue placeholder="Select location..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {snowLoadData.map(item => (
                                      <SelectItem key={item.city} value={item.city}>{item.city}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Slope</label>
                                <NumberInput
                                  value={data.slope}
                                  onValueChange={(value) => handleSnowChange('slope', value)}
                                  min={0}
                                  max={90}
                                  step={1}
                                  precision={0}
                                  className="w-full"
                                />
                                <span className="text-sm">: 12</span>
                              </div>

                              <div>
                                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">Default Inputs</h4>
                              </div>

                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Is</label>
                                <NumberInput
                                  value={data.is}
                                  onValueChange={(value) => handleSnowChange('is', value)}
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  precision={1}
                                  className="w-full"
                                />
                                <span className="text-xs text-muted-foreground">normal=1; SLS → 0.9</span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Ca</label>
                                <NumberInput
                                  value={data.ca}
                                  onValueChange={(value) => handleSnowChange('ca', value)}
                                  min={0}
                                  max={3}
                                  step={0.1}
                                  precision={1}
                                  className="w-full"
                                />
                                <span className="text-xs text-muted-foreground">Ca = 1 for simple cases; complicated when consider particular situations</span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Cb</label>
                                <NumberInput
                                  value={data.cb}
                                  onValueChange={(value) => handleSnowChange('cb', value)}
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  precision={1}
                                  className="w-full"
                                />
                                <span className="text-xs text-muted-foreground">(1) Cb=0.8 if smaller dimension of roof w≤35m (115'); (2) Cb=1.0 if roof height ≤ Limit. Height ≈ 2m (6.5'); (3) Otherwise, refer to the Code.</span>
                              </div>
                              

                            </div>
                            
                            {snowLoadError && (
                              <div className="mt-3 text-red-600 text-sm">{snowLoadError}</div>
                            )}
                          </div>

                          {/* Calculation Area */}
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">Calculation Area</h4>
                            <div className="space-y-0 text-muted-foreground">
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium text-muted-foreground">Parameter</span>
                                <span className="font-medium text-muted-foreground">Value</span>
                                <span className="font-medium text-muted-foreground">Description</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Ss</span>
                                <span className="font-mono">{ss.toFixed(2)}</span>
                                <span className="text-xs">1-in-50-year ground snow load</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Sr</span>
                                <span className="font-mono">{sr.toFixed(2)}</span>
                                <span className="text-xs">1-in-50-year associated rain load</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">α</span>
                                <span className="font-mono">{alpha.toFixed(2)}</span>
                                <span className="text-xs">°</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">γ</span>
                                <span className="font-mono">{gamma.toFixed(2)}</span>
                                <span className="text-xs">γ=min.&#123;4.0 kN/m³, 0.43Ss+2.2 kN/m³&#125;</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Limit. Height</span>
                                <span className="font-mono">{limitHeight.toFixed(2)}</span>
                                <span className="text-xs">= 1 + Ss/γ (m); if a mean height of roof is less than 1 + Ss/γ → Cb=1.</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Cw</span>
                                <span className="font-mono">{Number(driftData.Cw).toFixed(2)}</span>
                                <span className="text-xs">Conservative</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Cs</span>
                                <span className="font-mono">{cs.toFixed(2)}</span>
                                <span className="text-xs">Cs=1.0 where α≤30°; (70°-α)/40° where 30°&lt;α≤70°; 0 where α&gt;70°</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <span className="font-medium">Ss(CbCwCsCa)</span>
                                <span className="font-mono">{ssCombined.toFixed(2)}</span>
                                <span></span>
                              </div>
                            </div>
                          </div>
                        </div>

                                                {/* Results */}
                        <Card className="mt-6">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-orange-600 dark:text-orange-400">Results</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-left font-medium text-muted-foreground">Name</div>
                              <div className="text-center font-medium text-muted-foreground">Value</div>
                              <div className="text-center font-medium text-muted-foreground">Unit</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-left font-medium">Snow loads</div>
                              <div className="text-center font-mono">{snowLoad.toFixed(2)}</div>
                              <div className="text-center">kPa</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-left"></div>
                              <div className="text-center font-mono text-red-600 dark:text-red-400">{snowLoadPsf.toFixed(1)}</div>
                              <div className="text-center text-red-600 dark:text-red-400">psf</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-left font-medium">Snow loads (Part 9)</div>
                              <div className="text-center font-mono">{snowLoadPart9.toFixed(2)}</div>
                              <div className="text-center">kPa</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-left"></div>
                              <div className="text-center font-mono text-red-600 dark:text-red-400">{snowLoadPart9Psf.toFixed(1)}</div>
                              <div className="text-center text-red-600 dark:text-red-400">psf</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Snow Drifting Load Calculator (Multi-level Roofs) 1.0 */}
                      <div className="mt-8 max-w-6xl mx-auto bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                        <h3 className="text-xl font-bold text-purple-800 dark:text-purple-400 mb-4">Snow Drifting Load Calculator (Multi-level Roofs) 1.0</h3>
                        
                        <div className="grid grid-cols-1 gap-6">
                                                      {/* Part 1: Inputs */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                            <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-3">Part 1: Inputs</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-3">
                                <h5 className="font-medium text-purple-600 dark:text-purple-400">General Input</h5>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">a (m)</label>
                                  <NumberInput
                                    value={driftData.a}
                                    onValueChange={(value) => handleDriftChange('a', value)}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Horizontal gap between upper and lower roofs</span>
                                </div>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">h (m)</label>
                                  <NumberInput
                                    value={driftData.h}
                                    onValueChange={(value) => handleDriftChange('h', value)}
                                    min={0}
                                    max={50}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Difference in elevation between lower roof surface and top of the parapet of the upper roof</span>
                                </div>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">hp_lower (m)</label>
                                  <NumberInput
                                    value={driftData.hp_lower}
                                    onValueChange={(value) => handleDriftChange('hp_lower', value)}
                                    min={0}
                                    max={20}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">parapet height of lower-roof source area</span>
                                </div>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">x (m)</label>
                                  <NumberInput
                                    value={driftData.x}
                                    onValueChange={(value) => handleDriftChange('x', value)}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Optional: Point of interest</span>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <h5 className="font-medium text-purple-600 dark:text-purple-400">Case 1 Input</h5>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">ws_upper (m)</label>
                                  <NumberInput
                                    value={driftData.ws_upper}
                                    onValueChange={(value) => handleDriftChange('ws_upper', value)}
                                    min={0}
                                    max={200}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Shorter dimension of (upper roof) source area in Case 1</span>
                                </div>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">ls_upper (m)</label>
                                  <NumberInput
                                    value={driftData.ls_upper}
                                    onValueChange={(value) => handleDriftChange('ls_upper', value)}
                                    min={0}
                                    max={300}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Longer dimension of (upper roof) source area in Case 1</span>
                                </div>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">hp_upper (m)</label>
                                  <NumberInput
                                    value={driftData.hp_upper}
                                    onValueChange={(value) => handleDriftChange('hp_upper', value)}
                                    min={0}
                                    max={20}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">parapet height of upper-roof source area in Case 1</span>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <h5 className="font-medium text-purple-600 dark:text-purple-400">Case 2 & 3 Input</h5>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">ws_lower2 (m)</label>
                                  <NumberInput
                                    value={driftData.ws_lower2}
                                    onValueChange={(value) => handleDriftChange('ws_lower2', value)}
                                    min={0}
                                    max={200}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Shorter dimension of (lower roof) source area in Case 2</span>
                                </div>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">ls_lower2 (m)</label>
                                  <NumberInput
                                    value={driftData.ls_lower2}
                                    onValueChange={(value) => handleDriftChange('ls_lower2', value)}
                                    min={0}
                                    max={300}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Longer dimension of (lower roof) source area in Case 2</span>
                                </div>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">ws_lower3 (m)</label>
                                  <NumberInput
                                    value={driftData.ws_lower3}
                                    onValueChange={(value) => handleDriftChange('ws_lower3', value)}
                                    min={0}
                                    max={200}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Shorter dimension of (lower roof) source area in Case 3</span>
                                </div>
                                <div className="grid grid-cols-[100px_120px_1fr] gap-3 items-center">
                                  <label className="text-sm font-medium">ls_lower3 (m)</label>
                                  <NumberInput
                                    value={driftData.ls_lower3}
                                    onValueChange={(value) => handleDriftChange('ls_lower3', value)}
                                    min={0}
                                    max={300}
                                    step={0.1}
                                    precision={1}
                                    className="w-full"
                                  />
                                  <span className="text-xs text-muted-foreground">Longer dimension of (lower roof) source area in Case 3</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Part 2-4: Unified Snow Drifting Load Results */}
                          <Card className="p-4">
                            <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-3">Part 2-4: Snow Drifting Load Results</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-sm font-medium">Parameter</TableHead>
                                  <TableHead className="text-sm font-medium">Case I</TableHead>
                                  <TableHead className="text-sm font-medium">Case II</TableHead>
                                  <TableHead className="text-sm font-medium">Case III</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">β</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.β.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.β.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.β.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">Ics</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.Ics.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.Ics.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.Ics.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">Cw</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.Cw.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.Cw.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.Cw.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">hp'</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.hp_prime.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.hp_prime.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.hp_prime.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">Cs</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.Cs.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.Cs.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.Cs.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">F</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.F.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.F.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.F.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">Ca0_1</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.Ca0_1.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.Ca0_1.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.Ca0_1.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">Ca0_2</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.Ca0_2.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.Ca0_2.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.Ca0_2.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">Ca0</TableCell>
                                  <TableCell className="text-sm font-mono">{typeof caseI.Ca0_I === 'string' ? caseI.Ca0_I : caseI.Ca0_I.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{typeof caseII.Ca0_II === 'string' ? caseII.Ca0_II : caseII.Ca0_II.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{typeof caseIII.Ca0_III === 'string' ? caseIII.Ca0_III : caseIII.Ca0_III.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="text-sm font-medium">xd (m)</TableCell>
                                  <TableCell className="text-sm font-mono">{caseI.xd_I.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseII.xd_II.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm font-mono">{caseIII.xd_III.toFixed(2)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                            
                            {/* Snow Load Distribution Table */}
                            <div className="mt-6">
                              <h5 className="font-semibold text-purple-700 dark:text-purple-400 mb-3">Snow Load Distribution</h5>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-sm font-medium">Case I Location x (ft)</TableHead>
                                    <TableHead className="text-sm font-medium">Case I S (psf)</TableHead>
                                    <TableHead className="text-sm font-medium">Case II Location x (ft)</TableHead>
                                    <TableHead className="text-sm font-medium">Case II S (psf)</TableHead>
                                    <TableHead className="text-sm font-medium">Case III Location x (ft)</TableHead>
                                    <TableHead className="text-sm font-medium">Case III S (psf)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="text-sm font-mono">0.00</TableCell>
                                    <TableCell className="text-sm font-mono text-red-600 dark:text-red-400">
                                      {typeof caseI.Ca0_I === 'number' ? (driftData.Is * (driftData.Ss * driftData.Cb * driftData.Cw * driftData.Cs_default * caseI.Ca0_I + driftData.Sr) * 20.88543).toFixed(1) : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">0.00</TableCell>
                                    <TableCell className="text-sm font-mono text-red-600 dark:text-red-400">
                                      {typeof caseII.Ca0_II === 'number' ? (driftData.Is * (driftData.Ss * driftData.Cb * driftData.Cw * driftData.Cs_default * caseII.Ca0_II + driftData.Sr) * 20.88543).toFixed(1) : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">0.00</TableCell>
                                    <TableCell className="text-sm font-mono text-red-600 dark:text-red-400">
                                      {typeof caseIII.Ca0_III === 'number' ? (driftData.Is * (driftData.Ss * driftData.Cb * driftData.Cw * driftData.Cs_default * caseIII.Ca0_III + driftData.Sr) * 20.88543).toFixed(1) : 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="text-sm font-mono">{(caseI.xd_I * 3.28).toFixed(2)}</TableCell>
                                    <TableCell className="text-sm font-mono">
                                      {(driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">{(caseII.xd_II * 3.28).toFixed(2)}</TableCell>
                                    <TableCell className="text-sm font-mono">
                                      {(driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">{(caseIII.xd_III * 3.28).toFixed(2)}</TableCell>
                                    <TableCell className="text-sm font-mono">
                                      {(driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="text-sm font-mono">{(driftData.x * 3.28).toFixed(2)}</TableCell>
                                    <TableCell className="text-sm font-mono text-red-600 dark:text-red-400">
                                      {typeof caseI.Ca0_I === 'number' && (driftData.x * 3.28) <= (caseI.xd_I * 3.28) ? 
                                        ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseI.Ca0_I + driftData.Sr) * 20.88543) - 
                                         ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseI.Ca0_I + driftData.Sr) * 20.88543) - 
                                          (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543)) * 
                                         (driftData.x * 3.28) / (caseI.xd_I * 3.28)).toFixed(1) : 
                                        (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">{(driftData.x * 3.28).toFixed(2)}</TableCell>
                                    <TableCell className="text-sm font-mono text-red-600 dark:text-red-400">
                                      {typeof caseII.Ca0_II === 'number' && (driftData.x * 3.28) <= (caseII.xd_II * 3.28) ? 
                                        ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseII.Ca0_II + driftData.Sr) * 20.88543) - 
                                         ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseII.Ca0_II + driftData.Sr) * 20.88543) - 
                                          (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543)) * 
                                         (driftData.x * 3.28) / (caseII.xd_II * 3.28)).toFixed(1) : 
                                        (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">{(driftData.x * 3.28).toFixed(2)}</TableCell>
                                    <TableCell className="text-sm font-mono text-red-600 dark:text-red-400">
                                      {typeof caseIII.Ca0_III === 'number' && (driftData.x * 3.28) <= (caseIII.xd_III * 3.28) ? 
                                        ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseIII.Ca0_III + driftData.Sr) * 20.88543) - 
                                         ((driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * caseIII.Ca0_III + driftData.Sr) * 20.88543) - 
                                          (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543)) * 
                                         (driftData.x * 3.28) / (caseIII.xd_III * 3.28)).toFixed(1) : 
                                        (driftData.Is * (driftData.Ss_for_distribution * driftData.Cb * driftData.Cw * driftData.Cs_default * 1 + driftData.Sr) * 20.88543).toFixed(1)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </Card>
                        </div>
                      </div>
                      </>
                    );
                  }
                  
                  if (activeTabForDisplay?.type === 'wind_load' || activeTabForDisplay?.tabType === 'wind_load') {
                    const tabKey = `${selectedPage.projectId}_${selectedPage.pageId}_${activeTabForDisplay.id}`;
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
                    const mergedWindDefaults = activeTabForDisplay.mergedData?.windDefaults || {};
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
                        
                                                  if (encryptionEnabled && userPassword) {
                            // Use encrypted save operation with stored password
                            await workspaceStateService.updateTabDataEncrypted(activeTabForDisplay.id, 'wind_load', deltaData, userPassword);
                          } else {
                            // Use regular save operation
                            await workspaceStateService.updateTabData(activeTabForDisplay.id, 'wind_load', deltaData);
                          }
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
                      <div className="max-w-6xl mx-auto bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                                                  <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">Wind Load Calculator 1.0</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                      {/* Input Area: Location only */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">Input Area</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Location</label>
                                <Select 
                                  value={data.location}
                                  onValueChange={(value) => handleWindChange('location', value)}
                                >
                                  <SelectTrigger className="col-span-2 h-8">
                                    <SelectValue placeholder="Select location..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {windLoadData.map(item => (
                                      <SelectItem key={item.city} value={item.city}>{item.city}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                                                      {/* Default Inputs */}
                            <div className="bg-card rounded-lg p-4 border border-border">
                            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">Default Inputs</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Iw</label>
                                <NumberInput
                                  value={data.iw}
                                  onValueChange={(value) => handleWindChange('iw', value)}
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  precision={1}
                                  className="w-full"
                                />
                                <span className="text-xs text-muted-foreground">Importance Factor: normal(ULS)=1; SLS=0.8</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Ce</label>
                                <NumberInput
                                  value={data.ce}
                                  onValueChange={(value) => handleWindChange('ce', value)}
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  precision={1}
                                  className="w-full"
                                />
                                <span className="text-xs text-muted-foreground">Exposure factor: (1) Ce=0.7, rough (suburban, urban or wooded terrain), H≤12m(39'); (2) Ce=0.9~1, open terrain, H≤12m(39')</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 items-center">
                                <label className="text-sm font-medium">Ct</label>
                                <NumberInput
                                  value={data.ct}
                                  onValueChange={(value) => handleWindChange('ct', value)}
                                  min={0}
                                  max={3}
                                  step={0.1}
                                  precision={1}
                                  className="w-full"
                                />
                                <span className="text-xs text-muted-foreground">Topographic Factor: Ct=1 for normal, else for hill/slope (refer to Code)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Calculation Area: from q to Cpi */}
                        <Card className="mt-6 p-4">
                          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">Calculation Area</h4>
                                                      <div className="space-y-0 text-muted-foreground">
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium text-muted-foreground">Parameter</span>
                                <span className="font-medium text-muted-foreground">Value</span>
                                <span className="font-medium text-muted-foreground">Description</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">q</span><span className="font-mono">{q.toFixed(2)}</span>                                <span className="text-xs">Hourly Wind Pressures kPa, 1/50</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cg_main</span><span className="font-mono">{data.cgMain}</span>                                <span className="text-xs">Gust Effect Factor: Cg=2 for main structure</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cg_cladding</span><span className="font-mono">{data.cgCladding}</span>                                <span className="text-xs">Gust Effect Factor: 2.5 for cladding</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp windward</span><span className="font-mono">{data.cpWindward}</span>                                <span className="text-xs">External Pressure Coefficients: For normal buildings; Conservative Value (H/D≥1)</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp leeward</span><span className="font-mono">{data.cpLeeward}</span><span/>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp parallel</span><span className="font-mono">{data.cpParallel}</span><span/>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp roof</span><span className="font-mono">{data.cpRoof}</span><span/>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cp cladding</span><span className="font-mono">±0.9</span>                                <span className="text-xs">For walls, balcony guards → but not for the corner part</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cei</span><span className="font-mono">{data.cei}</span><span className="text-xs">Normally equal to Ce; 0.7, rough, H≤12m(39')</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cgi</span><span className="font-mono">{data.cgi}</span><span className="text-xs">Internal Gust Effect Factor: Cgi=2</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cpi (min)</span><span className="font-mono">{data.cpiMin}</span><span className="text-xs">Internal Pressure Coefficient: Non-uniformly distributed openings of which none is significant or significant openings that are wind-resistant and closed during storms</span>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-3 gap-2 text-sm items-center py-2">
                                <span className="font-medium">Cpi (max)</span><span className="font-mono">{data.cpiMax}</span><span/>
                              </div>
                            </div>
                        </Card>

                        {/* External Pressure Area */}
                        <Card className="mt-6 p-4">
                          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">External Pressure: P = Iw × q × Ce × Ct × Cg × Cp</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left">Surface</TableHead>
                                <TableHead className="text-center">Value</TableHead>
                                <TableHead className="text-center">Unit</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Windward Surface</TableCell>
                                <TableCell className="text-center font-mono">{windwardSurface.toFixed(2)}</TableCell>
                                <TableCell className="text-center">kPa</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell></TableCell>
                                <TableCell className="text-center font-mono text-red-600 dark:text-red-400">{windwardSurfacePsf.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">psf</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Leeward Surface</TableCell>
                                <TableCell className="text-center font-mono">{leewardSurface.toFixed(2)}</TableCell>
                                <TableCell className="text-center">kPa</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell></TableCell>
                                <TableCell className="text-center font-mono text-red-600 dark:text-red-400">{leewardSurfacePsf.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">psf</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Parallel Surface</TableCell>
                                <TableCell className="text-center font-mono">{parallelSurface.toFixed(2)}</TableCell>
                                <TableCell className="text-center">kPa</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell></TableCell>
                                <TableCell className="text-center font-mono text-red-600 dark:text-red-400">{parallelSurfacePsf.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">psf</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Roof Surface</TableCell>
                                <TableCell className="text-center font-mono">{roofSurface.toFixed(2)}</TableCell>
                                <TableCell className="text-center">kPa</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell></TableCell>
                                <TableCell className="text-center font-mono text-red-600 dark:text-red-400">{roofSurfacePsf.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">psf</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Cladding Surface</TableCell>
                                <TableCell className="text-center font-mono">{claddingSurfaceKpaPos.toFixed(2)}</TableCell>
                                <TableCell className="text-center">kPa</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell></TableCell>
                                <TableCell className="text-center font-mono text-red-600 dark:text-red-400">{claddingSurfacePsfPos.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">psf</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Card>

                        {/* Internal Pressure Area */}
                        <Card className="mt-6 p-4">
                          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">Internal Pressure: P = Iw × q × Cei × Ct × Cgi × Cpi</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left">Surface</TableHead>
                                <TableHead className="text-center">Value</TableHead>
                                <TableHead className="text-center">Unit</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Surface Max.</TableCell>
                                <TableCell className="text-center font-mono">{internalPressureMax.toFixed(2)}</TableCell>
                                <TableCell className="text-center">kPa</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell></TableCell>
                                <TableCell className="text-center font-mono text-red-600 dark:text-red-400">{internalPressureMaxPsf.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">psf</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Surface Min.</TableCell>
                                <TableCell className="text-center font-mono">{internalPressureMin.toFixed(2)}</TableCell>
                                <TableCell className="text-center">kPa</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell></TableCell>
                                <TableCell className="text-center font-mono text-red-600 dark:text-red-400">{internalPressureMinPsf.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">psf</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Card>

                        {/* Main Structure */}
                        <Card className="mt-6 p-4">
                          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">Main Structure (Whole Building)</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left">Component</TableHead>
                                <TableHead className="text-center">Value</TableHead>
                                <TableHead className="text-center">Unit</TableHead>
                                <TableHead className="text-left">Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Max pressure</TableCell>
                                <TableCell className="text-center font-mono">{windwardSurfacePsf.toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">windward surface, Cp=0.8</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Max suction</TableCell>
                                <TableCell className="text-center font-mono">{parallelSurfacePsf.toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">parallel surface, Cp=-0.7</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Roof</TableCell>
                                <TableCell className="text-center font-mono">{(roofSurfacePsf - internalPressureMaxPsf).toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">external roof + internal pressure, Cp= -1-0.3 = -1.3</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Windward Direction as a Whole</TableCell>
                                <TableCell className="text-center font-mono">{(windwardSurfacePsf - leewardSurfacePsf).toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">windward - leeward surface, Cp = 0.8 - (-0.5) = 1.3</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Card>

                        {/* Components */}
                        <Card className="mt-6 p-4">
                          <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-3">Components</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left">Component</TableHead>
                                <TableHead className="text-center">Value</TableHead>
                                <TableHead className="text-center">Unit</TableHead>
                                <TableHead className="text-left">Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Wall Cladding - Inward</TableCell>
                                <TableCell className="text-center font-mono">{(claddingSurfacePsfPos - internalPressureMinPsf).toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">external cladding pressure + internal suction, Cp = 0.9- (-0.45) =1.35</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Wall Cladding - Outward</TableCell>
                                <TableCell className="text-center font-mono">{(claddingSurfacePsfNeg - internalPressureMaxPsf).toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">external cladding suction + internal pressure, Cp = -0.9-0.3 = -1.2</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Balcony guards</TableCell>
                                <TableCell className="text-center font-mono">{claddingSurfacePsfPos.toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">external cladding pressure, Cp = 0.9</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Card>

                        {/* Canopy */}
                        <Card className="mt-6 p-4">
                          <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-3">Canopy</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left">Component</TableHead>
                                <TableHead className="text-center">Value</TableHead>
                                <TableHead className="text-center">Unit</TableHead>
                                <TableHead className="text-left">Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Canopy (Positive Pressure)</TableCell>
                                <TableCell className="text-center font-mono">{(data.iw * q * data.ce * data.ct * 1.5 * 20.88543).toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">Attached Canopies on Low Buildings with a Height H ≤ 20 m: (1) Net gust pressure → Pnet = Iw × q × Ce × Ct × (CgCp)net; (2) + → downward, - → upward;</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Canopy (Negative Pressure)</TableCell>
                                <TableCell className="text-center font-mono">{(data.iw * q * data.ce * data.ct * (-3.2) * 20.88543).toFixed(2)}</TableCell>
                                <TableCell className="text-center">psf</TableCell>
                                <TableCell className="text-sm text-muted-foreground">(3) Conservative value: (CgCp)net = 1.5(max.) / -3.2(min.)</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Card>
                      </div>
                    );
                  }
                  

                  
                  if (activeTabForDisplay?.type === 'seismic' || activeTabForDisplay?.tabType === 'seismic') {
                    // Unique key for this tab
                    const tabKey = `${selectedPage.projectId}_${selectedPage.pageId}_${activeTabForDisplay.id}`;
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
                    const mergedSeismicData = activeTabForDisplay.mergedData?.seismicTabData || {};
                    const localSeismicData = seismicTabData[tabKey] || {};
                    const data = { ...seismicDefaults, ...mergedSeismicData, ...localSeismicData };
                    
                    // Use seismic results from database if available, otherwise use local React state
                    const persistedSeismicResults = activeTabForDisplay.mergedData?.seismicResults || {};
                    const localSeismicResults = seismicResults[tabKey] || null;
                    const seismicResult = localSeismicResults || (persistedSeismicResults.site_class ? persistedSeismicResults : null);
                    
                    // Ensure seismicResult is null if it's an empty object (for proper table hiding)
                    const finalSeismicResult = seismicResult && Object.keys(seismicResult).length > 0 && seismicResult.site_class ? seismicResult : null;
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
                          
                          if (encryptionEnabled && userPassword) {
                            // Use encrypted save operation with stored password
                            await workspaceStateService.updateTabDataEncrypted(activeTabForDisplay.id, 'seismic', deltaData, userPassword);
                          } else {
                            // Use regular save operation
                            await workspaceStateService.updateTabData(activeTabForDisplay.id, 'seismic', deltaData);
                          }
                        } catch (error) {
                          console.error('Error saving seismic data:', error);
                          showToastNotification('Failed to save changes: ' + error.message, 'error');
                        }
                      }
                    };
                    return (
                      <>
                        {/* Seismic Data Form */}
                        <Card className="max-w-md mx-auto mb-6">
                          <CardHeader>
                            <CardTitle className="text-lg text-center">Seismic Data Form</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="designer">Designer</Label>
                                <Input 
                                  id="designer"
                                  value={data.designer || ''} 
                                  onChange={e => handleChange('designer', e.target.value)} 
                                  placeholder="Enter designer name"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="address">Address *</Label>
                                <Input 
                                  id="address"
                                  value={data.address || ''} 
                                  onChange={e => handleChange('address', e.target.value)} 
                                  placeholder="Enter the address"
                                  className={showSeismicValidationError && !data.address ? 'border-destructive' : ''}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="project">Project #</Label>
                                  <Input 
                                    id="project"
                                    value={data.project || ''} 
                                    onChange={e => handleChange('project', e.target.value)} 
                                    placeholder="Project number"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="revision">Revision</Label>
                                  <Input 
                                    id="revision"
                                    value={data.revision || ''} 
                                    onChange={e => handleChange('revision', e.target.value)} 
                                    placeholder="Revision"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="date">Date</Label>
                                  <Input 
                                    id="date"
                                    value={data.date || ''} 
                                    onChange={e => handleChange('date', e.target.value)} 
                                    placeholder="Select date"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="bldgCode">Building Code</Label>
                                  <Input 
                                    id="bldgCode"
                                    value={data.bldgCode || ''} 
                                    onChange={e => handleChange('bldgCode', e.target.value)} 
                                    placeholder="Building code"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key *</Label>
                                                            {hasStoredApiKey ? (
                                  <Input
                                    id="apiKey"
                                    type="text"
                                    value="Securely stored - no need to enter"
                                    disabled={true}
                                    className="bg-green-50 border-green-300 text-green-700 cursor-not-allowed"
                                  />
                                ) : (
                                  <Input
                                    id="apiKey"
                                    type="password"
                                    value={data.apiKey || ''}
                                    onChange={(e) => handleChange('apiKey', e.target.value)}
                                    placeholder="Enter your API key"
                                    disabled={apiKeyLoading}
                                    className={showSeismicValidationError && !data.apiKey ? 'border-destructive' : ''}
                                  />
                                )}
                              </div>
                            </div>
                          
                          {/* API Key Status Note */}
                          {hasStoredApiKey && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                              <div className="text-xs text-green-600 text-center">
                                ✓ API key securely stored - can be managed in Settings
                              </div>
                            </div>
                          )}
                          
                          {/* API Key Options - only show when no key is stored */}
                          {!hasStoredApiKey && (
                            <div className="flex items-center justify-center space-x-2 mt-4">
                              <Checkbox
                                id="remember-key"
                                checked={rememberApiKey}
                                onCheckedChange={setRememberApiKey}
                                disabled={apiKeyLoading}
                              />
                              <Label htmlFor="remember-key" className="text-sm text-muted-foreground">
                                Remember my API key securely
                              </Label>
                              <Button
                                type="button"
                                variant="link"
                                onClick={() => setShowSecurityInfoModal(true)}
                                disabled={apiKeyLoading}
                                className="text-sm p-0 h-auto"
                              >
                                Learn more about security
                              </Button>
                            </div>
                          )}
                          
                          {/* Required Fields Note */}
                          <div className="text-xs text-muted-foreground text-center mt-4">
                            * Required fields
                          </div>
                          
                          {/* Retrieve Data Button */}
                          <div className="flex justify-center mt-6">
                            <Button
                              variant="outline"
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
                                setSeismicResults(prev => ({
                                  ...prev,
                                  [tabKey]: result
                                }));
                                
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
                                  await workspaceStateService.saveTabDataImmediately(activeTabForDisplay.id, 'seismic', seismicResultsDelta);
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
                          </Button>
                          <Button
                            variant="outline"
                            className="ml-4"
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
                                // Clear both form data and seismic results from database
                                const emptyData = {
                                  seismicTabData: {},
                                  seismicResults: {}  // Explicitly clear seismic results
                                };
                                await workspaceApiService.replaceTabDataSmart(activeTabForDisplay.id, emptyData);
                                console.log('✅ Seismic data and results completely cleared from database');
                                
                                // Immediately update the tab's mergedData to reflect the cleared state
                                setProjects(prevProjects => prevProjects.map(project => ({
                                  ...project,
                                  pages: project.pages.map(page => ({
                                    ...page,
                                    tabs: page.tabs.map(tab => {
                                      if (tab.id === activeTabForDisplay.id) {
                                        return {
                                          ...tab,
                                          mergedData: {
                                            ...tab.mergedData,
                                            seismicTabData: {},
                                            seismicResults: {}
                                          }
                                        };
                                      }
                                      return tab;
                                    })
                                  }))
                                })));
                              } catch (error) {
                                console.error('Error clearing seismic data:', error);
                                showToastNotification('Failed to clear data: ' + error.message, 'error');
                              }
                            }}
                          >
                            Clear Data
                          </Button>
                        </div>
                        </CardContent>
                      </Card>

                      {/* Independent Results Tables - Full Width */}
                      {showSeismicValidationError && seismicFormError && (
                        <div className="text-red-600 text-center mb-6">{seismicFormError}</div>
                      )}
                      
                      {/* Seismic Results Table */}
                      {finalSeismicResult && (
                        <div className="mb-6">
                          <SeismicResultsTable seismicResult={finalSeismicResult} />
                        </div>
                      )}
                      
                      {/* Sediment Types Table */}
                      {finalSeismicResult && sedimentTypes.length > 0 && (
                        <div className="mb-6">
                          <SedimentTypesTable 
                            sedimentTypes={sedimentTypes} 
                            seismicResult={finalSeismicResult} 
                          />
                        </div>
                      )}
                      </>
                    );
                  }
                  
                  // Default content for other tabs
                  return (
                    <>
                      {(activeTabForDisplay?.type === 'Welcome' || activeTabForDisplay?.tabType === 'Welcome' || activeTabForDisplay?.type === 'welcome' || activeTabForDisplay?.tabType === 'welcome') ? (
                        <div className="welcome-content">
                          <div className="feature-overview mb-6">
                                            <h3 className="text-lg font-semibold mb-3">Available Tools:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                              <li><strong>Snow Load Calculator</strong> - Calculate snow loads for various roof configurations</li>
                              <li><strong>Wind Load Calculator</strong> - Determine wind pressure loads for structures</li>
                              <li><strong>Seismic Analysis</strong> - Get seismic hazard data for specific locations</li>
                            </ul>
                          </div>
                          <div className="getting-started">
                                            <h3 className="text-lg font-semibold mb-3">Getting Started:</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                              <li>Create a new tab using the &quot;+&quot; button</li>
                              <li>Select the appropriate calculator type</li>
                              <li>Enter your project parameters</li>
                              <li>Review the calculated results</li>
                            </ol>
                          </div>
                        </div>
                      ) : (activeTabForDisplay?.type === 'design_tables' || activeTabForDisplay?.tabType === 'design_tables') ? (
                        <div className="design-tables-content">
                          <div className="workspace-area">
                                            <h3 className="text-lg font-semibold mb-3">Design Tables & Diagrams</h3>
                <p className="text-muted-foreground mb-6">This is your workspace for helper diagrams, reference tables, and design documentation.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div className="table-placeholder border-2 border-dashed border-muted rounded-lg p-6">
                  <h4 className="text-md font-semibold mb-2">Helper Tables</h4>
                  <p className="text-muted-foreground">Add structural design tables, load charts, and reference data here.</p>
                </div>
                <div className="diagram-placeholder border-2 border-dashed border-muted rounded-lg p-6">
                  <h4 className="text-md font-semibold mb-2">Design Diagrams</h4>
                  <p className="text-muted-foreground">Create and manage structural diagrams, sketches, and visual aids.</p>
                </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p>Welcome to the {activeTabForDisplay?.name || 'workspace'} area.</p>
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
        <Card className="fixed z-50 py-1 w-fit max-w-[250px]" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <CardContent className="p-0">
            {contextMenu.type === 'project' && (
              <>
                <Button
                  onClick={() => handleContextMenuAction('rename')}
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto"
                >
                  <Edit size={14} className="mr-2" />
                  <span>Rename</span>
                </Button>
                <Button
                  onClick={() => handleContextMenuAction('copy')}
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto"
                >
                  <Copy size={14} className="mr-2" />
                  <span>Copy</span>
                </Button>
                <Button
                  onClick={() => handleContextMenuAction('delete')}
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto"
                >
                  <Trash2 size={14} className="mr-2" />
                  <span>Delete</span>
                </Button>
                <Button
                  onClick={() => handleContextMenuAction('newPage')}
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto"
                >
                  <Plus size={14} className="mr-2" />
                  <span>New Page</span>
                </Button>
              </>
            )}
          
          {contextMenu.type === 'page' && (
            <>
              <Button
                onClick={() => handleContextMenuAction('rename')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <Edit size={14} className="mr-2" />
                <span>Rename</span>
              </Button>
              <Button
                onClick={() => handleContextMenuAction('copy')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <Copy size={14} className="mr-2" />
                <span>Copy</span>
              </Button>
              <Button
                onClick={() => handleContextMenuAction('delete')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <Trash2 size={14} className="mr-2" />
                <span>Delete</span>
              </Button>
              
              {clipboard.type && (
                <Button
                  onClick={() => handleContextMenuAction('paste')}
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto"
                >
                  <FileText size={14} className="mr-2 text-purple-600 dark:text-purple-400" />
                  <span>Paste Tab</span>
                </Button>
              )}
            </>
          )}
          
          {contextMenu.type === 'tab' && (
            <>
              <Button
                onClick={() => handleContextMenuAction('rename')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <Edit size={14} className="mr-2 text-blue-600" />
                <span>Rename</span>
              </Button>
              
              <Button
                onClick={() => handleContextMenuAction('copy')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <Copy size={14} className="mr-2 text-green-600" />
                <span>Copy this tab</span>
              </Button>
              
              <Button
                onClick={() => handleContextMenuAction('copyToClipboard')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <Copy size={14} className="mr-2 text-blue-600" />
                <span>Copy to Clipboard</span>
              </Button>
              
              <Button
                onClick={() => handleContextMenuAction('cutToClipboard')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <Scissors size={14} className="mr-2 text-orange-600" />
                <span>Cut to Clipboard</span>
              </Button>
              
                              {clipboard.type && (
                  <Button
                    onClick={() => handleContextMenuAction('pasteAfterThisTab')}
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 h-auto"
                  >
                    <FileText size={14} className="mr-2 text-purple-600 dark:text-purple-400" />
                    <span>Paste after this tab</span>
                  </Button>
                )}
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <Button
                onClick={() => handleContextMenuAction('newTabRight')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <Plus size={14} className="mr-2" />
                <span>New Tab to the Right</span>
              </Button>
              
              {(() => {
                const { projectId, pageId } = selectedPage;
                const project = projects.find(p => p.id === projectId);
                const page = project?.pages.find(p => p.id === pageId);
                const tab = page?.tabs.find(t => t.id === contextMenu.itemId);
                return tab?.locked ? (
                  <Button
                    onClick={() => handleContextMenuAction('unlockTab')}
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 h-auto"
                  >
                    <Unlock size={14} className="mr-2" />
                    <span>Unlock Tab</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleContextMenuAction('lockTab')}
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 h-auto"
                  >
                    <Lock size={14} className="mr-2" />
                    <span>Lock Tab</span>
                  </Button>
                );
              })()}
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <Button
                onClick={() => handleContextMenuAction('resetToTemplate')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto hover:bg-orange-100 text-orange-600"
              >
                <RefreshCw size={14} className="mr-2" />
                <span>Reset to Template</span>
              </Button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <Button
                onClick={() => handleContextMenuAction('moveToStart')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <ChevronLeft size={14} className="mr-2" />
                <span>Move to Start</span>
              </Button>
              
              <Button
                onClick={() => handleContextMenuAction('moveToEnd')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <ChevronRight size={14} className="mr-2" />
                <span>Move to End</span>
              </Button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <Button
                onClick={() => handleContextMenuAction('closeOthers')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <X size={14} className="mr-2" />
                <span>Close Other Tabs</span>
              </Button>
              
              {(() => {
                const { projectId, pageId } = selectedPage;
                const project = projects.find(p => p.id === projectId);
                const page = project?.pages.find(p => p.id === pageId);
                const currentTabIndex = page?.tabs.findIndex(t => t.id === contextMenu.itemId) ?? -1;
                const tabsToRight = page?.tabs.slice(currentTabIndex + 1).filter(t => !t.locked && !t.isLocked) ?? [];
                
                // Only show if there are tabs to the right that can be closed
                if (tabsToRight.length > 0) {
                  return (
                    <Button
                      onClick={() => handleContextMenuAction('closeTabsToRight')}
                      variant="ghost"
                      className="w-full justify-start px-4 py-2 h-auto"
                    >
                      <X size={14} className="mr-2" />
                      <span>Close Tabs to Right ({tabsToRight.length})</span>
                    </Button>
                  );
                }
                return null;
              })()}
              
              <Button
                onClick={() => handleContextMenuAction('closeAll')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto"
              >
                <X size={14} className="mr-2" />
                <span>Close All Tabs</span>
              </Button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <Button
                onClick={() => handleContextMenuAction('closeThisTab')}
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-auto hover:bg-red-100 text-red-600"
              >
                <X size={14} />
                <span>Close this tab</span>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
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
              <Button
                onClick={() => setShowSecurityInfoModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            </div>
            
            <div className="flex items-center mb-4">
                            <Info size={20} className="text-blue-500 mr-3 flex-shrink-0" />
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
              <Button
                onClick={() => setShowSecurityInfoModal(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Store API Key Modal */}
      {showStoreApiKeyModal && (
        <Dialog open={showStoreApiKeyModal} onOpenChange={() => {
          setShowStoreApiKeyModal(false);
          setCurrentUserPassword('');
          setApiKeyError('');
        }}>
          <DialogContent className="max-w-md flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <CheckCircle size={20} className="text-primary mr-2" />
                Store API Key Securely
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle size={20} className="text-primary mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Your API key was used successfully. Would you like to store it securely so you don't need to enter it again?
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="store-password">Enter your password to store the API key:</Label>
                <Input
                  id="store-password"
                  type="password"
                  value={currentUserPassword}
                  onChange={(e) => setCurrentUserPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
              
              {apiKeyError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {apiKeyError}
                </div>
              )}
              
              {/* Don't show again option */}
              <div className="flex items-center">
                <Checkbox
                  id="dont-show-again"
                  checked={dontShowStorePrompt}
                  onCheckedChange={setDontShowStorePrompt}
                />
                <Label htmlFor="dont-show-again" className="ml-2 text-sm text-muted-foreground">
                  Don't show this prompt again
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStoreApiKeyModal(false);
                  setCurrentUserPassword('');
                  setApiKeyError('');
                }}
                disabled={apiKeyLoading}
              >
                Don't Store
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const currentProject = projects.find(p => p.id === selectedPage.projectId);
                  const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                  const activeTab = findActiveTabOrWelcome(currentPage?.tabs);
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
                disabled={apiKeyLoading}
              >
                {apiKeyLoading ? 'Storing...' : 'Store Securely'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete API Key Modal */}
      {showDeleteApiKeyModal && (
        <Dialog open={showDeleteApiKeyModal} onOpenChange={() => {
          setShowDeleteApiKeyModal(false);
          setDeleteApiKeyPassword('');
          setApiKeyError('');
        }}>
          <DialogContent className="max-w-md flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle size={20} className="text-destructive mr-2" />
                Delete API Key
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <AlertTriangle size={20} className="text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete your stored API key? You'll need to enter it again when using seismic features.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delete-password">Enter your password to confirm deletion:</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deleteApiKeyPassword}
                  onChange={(e) => setDeleteApiKeyPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
              
              {apiKeyError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {apiKeyError}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteApiKeyModal(false);
                  setDeleteApiKeyPassword('');
                  setApiKeyError('');
                }}
                disabled={apiKeyLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteApiKey}
                disabled={apiKeyLoading}
              >
                {apiKeyLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Seismic API Key Decryption Modal */}
      {showSeismicDecryptModal && (
        <Dialog open={showSeismicDecryptModal} onOpenChange={() => {
          setShowSeismicDecryptModal(false);
          setSeismicDecryptPassword('');
          setSeismicDecryptError('');
          setPendingSeismicData(null);
        }}>
          <DialogContent className="max-w-md flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Lock size={24} className="text-primary mr-2" />
                Decrypt API Key
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex items-center mb-6">
              <Lock size={24} className="text-primary mr-4 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Enter your password to decrypt your stored API key for seismic analysis.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="decrypt-password">Enter your password:</Label>
                <Input
                  id="decrypt-password"
                  type="password"
                  value={seismicDecryptPassword}
                  onChange={(e) => setSeismicDecryptPassword(e.target.value)}
                  placeholder="Your password"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSeismicDecrypt();
                    }
                  }}
                />
              </div>
              
              {seismicDecryptError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {seismicDecryptError}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSeismicDecryptModal(false);
                  setSeismicDecryptPassword('');
                  setSeismicDecryptError('');
                  setPendingSeismicData(null);
                }}
                disabled={seismicDecryptLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSeismicDecrypt}
                disabled={seismicDecryptLoading}
              >
                {seismicDecryptLoading ? 'Decrypting...' : 'Decrypt & Continue'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Password Prompt for Encrypted Data */}
      {showPasswordPrompt && (
        <Dialog open={showPasswordPrompt} onOpenChange={() => {
          setShowPasswordPrompt(false);
          setPasswordPromptCallback(null);
        }}>
          <DialogContent className="max-w-md flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <svg style={{ width: '24px', height: '24px' }} className="text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Encrypted Data Detected
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your workspace contains encrypted data. Please enter your password to decrypt and access your data.
              </p>
              <div className="space-y-2">
                <Label htmlFor="password-input">Enter your password:</Label>
                <Input
                  id="password-input"
                  type="password"
                  placeholder="Enter your password"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const password = e.target.value;
                      if (password && passwordPromptCallback) {
                        passwordPromptCallback(password);
                      }
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPasswordPromptCallback(null);
                }}
              >
                Skip
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const passwordInput = document.querySelector('#password-input');
                  const password = passwordInput?.value;
                  if (password && passwordPromptCallback) {
                    passwordPromptCallback(password);
                  }
                }}
              >
                🔓 Decrypt Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            {toastType === 'success' ? (
              <CheckCircle size={20} className="flex-shrink-0" />
            ) : toastType === 'info' ? (
              <Info size={20} className="flex-shrink-0" />
            ) : (
              <X size={20} className="flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Username Edit Dialog */}
      {showUsernameDialog && (
        <Dialog open={showUsernameDialog} onOpenChange={() => {
          setShowUsernameDialog(false);
          setNewUsername('');
          setUsernameDialogError('');
        }}>
          <DialogContent className="max-w-md flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <User size={20} className="text-primary mr-2" />
                Change Username
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Enter new username:</Label>
                <Input
                  id="new-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUsernameUpdate();
                    }
                  }}
                  autoFocus
                />
              </div>
              
              {usernameDialogError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {usernameDialogError}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUsernameDialog(false);
                  setNewUsername('');
                  setUsernameDialogError('');
                }}
                disabled={usernameLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleUsernameUpdate}
                disabled={usernameLoading}
              >
                {usernameLoading ? 'Updating...' : 'Update Username'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </>
  );
}