package com.example.demo.config;

import com.example.demo.util.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@EnableWebSecurity

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
          // 1) turn off CSRF, form login, and HTTP Basic
          .csrf().disable()
          .formLogin().disable()
          .httpBasic().disable()
          .cors().and()

          // 2) define which endpoints are open
          .authorizeHttpRequests(auth -> auth
            // allow POST to register & login (with or without trailing "/")
            .requestMatchers(HttpMethod.POST,
              "/api/users/register",
              "/api/users/register/**",
              "/api/users/login",
              "/api/users/login/**"
            ).permitAll()

            // allow GET to sediment types endpoint
            .requestMatchers(HttpMethod.GET, "/api/sediment-types", "/api/sediment-types/**").permitAll()

            // allow OPTIONS on everything (for CORS preflight)
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // allow Spring Boot's error dispatch
            .requestMatchers("/error", "/error/**").permitAll()

            // allow actuator endpoints for health checks
            .requestMatchers("/actuator/**").permitAll()

            // everything else needs authentication
            .anyRequest().authenticated()
          )

          // 3) plug in your JWT filter
          .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // expose AuthenticationManager
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    // bcrypt encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
