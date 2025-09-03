package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class ApiKeyEncryptionService {
    
    @Value("${app.encryption.secret:default-secret-key-change-in-production}")
    private String applicationSecret;
    
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    private static final int KEY_LENGTH = 32; // 256 bits
    
    /**
     * Encrypt API key using user password and application secret
     */
    public String encryptApiKey(String apiKey, String userPassword, String userSalt) throws Exception {
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
        byte[] encrypted = cipher.doFinal(apiKey.getBytes());
        
        // Combine IV and encrypted data
        byte[] combined = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
        
        String result = Base64.getEncoder().encodeToString(combined);
        return result;
    }
    
    /**
     * Decrypt API key using user password and application secret
     */
    public String decryptApiKey(String encryptedKey, String userPassword, String userSalt) throws Exception {
        // Generate decryption key
        byte[] derivedKey = deriveKey(userPassword, userSalt, applicationSecret);
        
        // Decode from Base64
        byte[] combined = Base64.getDecoder().decode(encryptedKey);
        
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
        return new String(decrypted);
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
     * Generate a random salt for user
     */
    public String generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }
} 