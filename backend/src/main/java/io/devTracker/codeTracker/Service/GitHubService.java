package io.devTracker.codeTracker.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GitHubService {
    
    @Value("${spring.security.oauth2.client.registration.github.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.github.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate=new RestTemplate();


    // Exchange authorization code for access token
    public String exchangeCodeForToken(String code) throws Exception {
        String tokenUrl = "https://github.com/login/oauth/access_token";
        
        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        
        // Set request body
        String requestBody = String.format(
            "{\"client_id\":\"%s\",\"client_secret\":\"%s\",\"code\":\"%s\"}",
            clientId, clientSecret, code
        );
        
        // Set request entity
        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
        
        // Exchange code for token
        ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);
        
        // Check response status
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            // Parse the response to extract access_token
            String responseBody = response.getBody();
            if (responseBody != null && responseBody.contains("access_token=")) {
                String[] parts = responseBody.split("&");
                for (String part : parts) {
                    if (part.startsWith("access_token=")) {
                        return part.substring("access_token=".length());
                    }
                }
            }
        }
        
        throw new Exception("Failed to exchange code for token");
    }


    // Get user info from GitHub
    public Map<String, Object> getUserInfo(String accessToken) throws Exception {
        String userUrl = "https://api.github.com/user";
        
        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        
        // Set request entity
        HttpEntity<String> request = new HttpEntity<>(headers);
        
        // Get user info
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
            userUrl, 
            HttpMethod.GET, 
            request, 
            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
        );
        
        // Check response status
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return response.getBody();
        }
        
        throw new Exception("Failed to get user info from GitHub");
    }
}
