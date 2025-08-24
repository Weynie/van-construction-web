package com.example.demo.repository;

import com.example.demo.model.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PageRepository extends JpaRepository<Page, UUID> {
    
    List<Page> findByProjectIdOrderByDisplayOrderAsc(UUID projectId);
    
    @Query("SELECT p FROM Page p WHERE p.projectId = :projectId AND p.displayOrder >= :displayOrder ORDER BY p.displayOrder ASC")
    List<Page> findByProjectIdAndDisplayOrderGreaterThanEqualOrderByDisplayOrderAsc(@Param("projectId") UUID projectId, @Param("displayOrder") Integer displayOrder);
    
    @Query("SELECT COALESCE(MAX(p.displayOrder), -1) FROM Page p WHERE p.projectId = :projectId")
    Integer findMaxDisplayOrderByProjectId(@Param("projectId") UUID projectId);
    
    boolean existsByProjectIdAndName(UUID projectId, String name);
    
    @Query("SELECT COUNT(p) FROM Page p WHERE p.projectId = :projectId")
    Long countByProjectId(@Param("projectId") UUID projectId);
    
    @Query("SELECT p FROM Page p JOIN p.project pr WHERE pr.userId = :userId")
    List<Page> findAllByUserId(@Param("userId") Long userId);
    
    @Query("SELECT p FROM Page p WHERE p.projectId = :projectId AND p.isActive = true")
    Page findByProjectIdAndIsActiveTrue(@Param("projectId") UUID projectId);
} 