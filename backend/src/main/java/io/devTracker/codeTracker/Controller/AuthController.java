package io.devTracker.codeTracker.Controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    
}
