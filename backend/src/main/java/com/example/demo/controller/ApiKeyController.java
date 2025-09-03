package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.model.UserApiKey;
import com.example.demo.repository.UserApiKeyRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ApiKeyEncryptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ApiKeyController {

    @Autowired
    private UserApiKeyRepository userApiKeyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApiKeyEncryptionService encryptionService;

    @Autowired
    private PasswordEncoder passwordEncoder;



    /**
     * Store API key for user
     */
    @PostMapping("/{userId}/api-key")
    @Transactional
    public ResponseEntity<?> storeApiKey(@PathVariable Long userId, @RequestBody Map<String, Object> request) {
        try {
            String apiKey = (String) request.get("apiKey");
            String userPassword = (String) request.get("userPassword");
            Boolean rememberKey = (Boolean) request.get("rememberKey");

            if (apiKey == null || userPassword == null || rememberKey == null) {
                return ResponseEntity.badRequest().body("Missing required fields: apiKey, userPassword, rememberKey");
            }

            // Find user
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();

            // Verify user password
            if (!passwordEncoder.matches(userPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid password");
            }

            if (rememberKey) {
                // Generate salt for this user
                String salt = encryptionService.generateSalt();

                // Encrypt API key
                String encryptedKey = encryptionService.encryptApiKey(apiKey, userPassword, salt);

                // Save or update API key
                Optional<UserApiKey> existingKey = userApiKeyRepository.findByUserId(userId);
                if (existingKey.isPresent()) {
                    // Update existing key
                    UserApiKey userApiKey = existingKey.get();
                    userApiKey.setEncryptedData(encryptedKey);
                    userApiKey.setDataSalt(salt);
                    userApiKey.setIsPersistent(true);
                    userApiKey.setIsActive(true);
                    userApiKey.setUpdatedAt(LocalDateTime.now());
                    userApiKey.setLastAccessedAt(LocalDateTime.now());
                    userApiKeyRepository.save(userApiKey);
                } else {
                    // Create new key
                    UserApiKey userApiKey = new UserApiKey();
                    userApiKey.setUserId(userId);
                    userApiKey.setEncryptedData(encryptedKey);
                    userApiKey.setDataSalt(salt);
                    userApiKey.setIsPersistent(true);
                    userApiKey.setIsActive(true);
                    userApiKey.setLastAccessedAt(LocalDateTime.now());
                    userApiKeyRepository.save(userApiKey);
                }
                return ResponseEntity.ok(Map.of(
                    "message", "API key stored successfully",
                    "hasStoredKey", true
                ));
            } else {
                // User doesn't want to remember key, delete if exists
                userApiKeyRepository.deleteByUserId(userId);
                return ResponseEntity.ok(Map.of(
                    "message", "API key not stored",
                    "hasStoredKey", false
                ));
            }

        } catch (Exception e) {
            System.err.println("Error storing API key: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to store API key. Please try again.");
        }
    }

    /**
     * Get stored API key for user (requires password for decryption)
     */
    @GetMapping("/{userId}/api-key")
    public ResponseEntity<?> getApiKey(@PathVariable Long userId, @RequestParam String userPassword) {
        try {
            // Find user
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();

            // Verify user password
            if (!passwordEncoder.matches(userPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid password");
            }

            // Find stored API key
            Optional<UserApiKey> userApiKeyOpt = userApiKeyRepository.findByUserIdAndIsActiveTrue(userId);
            if (userApiKeyOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "hasStoredKey", false,
                    "message", "No API key stored"
                ));
            }

            UserApiKey userApiKey = userApiKeyOpt.get();

            // Decrypt API key
            String decryptedKey = encryptionService.decryptApiKey(
                userApiKey.getEncryptedData(),
                userPassword,
                userApiKey.getDataSalt()
            );

            // Update last accessed timestamp
            userApiKeyRepository.updateLastUsed(userId, LocalDateTime.now());

            return ResponseEntity.ok(Map.of(
                "hasStoredKey", true,
                "apiKey", decryptedKey,
                "lastUsedAt", userApiKey.getLastAccessedAt(),
                "createdAt", userApiKey.getCreatedAt()
            ));

        } catch (Exception e) {
            System.err.println("Error retrieving API key: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to retrieve API key. Please try again.");
        }
    }

    /**
     * Get stored API key for authenticated user (no password required)
     * This endpoint returns the encrypted key that can be used directly with external APIs
     */
    @GetMapping("/{userId}/api-key/retrieve")
    public ResponseEntity<?> retrieveApiKey(@PathVariable Long userId) {
        try {
            // Find user
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Find stored API key
            Optional<UserApiKey> userApiKeyOpt = userApiKeyRepository.findByUserIdAndIsActiveTrue(userId);
            if (userApiKeyOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "hasStoredKey", false,
                    "message", "No API key stored"
                ));
            }

            UserApiKey userApiKey = userApiKeyOpt.get();

            // Update last accessed timestamp
            userApiKeyRepository.updateLastUsed(userId, LocalDateTime.now());

            // Return status indicating that password is required for decryption
            return ResponseEntity.ok(Map.of(
                "hasStoredKey", true,
                "requiresPassword", true,
                "message", "Password required to decrypt stored API key",
                "lastUsedAt", userApiKey.getLastAccessedAt(),
                "createdAt", userApiKey.getCreatedAt()
            ));

        } catch (Exception e) {
            System.err.println("Error retrieving API key: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to retrieve API key. Please try again.");
        }
    }



    /**
     * Delete stored API key for user
     */
    @DeleteMapping("/{userId}/api-key")
    @Transactional
    public ResponseEntity<?> deleteApiKey(@PathVariable Long userId, @RequestBody Map<String, Object> request) {
        try {
            String userPassword = (String) request.get("userPassword");
            
            if (userPassword == null) {
                return ResponseEntity.badRequest().body("Missing required field: userPassword");
            }
            
            // Find user
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();

            // Verify user password
            if (!passwordEncoder.matches(userPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid password");
            }

            // Delete API key
            userApiKeyRepository.deleteByUserId(userId);

            return ResponseEntity.ok(Map.of(
                "message", "API key deleted successfully",
                "hasStoredKey", false
            ));

        } catch (Exception e) {
            System.err.println("Error deleting API key: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to delete API key. Please try again.");
        }
    }

    /**
     * Check if user has stored API key
     */
    @GetMapping("/{userId}/api-key/status")
    public ResponseEntity<?> getApiKeyStatus(@PathVariable Long userId) {
        try {
            boolean hasStoredKey = userApiKeyRepository.existsByUserId(userId);
            
            if (hasStoredKey) {
                Optional<UserApiKey> userApiKeyOpt = userApiKeyRepository.findByUserIdAndIsActiveTrue(userId);
                if (userApiKeyOpt.isPresent()) {
                    UserApiKey userApiKey = userApiKeyOpt.get();
                    return ResponseEntity.ok(Map.of(
                        "hasStoredKey", true,
                        "lastUsedAt", userApiKey.getLastAccessedAt(),
                        "createdAt", userApiKey.getCreatedAt()
                    ));
                }
            }

            return ResponseEntity.ok(Map.of("hasStoredKey", false));

        } catch (Exception e) {
            System.err.println("Error checking API key status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to check API key status.");
        }
    }
    

} 