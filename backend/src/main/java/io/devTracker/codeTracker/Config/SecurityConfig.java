package io.devTracker.codeTracker.Config;

import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.UserRepository;
import io.devTracker.codeTracker.Security.JwtUtil;
import io.devTracker.codeTracker.Security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;


@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // Enable CORS and use custom configuration
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        
        // Disable CSRF protection (not needed for stateless APIs using JWT)
        .csrf(csrf -> csrf.disable())
        
        // Make the session stateless since we are using JWT for authentication
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        
        // Define which requests are allowed without authentication
        .authorizeHttpRequests(auth -> auth
            // Permit all requests to auth-related endpoints (login, oauth, etc.)
            .requestMatchers("/api/auth/**", "/login/oauth2/**", "/oauth2/**").permitAll()
            
            // All other requests must be authenticated
            .anyRequest().authenticated()
        )
        
        // Configure OAuth2 login success and failure handlers
        .oauth2Login(oauth2 -> oauth2
            .successHandler(oAuth2AuthenticationSuccessHandler())
            .failureHandler(oAuth2AuthenticationFailureHandler())
        );

    // Add the JWT filter before the UsernamePasswordAuthenticationFilter
    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    // Build and return the security filter chain
    return http.build();
}

}
