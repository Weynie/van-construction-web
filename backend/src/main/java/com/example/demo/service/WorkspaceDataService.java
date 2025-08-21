package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
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
        tab.setDisplayOrder(tabRepository.findMaxDisplayOrderByPageId(pageId) + 1);
        tab.setIsActive(true);
        tab.setIsLocked(false);
        
        Tab savedTab = tabRepository.save(tab);
        
        // Create empty tab data
        TabData tabData = new TabData();
        tabData.setTabId(savedTab.getId());
        tabData.setData(new HashMap<>());
        tabDataRepository.save(tabData);
        
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
        
        // Copy tab data
        TabData originalData = tabDataRepository.findById(tabId).orElse(null);
        TabData newData = new TabData();
        newData.setTabId(savedTab.getId());
        newData.setData(originalData != null ? new HashMap<>(originalData.getData()) : new HashMap<>());
        tabDataRepository.save(newData);
        
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
    
    public TabData getTabData(UUID tabId, Long userId) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(tab, userId);
        
        return tabDataRepository.findById(tabId)
            .orElseGet(() -> {
                TabData newData = new TabData();
                newData.setTabId(tabId);
                newData.setData(new HashMap<>());
                return tabDataRepository.save(newData);
            });
    }
    
    public TabData replaceTabData(UUID tabId, Long userId, Map<String, Object> newData) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(tab, userId);
        
        TabData tabData = tabDataRepository.findById(tabId)
            .orElseGet(() -> {
                TabData newTabData = new TabData();
                newTabData.setTabId(tabId);
                return newTabData;
            });
        
        // Completely replace data instead of merging
        tabData.setData(newData);
        
        return tabDataRepository.save(tabData);
    }

    public TabData updateTabData(UUID tabId, Long userId, Map<String, Object> deltaData) {
        Tab tab = tabRepository.findById(tabId)
            .orElseThrow(() -> new RuntimeException("Tab not found"));
            
        verifyTabOwnership(tab, userId);
        
        TabData tabData = tabDataRepository.findById(tabId)
            .orElseGet(() -> {
                TabData newData = new TabData();
                newData.setTabId(tabId);
                newData.setData(new HashMap<>());
                return newData;
            });
        
        // Merge delta data
        Map<String, Object> currentData = tabData.getData();
        if (currentData == null) {
            currentData = new HashMap<>();
        }
        
        currentData.putAll(deltaData);
        tabData.setData(currentData);
        
        return tabDataRepository.save(tabData);
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
} 