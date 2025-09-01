package com.example.demo.repository;

import com.example.demo.model.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {
    
    /**
     * Find user preference by user ID
     * @param userId User ID
     * @return Optional containing UserPreference if found
     */
    Optional<UserPreference> findByUserId(Long userId);
    
    /**
     * Check if user preference exists for given user ID
     * @param userId User ID
     * @return true if exists, false otherwise
     */
    boolean existsByUserId(Long userId);
} 