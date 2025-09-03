package com.example.demo.repository;

import com.example.demo.model.Tab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TabRepository extends JpaRepository<Tab, UUID> {
    
    List<Tab> findByPageIdOrderByDisplayOrderAsc(UUID pageId);
    
    @Query("SELECT t FROM Tab t WHERE t.pageId = :pageId AND t.displayOrder >= :displayOrder ORDER BY t.displayOrder ASC")
    List<Tab> findByPageIdAndDisplayOrderGreaterThanEqualOrderByDisplayOrderAsc(@Param("pageId") UUID pageId, @Param("displayOrder") Integer displayOrder);
    
    @Query("SELECT COALESCE(MAX(t.displayOrder), -1) FROM Tab t WHERE t.pageId = :pageId")
    Integer findMaxDisplayOrderByPageId(@Param("pageId") UUID pageId);
    
    boolean existsByPageIdAndName(UUID pageId, String name);
    
    @Query("SELECT COUNT(t) FROM Tab t WHERE t.pageId = :pageId")
    Long countByPageId(@Param("pageId") UUID pageId);
    
    @Query("SELECT t FROM Tab t JOIN t.page p JOIN p.project pr WHERE pr.userId = :userId")
    List<Tab> findAllByUserId(@Param("userId") Long userId);
    
    @Query("SELECT t FROM Tab t WHERE t.pageId = :pageId AND t.isActive = true")
    List<Tab> findActiveTabsByPageId(@Param("pageId") UUID pageId);
} 