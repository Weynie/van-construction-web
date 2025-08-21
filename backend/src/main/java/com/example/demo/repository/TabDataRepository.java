package com.example.demo.repository;

import com.example.demo.model.TabData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TabDataRepository extends JpaRepository<TabData, UUID> {
    
    @Query("SELECT td FROM TabData td JOIN td.tab t JOIN t.page p JOIN p.project pr WHERE pr.userId = :userId")
    List<TabData> findAllByUserId(@Param("userId") Long userId);
    
    @Query("SELECT td FROM TabData td WHERE td.tabId IN :tabIds")
    List<TabData> findByTabIdIn(@Param("tabIds") List<UUID> tabIds);
    
    boolean existsByTabId(UUID tabId);
} 