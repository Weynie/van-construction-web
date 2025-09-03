package com.example.demo.service;

import com.example.demo.model.UserPreference;
import com.example.demo.repository.UserPreferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserPreferenceService {
    
    @Autowired
    private UserPreferenceRepository userPreferenceRepository;
    
    /**
     * Update user's theme preference
     * @param userId User ID
     * @param themePreference Theme preference ("light", "dark", or "system")
     * @return Updated user preference
     */
    @Transactional
    public UserPreference updateThemePreference(Long userId, String themePreference) {
        // Validate theme preference
        if (!isValidThemePreference(themePreference)) {
            throw new IllegalArgumentException("Invalid theme preference: " + themePreference);
        }
        
        // Find existing preference or create new one
        UserPreference userPreference = userPreferenceRepository.findByUserId(userId)
            .orElse(new UserPreference());
        
        userPreference.setUserId(userId);
        userPreference.setThemePreference(themePreference);
        
        return userPreferenceRepository.save(userPreference);
    }
    
    /**
     * Get user's theme preference
     * @param userId User ID
     * @return Theme preference string
     */
    public String getThemePreference(Long userId) {
        UserPreference userPreference = userPreferenceRepository.findByUserId(userId)
            .orElse(null);
        
        return userPreference != null ? userPreference.getThemePreference() : "system";
    }
    
    /**
     * Validate theme preference value
     * @param themePreference Theme preference to validate
     * @return true if valid, false otherwise
     */
    private boolean isValidThemePreference(String themePreference) {
        return themePreference != null && 
               (themePreference.equals("light") || 
                themePreference.equals("dark") || 
                themePreference.equals("system"));
    }
} 