package io.devTracker.codeTracker.Config;

import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.UserRepository;
import io.devTracker.codeTracker.Security.JwtUtil;
import io.devTracker.codeTracker.Security.JwtAuthenticationFilter;

// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.AuthenticationException;
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

// import java.io.IOException;
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

@Bean
AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler() {
    return (request, response, authentication) -> {
        // Cast authentication principal to OAuth2 user
        DefaultOAuth2User oAuth2User = (DefaultOAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // Get provider (e.g., "google", "github")
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();

        // Variables to hold extracted email and name
        final String email;
        final String name;

        // Special handling for GitHub
        if ("github".equals(registrationId)) {
            // GitHub may not provide email directly
            String tempEmail = attributes.containsKey("email") && attributes.get("email") != null
                ? attributes.get("email").toString()
                : "";

            // If email is missing, construct a fake one using login
            if (tempEmail.isEmpty() && attributes.containsKey("login")) {
                tempEmail = attributes.get("login") + "@github.com";
            }
            email = tempEmail;

            // Try to get the name
            String tempName = attributes.containsKey("name") && attributes.get("name") != null
                ? attributes.get("name").toString()
                : "";

            // If name is missing, use login as the name
            if (tempName.isEmpty() && attributes.containsKey("login")) {
                tempName = attributes.get("login").toString();
            }
            name = tempName;

        } else {
            // For other providers like Google, use standard attributes
            email = attributes.getOrDefault("email", "").toString();
            name = attributes.getOrDefault("name", "").toString();
        }

        // Log the retrieved email
        logger.info("OAuth2 SUCCESS: User email retrieved from provider {}: {}", registrationId, email);

        // Check if the user already exists in the database
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                // If not found, create a new user
                logger.info("User not found in DB. Creating new user for email: {}", email);
                User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .provider(registrationId)
                    .password("") // No password needed for OAuth users
                    .build();
                return userRepository.save(newUser);
            });

        // If the user exists but has outdated info, update it
        if (!user.getProvider().equals(registrationId) || (name != null && !name.equals(user.getName()))) {
            user.setProvider(registrationId);
            user.setName(name);
            user = userRepository.save(user);
        }

        // Generate a JWT token for the user
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        // Redirect to the frontend with the JWT token
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString("http://localhost:3000/auth/callback");
        uriBuilder.queryParam("token", token);
        String redirectUrl = uriBuilder.build().toUriString();

        logger.info("Redirecting to frontend: {}", redirectUrl);
        response.sendRedirect(redirectUrl);
    };
}

@Bean
AuthenticationFailureHandler oAuth2AuthenticationFailureHandler() {
    return (request, response, exception) -> {
        // Log the exception
        logger.error("OAuth2 Authentication Failure: {}", exception.getMessage(), exception);

        // Redirect user back to the frontend login page with error message
        String redirectUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/login")
            .queryParam("error", "Authentication Failed: " + exception.getLocalizedMessage())
            .build().toUriString();

        response.sendRedirect(redirectUrl);
    };
}


@Bean
CorsConfigurationSource corsConfigurationSource() {
    // Create a new CORS configuration
    CorsConfiguration configuration = new CorsConfiguration();

    // Allow requests from this origin (e.g., your React frontend)
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));

    // Allow these HTTP methods
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

    // Allow these headers
    configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Auth-Token"));

    // Allow cookies and credentials (important if you're using cookies)
    configuration.setAllowCredentials(true);

    // Register the config for all endpoints
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);

    return source;
}

@Bean
PasswordEncoder passwordEncoder(){
    return new BCryptPasswordEncoder();
}

}
