package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class WorkspaceDataService {

    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private PageRepository pageRepository;
    
    @Autowired
    private TabRepository tabRepository;
    
    @Autowired
    private TabDataRepository tabDataRepository;
    
    @Autowired
    private TabDataEncryptionService tabDataEncryptionService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==================== PROJECT OPERATIONS ====================
    
    public List<Project> getAllProjectsForUser(Long userId) {
        return projectRepository.findByUserIdOrderByDisplayOrderAsc(userId);
    }
    
    public Project createProject(Long userId, String name) {
        if (projectRepository.existsByUserIdAndName(userId, name)) {
            throw new RuntimeException("Project with name '" + name + "' already exists");
        }
        
        Project project = new Project();
        project.setUserId(userId);
        project.setName(name);
        project.setDisplayOrder(projectRepository.findMaxDisplayOrderByUserId(userId) + 1);
        project.setIsExpanded(false);
        
        return projectRepository.save(project);
    }
    
    public Project updateProject(UUID projectId, Long userId, String name, Boolean isExpanded) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to project");
        }
        
        if (name != null && !name.equals(project.getName())) {
            if (projectRepository.existsByUserIdAndName(userId, name)) {
                throw new RuntimeException("Project with name '" + name + "' already exists");
            }
            project.setName(name);
        }
        
        if (isExpanded != null) {
            project.setIsExpanded(isExpanded);
        }
        
        return projectRepository.save(project);
    }
    
    public void deleteProject(UUID projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to project");
        }
        
        projectRepository.delete(project);
        
        // Reorder remaining projects
        reorderProjectsAfterDeletion(userId, project.getDisplayOrder());
    }
    
    public void updateProjectOrder(Long userId, List<UUID> projectIds) {
        List<Project> projects = projectRepository.findAllById(projectIds);
        
        // Verify all projects belong to the user
        for (Project project : projects) {
            if (!project.getUserId().equals(userId)) {
                throw new RuntimeException("Unauthorized access to project");
            }
        }
        
        // Update display order
        for (int i = 0; i < projectIds.size(); i++) {
            UUID projectId = projectIds.get(i);
            Project project = projects.stream()
                .filter(p -> p.getId().equals(projectId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
            
            project.setDisplayOrder(i);
            projectRepository.save(project);
        }
    }
    
    private void reorderProjectsAfterDeletion(Long userId, Integer deletedOrder) {
        List<Project> projectsToReorder = projectRepository
            .findByUserIdAndDisplayOrderGreaterThanEqualOrderByDisplayOrderAsc(userId, deletedOrder);
        
        for (Project project : projectsToReorder) {
            project.setDisplayOrder(project.getDisplayOrder() - 1);
            projectRepository.save(project);
        }
    }

    // ==================== PAGE OPERATIONS ====================
    
    public List<Page> getAllPagesForProject(UUID projectId) {
        return pageRepository.findByProjectIdOrderByDisplayOrderAsc(projectId);
    }
    
    public Page createPage(UUID projectId, Long userId, String name) {
        // Verify project ownership
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to project");
        }
        
        if (pageRepository.existsByProjectIdAndName(projectId, name)) {
            throw new RuntimeException("Page with name '" + name + "' already exists in this project");
        }
        
        Page page = new Page();
        page.setProjectId(projectId);
        page.setName(name);
        page.setDisplayOrder(pageRepository.findMaxDisplayOrderByProjectId(projectId) + 1);
        
        return pageRepository.save(page);
    }
    
    public Page updatePage(UUID pageId, Long userId, String name) {
        Page page = pageRepository.findById(pageId)
            .orElseThrow(() -> new RuntimeException("Page not found"));
            
        // Verify ownership through project
        Project project = projectRepository.findById(page.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to page");
        }
        
        if (name != null && !name.equals(page.getName())) {
            if (pageRepository.existsByProjectIdAndName(page.getProjectId(), name)) {
                throw new RuntimeException("Page with name '" + name + "' already exists in this project");
            }
            page.setName(name);
        }
        
        return pageRepository.save(page);
    }
    
    public void deletePage(UUID pageId, Long userId) {
        Page page = pageRepository.findById(pageId)
            .orElseThrow(() -> new RuntimeException("Page not found"));
            
        // Verify ownership through project
        Project project = projectRepository.findById(page.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to page");
        }
        
        pageRepository.delete(page);
        
        // Reorder remaining pages
        reorderPagesAfterDeletion(page.getProjectId(), page.getDisplayOrder());
    }
    
    public void updatePageOrder(UUID projectId, Long userId, List<UUID> pageIds) {
        // Verify project ownership
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to project");
        }
        
        List<Page> pages = pageRepository.findAllById(pageIds);
        
        // Update display order
        for (int i = 0; i < pageIds.size(); i++) {
            UUID pageId = pageIds.get(i);
            Page page = pages.stream()
                .filter(p -> p.getId().equals(pageId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Page not found: " + pageId));
            
            page.setDisplayOrder(i);
            pageRepository.save(page);
        }
    }
    
    public void movePageToProject(UUID pageId, UUID newProjectId, Long userId) {
        Page page = pageRepository.findById(pageId)
            .orElseThrow(() -> new RuntimeException("Page not found"));
            
        // Verify ownership of both projects
        Project oldProject = projectRepository.findById(page.getProjectId())
            .orElseThrow(() -> new RuntimeException("Source project not found"));
        Project newProject = projectRepository.findById(newProjectId)
            .orElseThrow(() -> new RuntimeException("Target project not found"));
            
        if (!oldProject.getUserId().equals(userId) || !newProject.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to projects");
        }
        
        // Move page to new project
        Integer oldOrder = page.getDisplayOrder();
        UUID oldProjectId = page.getProjectId();
        
        page.setProjectId(newProjectId);
        page.setDisplayOrder(pageRepository.findMaxDisplayOrderByProjectId(newProjectId) + 1);
        pageRepository.save(page);
        
        // Reorder pages in old project
        reorderPagesAfterDeletion(oldProjectId, oldOrder);
    }
    
    private void reorderPagesAfterDeletion(UUID projectId, Integer deletedOrder) {
        List<Page> pagesToReorder = pageRepository
            .findByProjectIdAndDisplayOrderGreaterThanEqualOrderByDisplayOrderAsc(projectId, deletedOrder);
        
        for (Page page : pagesToReorder) {
            page.setDisplayOrder(page.getDisplayOrder() - 1);
            pageRepository.save(page);
        }
    }

    // ==================== TAB OPERATIONS ====================
    
    public List<Tab> getAllTabsForPage(UUID pageId) {
        return tabRepository.findByPageIdOrderByDisplayOrderAsc(pageId);
    }
    
    public Tab createTab(UUID pageId, Long userId, String name, String tabType) {
        return createTab(pageId, userId, name, tabType, null);
    }
    
    public Tab createTab(UUID pageId, Long userId, String name, String tabType, Integer position) {
        // Verify page ownership
        Page page = pageRepository.findById(pageId)
            .orElseThrow(() -> new RuntimeException("Page not found"));
            
        Project project = projectRepository.findById(page.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to page");
        }
        
        if (tabRepository.existsByPageIdAndName(pageId, name)) {
            throw new RuntimeException("Tab with name '" + name + "' already exists on this page");
        }
        
        // Deactivate other tabs on the page
        List<Tab> activeTabs = tabRepository.findActiveTabsByPageId(pageId);
        for (Tab activeTab : activeTabs) {
            activeTab.setIsActive(false);
            tabRepository.save(activeTab);
        }
        
        Tab tab = new Tab();
        tab.setPageId(pageId);
        tab.setName(name);
        tab.setTabType(tabType);
        
        // Set display order based on position
        if (position != null && position >= 0) {
            // Insert at specific position - shift existing tabs
            List<Tab> existingTabs = tabRepository.findByPageIdOrderByDisplayOrderAsc(pageId);
            if (position <= existingTabs.size()) {
                // Shift tabs at and after the position
                for (int i = position; i < existingTabs.size(); i++) {
                    Tab existingTab = existingTabs.get(i);
                    existingTab.setDisplayOrder(existingTab.getDisplayOrder() + 1);
                    tabRepository.save(existingTab);
                }
                tab.setDisplayOrder(position);
            } else {
                // Position is beyond existing tabs, put at end
                tab.setDisplayOrder(tabRepository.findMaxDisplayOrderByPageId(pageId) + 1);
            }
        } else {
            // Default behavior - put at end
            tab.setDisplayOrder(tabRepository.findMaxDisplayOrderByPageId(pageId) + 1);
        }
        
        tab.setIsActive(true);
        tab.setIsLocked(false);
        
        Tab savedTab = tabRepository.save(tab);
        
        // Create empty tab data - only for tabs that need data storage
        // Template tabs (Welcome, design_tables) don't need data storage
        if (!"Welcome".equals(tabType) && !"design_tables".equals(tabType)) {
            TabData tabData = new TabData();
            tabData.setTabId(savedTab.getId());
            tabData.setIsEncrypted(true);
            tabData.setDataSalt(tabDataEncryptionService.generateSalt());
            // Don't set data or encrypted_data - will be set when first data is saved
            tabDataRepository.save(tabData);
        }
        
        return savedTab;
    }
    
    public Tab updateTab(UUID tabId, Long userId, String name, String tabType, Boolean isActive, Boolean isLocked) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        // Verify ownership
        verifyTabOwnership(tab, userId);
        
        if (name != null && !name.equals(tab.getName())) {
            // Check if another tab (not this one) has the same name
            List<Tab> conflictingTabs = tabRepository.findByPageIdOrderByDisplayOrderAsc(tab.getPageId())
                .stream()
                .filter(t -> !t.getId().equals(tabId) && t.getName().equals(name))
                .collect(java.util.stream.Collectors.toList());
                
            if (!conflictingTabs.isEmpty()) {
                throw new RuntimeException("Tab with name '" + name + "' already exists on this page");
            }
            tab.setName(name);
        }
        
        if (tabType != null && !tabType.equals(tab.getTabType())) {
            tab.setTabType(tabType);
            // Reset tab data when type changes
            TabData tabData = tabDataRepository.findById(tabId).orElse(null);
            if (tabData != null) {
                tabData.setData(new HashMap<>());
                tabDataRepository.save(tabData);
            }
        }
        
        if (isActive != null && isActive && !tab.getIsActive()) {
            // Deactivate other tabs on the same page
            List<Tab> activeTabs = tabRepository.findActiveTabsByPageId(tab.getPageId());
            for (Tab activeTab : activeTabs) {
                activeTab.setIsActive(false);
                tabRepository.save(activeTab);
            }
            tab.setIsActive(true);
        } else if (isActive != null) {
            tab.setIsActive(isActive);
        }
        
        if (isLocked != null) {
            tab.setIsLocked(isLocked);
        }
        
        return tabRepository.save(tab);
    }
    
    public void updateActiveTab(UUID tabId, Long userId) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        // Verify ownership
        verifyTabOwnership(tab, userId);
        
        if (!tab.getIsActive()) {
            // Deactivate other tabs on the same page
            List<Tab> activeTabs = tabRepository.findActiveTabsByPageId(tab.getPageId());
            for (Tab activeTab : activeTabs) {
                activeTab.setIsActive(false);
                tabRepository.save(activeTab);
            }
            tab.setIsActive(true);
            tabRepository.save(tab);
        }
    }
    
    public void deleteTab(UUID tabId, Long userId) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(tab, userId);
        
        tabRepository.delete(tab);
        
        // Reorder remaining tabs
        reorderTabsAfterDeletion(tab.getPageId(), tab.getDisplayOrder());
    }
    
    public Tab duplicateTab(UUID tabId, Long userId, String newName) {
        Tab originalTab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(originalTab, userId);
        
        if (tabRepository.existsByPageIdAndName(originalTab.getPageId(), newName)) {
            throw new RuntimeException("Tab with name '" + newName + "' already exists on this page");
        }
        
        // Create new tab
        Tab newTab = new Tab();
        newTab.setPageId(originalTab.getPageId());
        newTab.setName(newName);
        newTab.setTabType(originalTab.getTabType());
        newTab.setDisplayOrder(tabRepository.findMaxDisplayOrderByPageId(originalTab.getPageId()) + 1);
        newTab.setIsActive(false);
        newTab.setIsLocked(false);
        
        Tab savedTab = tabRepository.save(newTab);
        
        // Copy tab data - only for tabs that need data storage
        // Template tabs (Welcome, design_tables) don't need data storage
        if (!"Welcome".equals(originalTab.getTabType()) && !"design_tables".equals(originalTab.getTabType())) {
            TabData originalData = tabDataRepository.findById(tabId).orElse(null);
            if (originalData != null) {
                TabData newData = new TabData();
                newData.setTabId(savedTab.getId());
                newData.setIsEncrypted(originalData.getIsEncrypted());
                newData.setDataSalt(originalData.getDataSalt());
                newData.setEncryptedData(originalData.getEncryptedData());
                newData.setData(originalData.getData());
                tabDataRepository.save(newData);
            }
        }
        
        return savedTab;
    }
    
    private void verifyTabOwnership(Tab tab, Long userId) {
        Page page = pageRepository.findById(tab.getPageId())
            .orElseThrow(() -> new RuntimeException("Page not found"));
            
        Project project = projectRepository.findById(page.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to tab");
        }
    }
    
    private void reorderTabsAfterDeletion(UUID pageId, Integer deletedOrder) {
        List<Tab> tabsToReorder = tabRepository
            .findByPageIdAndDisplayOrderGreaterThanEqualOrderByDisplayOrderAsc(pageId, deletedOrder);
        
        for (Tab tab : tabsToReorder) {
            tab.setDisplayOrder(tab.getDisplayOrder() - 1);
            tabRepository.save(tab);
        }
    }
    
    public void updateTabOrder(UUID pageId, Long userId, List<UUID> tabIds) {
        // Verify ownership of the page
        Page page = pageRepository.findById(pageId)
            .orElseThrow(() -> new RuntimeException("Page not found"));
        Project project = projectRepository.findById(page.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to page");
        }
        
        // Update display order for each tab
        for (int i = 0; i < tabIds.size(); i++) {
            UUID tabId = tabIds.get(i);
            Tab tab = tabRepository.findById(tabId)
                .orElseThrow(() -> new RuntimeException("Tab not found: " + tabId));
            
            // Verify tab belongs to the page
            if (!tab.getPageId().equals(pageId)) {
                throw new RuntimeException("Tab does not belong to the specified page");
            }
            
            tab.setDisplayOrder(i);
            tabRepository.save(tab);
        }
    }

    // ==================== TAB DATA OPERATIONS ====================
    
    /**
     * Get tab data with optional decryption for merging purposes
     */
    public TabData getTabDataForMerging(UUID tabId, Long userId, String userPassword) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(tab, userId);
        
        TabData tabData = tabDataRepository.findById(tabId)
            .orElseGet(() -> {
                // For template tabs, return null to indicate no data storage needed
                if ("Welcome".equals(tab.getTabType()) || "design_tables".equals(tab.getTabType())) {
                    return null;
                }
                // For other tabs, create encrypted empty data
                TabData newData = new TabData();
                newData.setTabId(tabId);
                newData.setIsEncrypted(true);
                newData.setDataSalt(tabDataEncryptionService.generateSalt());
                return tabDataRepository.save(newData);
            });
        
        // For template tabs, return empty data
        if (tabData == null) {
            TabData emptyData = new TabData();
            emptyData.setTabId(tabId);
            emptyData.setData(new HashMap<>());
            emptyData.setIsEncrypted(false);
            return emptyData;
        }
        
        // If data is encrypted and password is provided, decrypt for merging
        if (tabData.getIsEncrypted() && userPassword != null && !userPassword.isEmpty()) {
            try {
                // Verify user password first
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                if (!passwordEncoder.matches(userPassword, user.getPassword())) {
                    throw new RuntimeException("Invalid password for data decryption");
                }
                
                // Decrypt the data for merging
                Map<String, Object> decryptedData = tabDataEncryptionService.decryptTabData(
                    tabData.getEncryptedData(), userPassword, tabData.getDataSalt());
                
                // Return a copy with decrypted data for merging (don't modify original)
                TabData decryptedTabData = new TabData();
                decryptedTabData.setTabId(tabData.getTabId());
                decryptedTabData.setData(decryptedData);
                decryptedTabData.setIsEncrypted(false); // Mark as decrypted for merging
                decryptedTabData.setCreatedAt(tabData.getCreatedAt());
                decryptedTabData.setUpdatedAt(tabData.getUpdatedAt());
                
                return decryptedTabData;
            } catch (Exception e) {
                throw new RuntimeException("Failed to decrypt tab data: " + e.getMessage());
            }
        }
        
        return tabData;
    }
    
    /**
     * Save tab data with encryption
     */
    public TabData saveTabDataEncrypted(UUID tabId, Long userId, Map<String, Object> newData, String userPassword) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(tab, userId);
        
        // Verify user password first
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(userPassword, user.getPassword())) {
            throw new RuntimeException("Invalid password for data encryption");
        }
        
        TabData tabData = tabDataRepository.findById(tabId)
            .orElseGet(() -> {
                TabData newTabData = new TabData();
                newTabData.setTabId(tabId);
                return newTabData;
            });
        
        try {
            // Generate salt if not exists
            if (tabData.getDataSalt() == null || tabData.getDataSalt().isEmpty()) {
                tabData.setDataSalt(tabDataEncryptionService.generateSalt());
            }
            
            // Encrypt the data
            String encryptedData = tabDataEncryptionService.encryptTabData(newData, userPassword, tabData.getDataSalt());
            
            // Store encrypted data
            tabData.setEncryptedData(encryptedData);
            tabData.setIsEncrypted(true);
            tabData.setData(null); // Clear unencrypted data
            
            return tabDataRepository.save(tabData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt tab data: " + e.getMessage());
        }
    }
    
    public TabData getTabData(UUID tabId, Long userId) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(tab, userId);
        
        TabData tabData = tabDataRepository.findById(tabId)
            .orElseGet(() -> {
                // For template tabs, return null to indicate no data storage needed
                if ("Welcome".equals(tab.getTabType()) || "design_tables".equals(tab.getTabType())) {
                    return null;
                }
                // Create new tab data with encrypted empty template by default
                TabData newData = new TabData();
                newData.setTabId(tabId);
                newData.setIsEncrypted(true);
                newData.setDataSalt(tabDataEncryptionService.generateSalt());
                // Store empty template as encrypted data - will be properly encrypted when first saved
                newData.setEncryptedData(null); // Will be set when first data is saved
                return tabDataRepository.save(newData);
            });
        
        // For template tabs, return empty data
        if (tabData == null) {
            TabData emptyData = new TabData();
            emptyData.setTabId(tabId);
            emptyData.setData(new HashMap<>());
            emptyData.setIsEncrypted(false);
            return emptyData;
        }
        
        return tabData;
    }
    
    public TabData replaceTabData(UUID tabId, Long userId, Map<String, Object> newData) {
        // This method is deprecated - all data should be encrypted
        // Use replaceTabDataEncrypted instead
        throw new RuntimeException("Cannot update data without password. Use encrypted methods.");
    }
    
    /**
     * Replace tab data with encryption
     */
    public TabData replaceTabDataEncrypted(UUID tabId, Long userId, Map<String, Object> newData, String userPassword) {
        return saveTabDataEncrypted(tabId, userId, newData, userPassword);
    }

    public TabData updateTabData(UUID tabId, Long userId, Map<String, Object> deltaData) {
        // This method is deprecated - all data should be encrypted
        // Use updateTabDataEncrypted instead
        throw new RuntimeException("Cannot update data without password. Use encrypted methods.");
    }
    
    /**
     * Update tab data with encryption - merges delta data with existing encrypted data
     */
    public TabData updateTabDataEncrypted(UUID tabId, Long userId, Map<String, Object> deltaData, String userPassword) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(tab, userId);
        
        // Verify user password first
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(userPassword, user.getPassword())) {
            throw new RuntimeException("Invalid password for data encryption");
        }
        
        TabData tabData = tabDataRepository.findById(tabId)
            .orElseGet(() -> {
                TabData newData = new TabData();
                newData.setTabId(tabId);
                newData.setIsEncrypted(true);
                newData.setDataSalt(tabDataEncryptionService.generateSalt());
                return newData;
            });
        
        try {
            Map<String, Object> currentData = new HashMap<>();
            
            // If data exists and is encrypted, decrypt it first
            if (tabData.getIsEncrypted() && tabData.getEncryptedData() != null) {
                currentData = tabDataEncryptionService.decryptTabData(
                    tabData.getEncryptedData(), userPassword, tabData.getDataSalt());
            } else if (!tabData.getIsEncrypted() && tabData.getData() != null) {
                // Migrating from unencrypted to encrypted
                currentData = new HashMap<>(tabData.getData());
                if (tabData.getDataSalt() == null) {
                    tabData.setDataSalt(tabDataEncryptionService.generateSalt());
                }
            }
            
            // Deep merge delta data with existing data
            if (currentData == null) {
                currentData = new HashMap<>();
            }
            currentData = deepMerge(currentData, deltaData);
            
            // Encrypt and save
            String encryptedData = tabDataEncryptionService.encryptTabData(currentData, userPassword, tabData.getDataSalt());
            
            tabData.setEncryptedData(encryptedData);
            tabData.setIsEncrypted(true);
            tabData.setData(null); // Clear unencrypted data
            
            return tabDataRepository.save(tabData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update encrypted tab data: " + e.getMessage());
        }
    }

    /**
     * Validate user password for encryption operations
     */
    public boolean validateUserPassword(Long userId, String userPassword) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            return passwordEncoder.matches(userPassword, user.getPassword());
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Deep merge two maps - recursively merges nested maps
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> deepMerge(Map<String, Object> target, Map<String, Object> source) {
        Map<String, Object> result = new HashMap<>(target);
        
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = entry.getKey();
            Object sourceValue = entry.getValue();
            
            if (sourceValue instanceof Map && result.get(key) instanceof Map) {
                // Both are maps, recursively merge them
                Map<String, Object> targetMap = (Map<String, Object>) result.get(key);
                Map<String, Object> sourceMap = (Map<String, Object>) sourceValue;
                result.put(key, deepMerge(targetMap, sourceMap));
            } else {
                // Replace or add the value
                result.put(key, sourceValue);
            }
        }
        
        return result;
    }
    
    // ==================== WORKSPACE OPERATIONS ====================
    
    public Map<String, Object> getAllWorkspaceData(Long userId) {
        List<Project> projects = projectRepository.findByUserIdOrderByDisplayOrderAsc(userId);
        
        // Manually load nested data for each project
        for (Project project : projects) {
            List<Page> pages = pageRepository.findByProjectIdOrderByDisplayOrderAsc(project.getId());
            
            // Load tabs for each page
            for (Page page : pages) {
                List<Tab> tabs = tabRepository.findByPageIdOrderByDisplayOrderAsc(page.getId());
                page.setTabs(tabs);
            }
            
            project.setPages(pages);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("projects", projects);
        
        return result;
    }
    
    public void initializeUserWorkspace(Long userId) {
        // Check if user already has projects
        if (projectRepository.countByUserId(userId) > 0) {
            return; // Workspace already initialized
        }
        
        // Initialize empty workspace - users will learn to create their first project
        // No default projects created, promoting user engagement and learning
    }
    
    // ==================== ACTIVE STATE MANAGEMENT ====================
    
    /**
     * Update active project for a user
     */
    public void updateActiveProject(UUID projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to project");
        }
        
        // Deactivate all other projects for this user
        List<Project> userProjects = projectRepository.findByUserIdOrderByDisplayOrderAsc(userId);
        for (Project p : userProjects) {
            if (p.getIsActive()) {
                p.setIsActive(false);
                projectRepository.save(p);
            }
        }
        
        // Activate the selected project
        project.setIsActive(true);
        projectRepository.save(project);
    }
    
    /**
     * Update active page within a project
     */
    public void updateActivePage(UUID pageId, Long userId) {
        Page page = pageRepository.findById(pageId)
            .orElseThrow(() -> new RuntimeException("Page not found"));
            
        // Verify page belongs to user's project
        Project project = projectRepository.findById(page.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));
            
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to page");
        }
        
        // Deactivate all other pages in this project
        List<Page> projectPages = pageRepository.findByProjectIdOrderByDisplayOrderAsc(page.getProjectId());
        for (Page p : projectPages) {
            if (p.getIsActive()) {
                p.setIsActive(false);
                pageRepository.save(p);
            }
        }
        
        // Activate the selected page
        page.setIsActive(true);
        pageRepository.save(page);
    }
    
    /**
     * Get the last active state for a user (project, page, tab)
     */
    public Map<String, Object> getLastActiveState(Long userId) {
        Map<String, Object> activeState = new HashMap<>();
        
        // Find active project
        Project activeProject = projectRepository.findByUserIdAndIsActiveTrue(userId);
        if (activeProject != null) {
            activeState.put("activeProjectId", activeProject.getId());
            
            // Find active page within the active project
            Page activePage = pageRepository.findByProjectIdAndIsActiveTrue(activeProject.getId());
            if (activePage != null) {
                activeState.put("activePageId", activePage.getId());
                
                // Find active tab within the active page
                List<Tab> activeTabs = tabRepository.findActiveTabsByPageId(activePage.getId());
                Tab activeTab = activeTabs.isEmpty() ? null : activeTabs.get(0);
                if (activeTab != null) {
                    activeState.put("activeTabId", activeTab.getId());
                }
            }
        }
        
        return activeState;
    }
    
    /**
     * Set the first project as active if no active project exists
     */
    public void setDefaultActiveState(Long userId) {
        List<Project> projects = projectRepository.findByUserIdOrderByDisplayOrderAsc(userId);
        if (!projects.isEmpty()) {
            Project firstProject = projects.get(0);
            if (!firstProject.getIsActive()) {
                updateActiveProject(firstProject.getId(), userId);
                
                // Set first page as active
                List<Page> pages = pageRepository.findByProjectIdOrderByDisplayOrderAsc(firstProject.getId());
                if (!pages.isEmpty()) {
                    Page firstPage = pages.get(0);
                    updateActivePage(firstPage.getId(), userId);
                }
            }
        }
    }

} 