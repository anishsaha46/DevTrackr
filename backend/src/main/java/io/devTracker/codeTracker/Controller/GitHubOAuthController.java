package io.devTracker.codeTracker.Controller;

import io.devTracker.codeTracker.Dto.GitHubOAuthRequest;
import io.devTracker.codeTracker.Dto.GitHubOAuthResponse;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Dto.UserDTO;
import io.devTracker.codeTracker.Service.AuthService;
import io.devTracker.codeTracker.Service.GitHubService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class GitHubOAuthController {

    @Autowired
    private GitHubService githubService;

    @Autowired
    private AuthService authService;

    @PostMapping("/github/callback")
    public ResponseEntity<?> handleGitHubCallback(@RequestBody GitHubOAuthRequest request) {
        try {
            // Exchange authorization code for access token
            String accessToken = githubService.exchangeCodeForToken(request.getCode());
            
            // Get user info from GitHub
            Map<String, Object> githubUser = githubService.getUserInfo(accessToken);
            
            // Extract user details
            String email = (String) githubUser.get("email");
            String username = (String) githubUser.get("login");
            String name = (String) githubUser.get("name");
            
            if (email == null) {
                return ResponseEntity.badRequest().body("Email is required from GitHub");
            }
            
            // Check if user exists, if not create new user
            User user = authService.findOrCreateGitHubUser(email, username, name, accessToken);
            
            // Generate JWT token
            String jwtToken = authService.generateToken(user);
            
            // Return response
            GitHubOAuthResponse response = new GitHubOAuthResponse();
            response.setToken(jwtToken);
            response.setGitHubToken(accessToken);
            response.setUser(new UserDTO(user));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("GitHub authentication failed: " + e.getMessage());
        }
    }
}