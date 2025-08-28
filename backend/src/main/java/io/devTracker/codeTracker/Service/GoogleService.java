package io.devTracker.codeTracker.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class GoogleService {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate=new RestTemplate();

        public String exchangeCodeForToken(String code) throws Exception {
        String tokenUrl = "https://oauth2.googleapis.com/token";
        
        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        // Set request body
        String requestBody = String.format(
            "client_id=%s&client_secret=%s&code=%s&grant_type=authorization_code&redirect_uri=http://localhost:3000/auth/google/callback",
            clientId, clientSecret, code
        );

        // Set request entity
        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
        
        // Exchange code for token
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, request, 
            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
        
        // Check response status
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> responseBody = response.getBody();
            String accessToken = responseBody != null ? (String) responseBody.get("access_token") : null;
            if (accessToken == null) {
                throw new Exception("Access token not found in response");
            }
            return accessToken;
        }
        
        throw new Exception("Failed to exchange code for token");
    }
    
}
