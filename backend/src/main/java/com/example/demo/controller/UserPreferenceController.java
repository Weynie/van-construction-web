package com.example.demo.controller;

import com.example.demo.service.UserPreferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/preferences")
@CrossOrigin(origins = "*")
public class UserPreferenceController {
    
    @Autowired
    private UserPreferenceService userPreferenceService;
    
    /**
     * Update user's theme preference
     * @param userId User ID (from path)
     * @param request Request body containing theme preference
     * @return Success response
     */
    @PutMapping("/{userId}/theme")
    public ResponseEntity<?> updateThemePreference(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        
        try {
            String themePreference = request.get("themePreference");
            if (themePreference == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "themePreference is required"));
            }
            
            userPreferenceService.updateThemePreference(userId, themePreference);
            
            return ResponseEntity.ok(Map.of(
                "message", "Theme preference updated successfully",
                "themePreference", themePreference
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get user's theme preference
     * @param userId User ID (from path)
     * @return Theme preference
     */
    @GetMapping("/{userId}/theme")
    public ResponseEntity<?> getThemePreference(@PathVariable Long userId) {
        
        try {
            String themePreference = userPreferenceService.getThemePreference(userId);
            
            return ResponseEntity.ok(Map.of(
                "themePreference", themePreference
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
} 