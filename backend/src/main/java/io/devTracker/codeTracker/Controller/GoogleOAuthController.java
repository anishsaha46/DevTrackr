package io.devTracker.codeTracker.Controller;

import io.devTracker.codeTracker.Dto.GoogleOAuthRequest;
import io.devTracker.codeTracker.Dto.GoogleOAuthResponse;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Dto.UserDTO;
import io.devTracker.codeTracker.Service.AuthService;
import io.devTracker.codeTracker.Service.GoogleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class GoogleOAuthController {

    @Autowired
    private GoogleService googleService;

    @Autowired
    private AuthService authService;

    @PostMapping("/google/callback")
    public ResponseEntity<?> handleGoogleCallback(@RequestBody GoogleOAuthRequest request) {
        try {
            // Exchange authorization code for access token
            String accessToken = googleService.exchangeCodeForToken(request.getCode());
            
            // Get user info from Google
            Map<String, Object> googleUser = googleService.getUserInfo(accessToken);
            
            // Extract user details
            String email = (String) googleUser.get("email");
            String name = (String) googleUser.get("name");
            String picture = (String) googleUser.get("picture");
            
            if (email == null) {
                return ResponseEntity.badRequest().body("Email is required from Google");
            }
            
            // Check if user exists, if not create new user
            User user = authService.findOrCreateGoogleUser(email, name, picture, accessToken);
            
            // Generate JWT token
            String jwtToken = authService.generateToken(user);
            
            // Return response
            GoogleOAuthResponse response = new GoogleOAuthResponse();
            response.setToken(jwtToken);
            response.setGoogleToken(accessToken);
            response.setUser(new UserDTO(user));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Google authentication failed: " + e.getMessage());
        }
    }
}
