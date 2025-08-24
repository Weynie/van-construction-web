package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.WorkspaceDataService;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
@RequestMapping("/api/workspace")
@CrossOrigin(origins = "*")
public class WorkspaceController {

    @Autowired
    private WorkspaceDataService workspaceDataService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserRepository userRepository;

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                // Extract email from JWT token
                String email = jwtUtil.getUsernameFromToken(token);
                
                // Look up user ID from database using email
                return userRepository.findByEmail(email)
                    .map(User::getId)
                    .orElseThrow(() -> new RuntimeException("User not found for email: " + email));
            }
        }
        throw new RuntimeException("Invalid authorization token");
    }

    // ==================== WORKSPACE OPERATIONS ====================
    
    @GetMapping("/data")
    public ResponseEntity<?> getAllWorkspaceData(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            Map<String, Object> data = workspaceDataService.getAllWorkspaceData(userId);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/initialize")
    public ResponseEntity<?> initializeWorkspace(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            workspaceDataService.initializeUserWorkspace(userId);
            return ResponseEntity.ok(Map.of("message", "Workspace initialized"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== PROJECT OPERATIONS ====================
    
    @GetMapping("/projects")
    public ResponseEntity<?> getAllProjects(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            List<Project> projects = workspaceDataService.getAllProjectsForUser(userId);
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/projects")
    public ResponseEntity<?> createProject(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            String name = (String) payload.get("name");
            
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Project name is required"));
            }
            
            Project project = workspaceDataService.createProject(userId, name.trim());
            return ResponseEntity.status(HttpStatus.CREATED).body(project);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/projects/{projectId}")
    public ResponseEntity<?> updateProject(HttpServletRequest request, 
                                         @PathVariable UUID projectId, 
                                         @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            String name = (String) payload.get("name");
            Boolean isExpanded = (Boolean) payload.get("isExpanded");
            
            Project project = workspaceDataService.updateProject(projectId, userId, name, isExpanded);
            return ResponseEntity.ok(project);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<?> deleteProject(HttpServletRequest request, @PathVariable UUID projectId) {
        try {
            Long userId = getUserIdFromRequest(request);
            workspaceDataService.deleteProject(projectId, userId);
            return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/projects/reorder")
    public ResponseEntity<?> updateProjectOrder(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            @SuppressWarnings("unchecked")
            List<String> projectIdStrings = (List<String>) payload.get("projectIds");
            
            List<UUID> projectIds = projectIdStrings.stream()
                .map(UUID::fromString)
                .toList();
            
            workspaceDataService.updateProjectOrder(userId, projectIds);
            return ResponseEntity.ok(Map.of("message", "Project order updated"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== PAGE OPERATIONS ====================
    
    @GetMapping("/projects/{projectId}/pages")
    public ResponseEntity<?> getAllPages(HttpServletRequest request, @PathVariable UUID projectId) {
        try {
            Long userId = getUserIdFromRequest(request);
            List<Page> pages = workspaceDataService.getAllPagesForProject(projectId);
            return ResponseEntity.ok(pages);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/projects/{projectId}/pages")
    public ResponseEntity<?> createPage(HttpServletRequest request, 
                                      @PathVariable UUID projectId, 
                                      @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            String name = (String) payload.get("name");
            
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Page name is required"));
            }
            
            Page page = workspaceDataService.createPage(projectId, userId, name.trim());
            return ResponseEntity.status(HttpStatus.CREATED).body(page);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/pages/{pageId}")
    public ResponseEntity<?> updatePage(HttpServletRequest request, 
                                      @PathVariable UUID pageId, 
                                      @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            String name = (String) payload.get("name");
            
            Page page = workspaceDataService.updatePage(pageId, userId, name);
            return ResponseEntity.ok(page);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/pages/{pageId}")
    public ResponseEntity<?> deletePage(HttpServletRequest request, @PathVariable UUID pageId) {
        try {
            Long userId = getUserIdFromRequest(request);
            workspaceDataService.deletePage(pageId, userId);
            return ResponseEntity.ok(Map.of("message", "Page deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/projects/{projectId}/pages/reorder")
    public ResponseEntity<?> updatePageOrder(HttpServletRequest request, 
                                           @PathVariable UUID projectId, 
                                           @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            @SuppressWarnings("unchecked")
            List<String> pageIdStrings = (List<String>) payload.get("pageIds");
            
            List<UUID> pageIds = pageIdStrings.stream()
                .map(UUID::fromString)
                .toList();
            
            workspaceDataService.updatePageOrder(projectId, userId, pageIds);
            return ResponseEntity.ok(Map.of("message", "Page order updated"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/pages/{pageId}/move")
    public ResponseEntity<?> movePageToProject(HttpServletRequest request, 
                                             @PathVariable UUID pageId, 
                                             @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            String newProjectIdString = (String) payload.get("newProjectId");
            UUID newProjectId = UUID.fromString(newProjectIdString);
            
            workspaceDataService.movePageToProject(pageId, newProjectId, userId);
            return ResponseEntity.ok(Map.of("message", "Page moved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== TAB OPERATIONS ====================
    
    @GetMapping("/pages/{pageId}/tabs")
    public ResponseEntity<?> getAllTabs(HttpServletRequest request, @PathVariable UUID pageId) {
        try {
            Long userId = getUserIdFromRequest(request);
            List<Tab> tabs = workspaceDataService.getAllTabsForPage(pageId);
            return ResponseEntity.ok(tabs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/pages/{pageId}/tabs")
    public ResponseEntity<?> createTab(HttpServletRequest request, 
                                     @PathVariable UUID pageId, 
                                     @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            String name = (String) payload.get("name");
            String tabType = (String) payload.get("tabType");
            Integer position = payload.get("position") != null ? 
                Integer.valueOf(payload.get("position").toString()) : null;
            
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tab name is required"));
            }
            
            if (tabType == null || tabType.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tab type is required"));
            }
            
            Tab tab = workspaceDataService.createTab(pageId, userId, name.trim(), tabType.trim(), position);
            return ResponseEntity.status(HttpStatus.CREATED).body(tab);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/tabs/{tabId}")
    public ResponseEntity<?> updateTab(HttpServletRequest request, 
                                     @PathVariable UUID tabId, 
                                     @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            String name = (String) payload.get("name");
            String tabType = (String) payload.get("tabType");
            Boolean isActive = (Boolean) payload.get("isActive");
            Boolean isLocked = (Boolean) payload.get("isLocked");
            
            Tab tab = workspaceDataService.updateTab(tabId, userId, name, tabType, isActive, isLocked);
            return ResponseEntity.ok(tab);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/tabs/{tabId}/active")
    public ResponseEntity<?> updateActiveTab(HttpServletRequest request, @PathVariable UUID tabId) {
        try {
            String email = jwtUtil.getUsernameFromToken(request.getHeader("Authorization").substring(7));
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            workspaceDataService.updateActiveTab(tabId, user.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tabs/{tabId}")
    public ResponseEntity<?> deleteTab(HttpServletRequest request, @PathVariable UUID tabId) {
        try {
            Long userId = getUserIdFromRequest(request);
            workspaceDataService.deleteTab(tabId, userId);
            return ResponseEntity.ok(Map.of("message", "Tab deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/tabs/{tabId}/duplicate")
    public ResponseEntity<?> duplicateTab(HttpServletRequest request, 
                                        @PathVariable UUID tabId, 
                                        @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            String newName = (String) payload.get("newName");
            
            if (newName == null || newName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "New tab name is required"));
            }
            
            Tab tab = workspaceDataService.duplicateTab(tabId, userId, newName.trim());
            return ResponseEntity.status(HttpStatus.CREATED).body(tab);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/pages/{pageId}/tabs/reorder")
    public ResponseEntity<?> updateTabOrder(HttpServletRequest request, 
                                          @PathVariable UUID pageId, 
                                          @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            @SuppressWarnings("unchecked")
            List<String> tabIdStrings = (List<String>) payload.get("tabIds");
            
            List<UUID> tabIds = tabIdStrings.stream()
                .map(UUID::fromString)
                .toList();
            
            workspaceDataService.updateTabOrder(pageId, userId, tabIds);
            return ResponseEntity.ok(Map.of("message", "Tab order updated"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update tab order: " + e.getMessage()));
        }
    }

    // ==================== TAB DATA OPERATIONS ====================
    
    @GetMapping("/tabs/{tabId}/data")
    public ResponseEntity<?> getTabData(HttpServletRequest request, @PathVariable UUID tabId) {
        try {
            Long userId = getUserIdFromRequest(request);
            TabData tabData = workspaceDataService.getTabData(tabId, userId);
            return ResponseEntity.ok(tabData);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/tabs/{tabId}/data/replace")
    public ResponseEntity<?> replaceTabData(HttpServletRequest request,
                                            @PathVariable UUID tabId,
                                            @RequestBody Map<String, Object> requestBody) {
        try {
            String email = jwtUtil.getUsernameFromToken(request.getHeader("Authorization").substring(7));
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            @SuppressWarnings("unchecked")
            Map<String, Object> newData = (Map<String, Object>) requestBody.getOrDefault("data", new HashMap<>());
            
            TabData updatedData = workspaceDataService.replaceTabData(tabId, user.getId(), newData);
            return ResponseEntity.ok(updatedData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/tabs/{tabId}/data")
    public ResponseEntity<?> updateTabData(HttpServletRequest request, 
                                         @PathVariable UUID tabId, 
                                         @RequestBody Map<String, Object> payload) {
        try {
            Long userId = getUserIdFromRequest(request);
            @SuppressWarnings("unchecked")
            Map<String, Object> deltaData = (Map<String, Object>) payload.get("data");
            
            if (deltaData == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Delta data is required"));
            }
            
            TabData tabData = workspaceDataService.updateTabData(tabId, userId, deltaData);
            return ResponseEntity.ok(tabData);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    // ==================== ACTIVE STATE MANAGEMENT ====================
    
    @PutMapping("/projects/{projectId}/active")
    public ResponseEntity<?> updateActiveProject(HttpServletRequest request, @PathVariable UUID projectId) {
        try {
            Long userId = getUserIdFromRequest(request);
            workspaceDataService.updateActiveProject(projectId, userId);
            return ResponseEntity.ok(Map.of("message", "Active project updated"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/pages/{pageId}/active")
    public ResponseEntity<?> updateActivePage(HttpServletRequest request, @PathVariable UUID pageId) {
        try {
            Long userId = getUserIdFromRequest(request);
            workspaceDataService.updateActivePage(pageId, userId);
            return ResponseEntity.ok(Map.of("message", "Active page updated"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/active-state")
    public ResponseEntity<?> getLastActiveState(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            Map<String, Object> activeState = workspaceDataService.getLastActiveState(userId);
            return ResponseEntity.ok(activeState);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

} 