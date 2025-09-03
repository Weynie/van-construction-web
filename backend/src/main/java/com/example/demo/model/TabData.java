package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tab_data")
@Data
@EqualsAndHashCode(exclude = {"tab"})
public class TabData {
    @Id
    @Column(name = "tab_id", nullable = false)
    private UUID tabId;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", columnDefinition = "jsonb")
    private Map<String, Object> data;
    
    // Encryption support fields
    @Column(name = "encrypted_data", columnDefinition = "text")
    private String encryptedData;
    
    @Column(name = "data_salt")
    private String dataSalt;
    
    @Column(name = "is_encrypted", nullable = false)
    private Boolean isEncrypted = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tab_id", insertable = false, updatable = false)
    @JsonBackReference("tab-data")
    private Tab tab;
    
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