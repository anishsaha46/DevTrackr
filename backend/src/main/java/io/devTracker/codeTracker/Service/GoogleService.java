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
    String tokenUrl = "https://oauth2.googleapis.com/token"; // Google OAuth2 token endpoint

    HttpHeaders headers = new HttpHeaders(); // Create HTTP headers
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED); // Set content type to URL-encoded form data

    String requestBody = String.format(
        "client_id=%s&client_secret=%s&code=%s&grant_type=authorization_code&redirect_uri=http://localhost:3000/auth/google/callback",
        clientId, clientSecret, code
    ); // Build request body with client credentials and authorization code

    HttpEntity<String> request = new HttpEntity<>(requestBody, headers); // Create HTTP request with body and headers

    ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
        tokenUrl, HttpMethod.POST, request,
        new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
    ); // Send POST request to exchange code for access token

    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
        Map<String, Object> responseBody = response.getBody(); // Get response body
        String accessToken = responseBody != null && responseBody.get("access_token") != null ? (String) responseBody.get("access_token") : null;
        if (accessToken == null) {
            throw new Exception("Access token not found in response");
        }
        return accessToken; // Return the access token from response
    }

    throw new Exception("Failed to exchange code for token"); // Throw exception if token exchange fails
}

    
    public Map<String, Object> getUserInfo(String accessToken) throws Exception {
    String userUrl = "https://www.googleapis.com/oauth2/v2/userinfo"; // Google API endpoint for user info
    
    HttpHeaders headers = new HttpHeaders(); // Create HTTP headers
    headers.set("Authorization", "Bearer " + accessToken); // Set the Authorization header with the access token
    
    HttpEntity<String> request = new HttpEntity<>(headers); // Create the HTTP request with headers
    
    ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
        userUrl, 
        HttpMethod.GET, 
        request, 
        new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {} // Define response type
    ); // Send the GET request to Google API and receive the response
    
    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
        return response.getBody(); // Return user info if response is successful
    }
    
    throw new Exception("Failed to get user info from Google"); // Throw exception if response is not successful
}

}
