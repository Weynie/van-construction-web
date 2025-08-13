package com.example.demo.repository;

import com.example.demo.model.UserApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserApiKeyRepository extends JpaRepository<UserApiKey, Long> {
    
    Optional<UserApiKey> findByUserId(Long userId);
    
    Optional<UserApiKey> findByUserIdAndIsActiveTrue(Long userId);
    
    @Modifying
    @Transactional
    @Query("UPDATE UserApiKey u SET u.lastAccessedAt = :lastAccessedAt WHERE u.userId = :userId")
    void updateLastUsed(@Param("userId") Long userId, @Param("lastAccessedAt") LocalDateTime lastAccessedAt);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM UserApiKey u WHERE u.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
    
    boolean existsByUserId(Long userId);
} 