package com.example.demo.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    // (1) Use a long, random Base64‑encoded secret of at least 512 bits (64 bytes).
    //     You can also externalize this to application.properties.
    private static final String SECRET = "ReplaceWithATrulyRandomBase64StringWithAtLeast64BytesWorthOfData!";
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    // 1 day
    private final long expirationMs = 86_400_000L;

    public String generateToken(String username) {
        return Jwts.builder()
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
            // (2) use the Key + algorithm overload
            .signWith(KEY, SignatureAlgorithm.HS512)
            .compact();
    }

    public String getUsernameFromToken(String token) {
        // (3) use parserBuilder + your Key
        return Jwts
            .parserBuilder()
            .setSigningKey(KEY)
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts
              .parserBuilder()
              .setSigningKey(KEY)
              .build()
              .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // invalid token
            return false;
        }
    }
}
