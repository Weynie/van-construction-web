package com.example.demo.repository;

import com.example.demo.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    
    List<Project> findByUserIdOrderByDisplayOrderAsc(Long userId);
    
    @Query("SELECT p FROM Project p WHERE p.userId = :userId AND p.displayOrder >= :displayOrder ORDER BY p.displayOrder ASC")
    List<Project> findByUserIdAndDisplayOrderGreaterThanEqualOrderByDisplayOrderAsc(@Param("userId") Long userId, @Param("displayOrder") Integer displayOrder);
    
    @Query("SELECT COALESCE(MAX(p.displayOrder), -1) FROM Project p WHERE p.userId = :userId")
    Integer findMaxDisplayOrderByUserId(@Param("userId") Long userId);
    
    boolean existsByUserIdAndName(Long userId, String name);
    
    @Query("SELECT COUNT(p) FROM Project p WHERE p.userId = :userId")
    Long countByUserId(@Param("userId") Long userId);
    
    @Query("SELECT p FROM Project p WHERE p.userId = :userId AND p.isActive = true")
    Project findByUserIdAndIsActiveTrue(@Param("userId") Long userId);
} 