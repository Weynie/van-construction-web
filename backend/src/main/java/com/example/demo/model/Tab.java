package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tabs")
@Data
@EqualsAndHashCode(exclude = {"page", "tabData"})
public class Tab {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    
    @Column(name = "page_id", nullable = false)
    private UUID pageId;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "tab_type", nullable = false)
    private String tabType; // 'Welcome', 'snow_load', 'wind_load', 'seismic'
    
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;
    
    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "page_id", insertable = false, updatable = false)
    @JsonBackReference("page-tabs")
    private Page page;
    
    @OneToOne(mappedBy = "tab", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("tab-data")
    private TabData tabData;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 