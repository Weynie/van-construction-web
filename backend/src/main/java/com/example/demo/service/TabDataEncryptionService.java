package com.example.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

@Service
public class TabDataEncryptionService {
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Value("${app.encryption.secret:default-secret-key-change-in-production}")
    private String applicationSecret;
    
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    private static final int KEY_LENGTH = 32; // 256 bits
    
    /**
     * Encrypt tab data (Map<String, Object>) using user password and application secret
     */
    public String encryptTabData(Map<String, Object> tabData, String userPassword, String userSalt) throws Exception {
        if (tabData == null || tabData.isEmpty()) {
            return null;
        }
        
        // Convert map to JSON string
        String jsonData = objectMapper.writeValueAsString(tabData);
        
        // Generate encryption key from user password + app secret + salt
        byte[] derivedKey = deriveKey(userPassword, userSalt, applicationSecret);
        
        // Generate random IV
        SecureRandom random = new SecureRandom();
        byte[] iv = new byte[GCM_IV_LENGTH];
        random.nextBytes(iv);
        
        // Create secret key
        SecretKey secretKey = new SecretKeySpec(derivedKey, "AES");
        
        // Initialize cipher
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
        
        // Encrypt
        byte[] encrypted = cipher.doFinal(jsonData.getBytes());
        
        // Combine IV and encrypted data
        byte[] combined = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
        
        return Base64.getEncoder().encodeToString(combined);
    }
    
    /**
     * Decrypt tab data using user password and application secret
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> decryptTabData(String encryptedData, String userPassword, String userSalt) throws Exception {
        if (encryptedData == null || encryptedData.isEmpty()) {
            return null;
        }
        
        // Generate decryption key
        byte[] derivedKey = deriveKey(userPassword, userSalt, applicationSecret);
        
        // Decode from Base64
        byte[] combined = Base64.getDecoder().decode(encryptedData);
        
        // Extract IV and encrypted data
        byte[] iv = new byte[GCM_IV_LENGTH];
        byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
        System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
        System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);
        
        // Create secret key
        SecretKey secretKey = new SecretKeySpec(derivedKey, "AES");
        
        // Initialize cipher
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
        
        // Decrypt
        byte[] decrypted = cipher.doFinal(encrypted);
        String jsonData = new String(decrypted);
        
        // Convert JSON string back to map
        return objectMapper.readValue(jsonData, Map.class);
    }
    
    /**
     * Derive encryption key from user password, salt, and application secret
     */
    private byte[] deriveKey(String userPassword, String userSalt, String appSecret) throws Exception {
        // Combine all components
        String combined = userPassword + userSalt + appSecret;
        
        // Use SHA-256 for key derivation
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(combined.getBytes());
        
        // Return first 32 bytes (256 bits) as raw bytes
        byte[] keyBytes = new byte[KEY_LENGTH];
        System.arraycopy(hash, 0, keyBytes, 0, KEY_LENGTH);
        return keyBytes;
    }
    
    /**
     * Generate a random salt for tab data encryption
     */
    public String generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }
} 