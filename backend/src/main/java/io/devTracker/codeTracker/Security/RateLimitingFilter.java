package io.devTracker.codeTracker.Security;

import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Service.RateLimitService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import org.springframework.core.Ordered;
public class RateLimitingFilter extends OncePerRequestFilter implements Ordered {

    private final RateLimitService rateLimitService;

    public RateLimitingFilter(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    public int getOrder() {
        return 0;
    }

    /**
     * Get a unique identifier for the current user
     * Uses user ID if authenticated, IP address otherwise
     */
    private String getUserIdentifier(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            return "user:" + user.getId();
        }
        
        // Fallback to IP address for unauthenticated requests
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return "ip:" + ip;
    }

@Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // Skip rate limiting for non-API requests
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get user ID from authentication or use IP address
        String key = getUserIdentifier(request);
        String endpoint = request.getMethod() + ":" + path;

        // Get the appropriate bucket for this user and endpoint
        Bucket bucket = rateLimitService.resolveBucket(key, endpoint);

        // Try to consume a token from the bucket
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            // Request allowed, add rate limit headers
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            response.addHeader("X-Rate-Limit-Limit", String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            response.setStatus(429); // HTTP 429 Too Many Requests
            response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000));
            response.getWriter().write("Rate limit exceeded. Please try again later.");
        }
    }



}
