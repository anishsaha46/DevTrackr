package io.devTracker.codeTracker.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.Collections;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
public class JwtAuthenticationFilter extends OncePerRequestFilter implements Ordered {
    
    private int order = Ordered.HIGHEST_PRECEDENCE + 1;

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String googleClientId;

    @Autowired
    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository,
                                 @Value("${spring.security.oauth2.client.registration.google.client-id}") String googleClientId) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.googleClientId = googleClientId;
    }

    @Override
    public int getOrder() {
        return this.order;
    }


    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        logger.debug("Processing JWT authentication for request: {}", request.getRequestURI());

        if (request.getRequestURI().startsWith("/auth/callback")) {
            // Skip JWT validation for Google OAuth2 callback endpoint
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization"); // Get Authorization header
        String token = null;
        String idToken = request.getParameter("id_token"); // Get ID token from request (used in OAuth flow)

        if (idToken != null) {
            try {
                // Build HTTP request to Google to validate the ID token
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest request2 = HttpRequest.newBuilder()
                        .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken))
                        .build();

                // Send request and get the response
                HttpResponse<String> response2 = client.send(request2, HttpResponse.BodyHandlers.ofString());
                String responseBody = response2.body();

                // Parse JSON response to extract user info
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(responseBody);

                String email = root.get("email").asText(); // Extract email from token
                // Extract Google user ID (sub) and use it
                String userIdFromGoogle = root.get("sub").asText();
                logger.debug("Processing Google user with ID: {}", userIdFromGoogle);

                // Check if user exists in DB
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    // Create authentication object and set it in security context
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            user, null, Collections.emptyList());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    logger.warn("User not found for email: {}", email); // Log if user not found
                }
            } catch (Exception e) {
                logger.error("Error validating ID token for client ID: {}", googleClientId, e); // Log errors during token validation
            }
        } else if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7); // Extract JWT token from Authorization header
        }

        if (token != null && jwtUtil.validateJwtToken(token)) {
            // If token is valid, extract user ID from JWT
            String userId = jwtUtil.getUserIdFromJwtToken(token);
            User user = userRepository.findById(userId).orElse(null); // Fetch user from DB
            if (user != null) {
                // Authenticate user and set security context
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        user, null, Collections.emptyList());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response); // Continue with the filter chain
    }
}



