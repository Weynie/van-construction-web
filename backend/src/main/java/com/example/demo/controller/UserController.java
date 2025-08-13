package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // at least 8 chars, one uppercase and one digit
    private static final Pattern PASSWORD_PATTERN =
        Pattern.compile("^(?=.*[A-Z])(?=.*[0-9]).{8,}$");

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody Map<String, String> body) {
        try {
            String email           = body.get("email");
            String username        = body.get("username");
            String password        = body.get("password");
            String confirmPassword = body.get("confirmPassword");

            if (email == null || username == null || password == null || confirmPassword == null) {
                return ResponseEntity
                    .badRequest()
                    .body("Missing fields. Provide email, username, password, and confirmPassword.");
            }

            if (!password.equals(confirmPassword)) {
                return ResponseEntity
                    .badRequest()
                    .body("Passwords do not match.");
            }

            if (!PASSWORD_PATTERN.matcher(password).matches()) {
                return ResponseEntity
                    .badRequest()
                    .body("Password must be at least 8 characters with at least one uppercase letter and one number.");
            }

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Registration failed. Email already exists.");
            }

            User user = new User();
            user.setEmail(email);
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);

            return ResponseEntity.ok("User registered successfully.");
        } catch (Exception e) {
            System.err.println("Registration error: " + e.getMessage());
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Registration failed. Please try again.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email    = body.get("email");
            String password = body.get("password");

            if (email == null || password == null) {
                return ResponseEntity
                    .badRequest()
                    .body("Missing fields. Provide email and password.");
            }

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (passwordEncoder.matches(password, user.getPassword())) {
                    String token    = jwtUtil.generateToken(email);
                    String username = user.getUsername();
                    
                    System.out.println("Login successful for user: " + email);
                    
                    return ResponseEntity.ok(Map.of(
                      "token",    token,
                      "username", username,
                      "userId",   user.getId()
                    ));
                } else {
                    System.out.println("Invalid password for user: " + email);
                }
            } else {
                System.out.println("User not found: " + email);
            }

            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body("Invalid email or password.");
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Login failed. Please try again.");
        }
    }
    
    @GetMapping("/{userId}/profile")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {
        try {
            // Find the user by ID (primary key)
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            return ResponseEntity.ok(Map.of(
                "userId", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail()
            ));
            
        } catch (Exception e) {
            System.err.println("Profile fetch error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch profile. Please try again.");
        }
    }

    @PutMapping("/{userId}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        try {
            String newUsername = body.get("username");
            
            if (newUsername == null || newUsername.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Username cannot be empty.");
            }
            
            String trimmedUsername = newUsername.trim();
            
            // Find the current user by ID (primary key)
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            // If username is not changing, just return success
            if (trimmedUsername.equals(user.getUsername())) {
                return ResponseEntity.ok(Map.of(
                    "message", "Username unchanged",
                    "username", user.getUsername()
                ));
            }
            
            // Update the username (usernames can be duplicated, so no duplicate check needed)
            user.setUsername(trimmedUsername);
            userRepository.save(user);
            
            System.out.println("Profile updated for user ID: " + userId + ", new username: " + trimmedUsername);
            
            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "username", user.getUsername()
            ));
            
        } catch (Exception e) {
            System.err.println("Profile update error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to update profile. Please try again.");
        }
    }
}
