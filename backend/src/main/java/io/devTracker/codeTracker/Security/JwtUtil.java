package io.devTracker.codeTracker.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component // Marks this class as a Spring component for dependency injection
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecretString; // Secret key from application properties

    @Value("${jwt.expiration}")
    private long jwtExpirationMs; // Token expiration time in milliseconds

    private SecretKey jwtSecret; // SecretKey object used for signing JWTs

    @PostConstruct
    public void init() {
        // Convert the secret string into a SecretKey after dependency injection
        this.jwtSecret = Keys.hmacShaKeyFor(jwtSecretString.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String userId, String email) {
        Date now = new Date(); // Current time
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs); // Token expiration time

        // Build and return a signed JWT with user ID and email
        return Jwts.builder()
                .setSubject(userId) // Set the subject (user ID)
                .claim("email", email) // Add email as a custom claim
                .setIssuedAt(now) // Set issue time
                .setExpiration(expiryDate) // Set expiration time
                .signWith(jwtSecret) // Sign the token with the secret key
                .compact(); // Finalize the token creation
    }

    public boolean validateJwtToken(String token) {
        try {
            // Parse and validate the token's signature and structure
            Jwts.parserBuilder()
            .setSigningKey(jwtSecret)
            .build()
            .parseClaimsJws(token);
            return true; // Token is valid
        } catch (JwtException | IllegalArgumentException e) {
            // Invalid token: signature, format, or expiration issue
            return false;
        }
    }

    private Claims getClaims(String token) {
        // Extract and return the claims (payload) from the JWT
        return Jwts.parserBuilder()
                .setSigningKey(jwtSecret)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getUserIdFromJwtToken(String token) {
        // Retrieve the subject (user ID) from the token
        return getClaims(token).getSubject();
    }

    public String getEmailFromJwtToken(String token) {
        // Retrieve the email claim from the token
        return getClaims(token).get("email", String.class);
    }
}


