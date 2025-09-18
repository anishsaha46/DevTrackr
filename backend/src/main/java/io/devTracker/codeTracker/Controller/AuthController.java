package io.devTracker.codeTracker.Controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Dto.UserDTO;
import io.devTracker.codeTracker.Service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    // Logger instance for logging information, warnings, or errors
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    // Dependency injection of the AuthService to handle authentication-related logic
    @Autowired
    public AuthService authService;

    // Token validation endpoint
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && 
            !(authentication instanceof AnonymousAuthenticationToken)) {
            return ResponseEntity.ok().body(Map.of(
                "valid", true,
                "username", authentication.getName()
            ));
        }
        
        return ResponseEntity.status(401).body(Map.of(
            "valid", false,
            "message", "Invalid or expired token"
        ));
    }

    // Endpoint for user registration: POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<UserDTO.RegisterResponse> register(@RequestBody UserDTO.registerRequest req) {
        // Logging the incoming registration request
        logger.info("Register request for email: {}", req.email());

        // Call to the service layer to handle user registration
        authService.registerUser(req.email(), req.password());

        // Prepare the success response message
        UserDTO.RegisterResponse response = new UserDTO.RegisterResponse("User registered successfully");

        // Logging the response
        logger.info("Returning response for register: {}", response);

        // Return response with HTTP 201 Created status
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Endpoint for user login: POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserDTO.loginRequest req) {
        // Logging the incoming login request
        logger.info("Login request for email: {}", req.email());

        // Call to the service to authenticate user and return a token (if successful)
        Optional<String> tokenOptional = authService.loginUser(req.email(), req.password());

        // If credentials are invalid (no token returned), respond with 401 Unauthorized
        if (tokenOptional.isEmpty()) {
            logger.warn("Invalid credentials for email: {}", req.email());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }

        // On success, wrap the token in a response DTO
        UserDTO.LoginResponse response = new UserDTO.LoginResponse(tokenOptional.get());

        // Logging the success response
        logger.info("Returning response for login: {}", response);

        // Return the token as JSON with HTTP 200 OK
        return ResponseEntity.ok(response);
    }

    // Endpoint to fetch details of the currently authenticated user: GET /api/auth/me
    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal User user) {
        // The @AuthenticationPrincipal annotation automatically injects the currently logged-in user
        // Return user details with HTTP 200 OK
        return ResponseEntity.ok(user);
    }
    
}
