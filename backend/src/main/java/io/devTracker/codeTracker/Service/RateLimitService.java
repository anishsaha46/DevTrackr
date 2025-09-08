package io.devTracker.codeTracker.Service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    // Toggle to enable/disable rate limiting via configuration
    @Value("${rate-limit.enabled:true}")
    private boolean enabled;

    // Rate limit configuration values (capacity and refill period) for various API endpoints

    @Value("${rate-limit.activities.capacity:20}")
    private int activitiesCapacity;
    @Value("${rate-limit.activities.refill-period:60}")
    private int activitiesRefillPeriod;

    @Value("${rate-limit.activities-batch.capacity:10}")
    private int activitiesBatchCapacity;
    @Value("${rate-limit.activities-batch.refill-period:60}")
    private int activitiesBatchRefillPeriod;

    @Value("${rate-limit.activities-get.capacity:30}")
    private int activitiesGetCapacity;
    @Value("${rate-limit.activities-get.refill-period:60}")
    private int activitiesGetRefillPeriod;

    @Value("${rate-limit.projects-activities.capacity:30}")
    private int projectsActivitiesCapacity;
    @Value("${rate-limit.projects-activities.refill-period:60}")
    private int projectsActivitiesRefillPeriod;

    @Value("${rate-limit.projects.capacity:60}")
    private int projectsCapacity;
    @Value("${rate-limit.projects.refill-period:60}")
    private int projectsRefillPeriod;

    @Value("${rate-limit.overview.capacity:60}")
    private int overviewCapacity;
    @Value("${rate-limit.overview.refill-period:60}")
    private int overviewRefillPeriod;

    @Value("${rate-limit.auth-device.capacity:5}")
    private int authDeviceCapacity;
    @Value("${rate-limit.auth-device.refill-period:60}")
    private int authDeviceRefillPeriod;

    @Value("${rate-limit.auth-device-confirm.capacity:5}")
    private int authDeviceConfirmCapacity;
    @Value("${rate-limit.auth-device-confirm.refill-period:60}")
    private int authDeviceConfirmRefillPeriod;

    // A concurrent map to store and retrieve rate limit buckets for each (user + endpoint) combination
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Resolves (or creates) a rate limit bucket for a user and a specific endpoint.
     * Each user-endpoint pair has its own rate limiting bucket.
     *
     * @param key      Unique user identifier (e.g., user ID or IP address)
     * @param endpoint API endpoint being accessed
     * @return Bucket that enforces the rate limit
     */
    public Bucket resolveBucket(String key, String endpoint) {
        if (!enabled) {
            // If rate limiting is disabled, return an effectively unlimited bucket
            return Bucket.builder()
                .addLimit(Bandwidth.classic(Long.MAX_VALUE, Refill.greedy(Long.MAX_VALUE, Duration.ofNanos(1))))
                .build();
        }

        // Retrieve existing bucket or create a new one for the user-endpoint pair
        return buckets.computeIfAbsent(key + "-" + endpoint, k -> createNewBucket(endpoint));
    }



    /**
     * Creates a new rate limiting bucket based on the endpoint being accessed.
     * Each endpoint has specific rate limit settings.
     *
     * @param endpoint API endpoint string
     * @return Configured Bucket instance
     */

    private Bucket createNewBucket(String endpoint) {
        Bandwidth limit;

        // Define rate limits based on endpoint pattern matching

        if (endpoint.startsWith("/api/activity") && endpoint.endsWith("/batch")) {
            // Batch activity posting
            limit = Bandwidth.classic(
                activitiesBatchCapacity,
                Refill.intervally(activitiesBatchCapacity, Duration.ofSeconds(activitiesBatchRefillPeriod))
            );

        } else if (endpoint.startsWith("/api/activity") && endpoint.contains("POST")) {
            // Individual activity posting
            limit = Bandwidth.classic(
                activitiesCapacity,
                Refill.intervally(activitiesCapacity, Duration.ofSeconds(activitiesRefillPeriod))
            );

        } else if (endpoint.startsWith("/api/activity") && endpoint.contains("GET")) {
            // Fetching activities
            limit = Bandwidth.classic(
                activitiesGetCapacity,
                Refill.intervally(activitiesGetCapacity, Duration.ofSeconds(activitiesGetRefillPeriod))
            );

        } else if (endpoint.startsWith("/api/projects") && endpoint.contains("activities")) {
            // Accessing project-related activities
            limit = Bandwidth.classic(
                projectsActivitiesCapacity,
                Refill.intervally(projectsActivitiesCapacity, Duration.ofSeconds(projectsActivitiesRefillPeriod))
            );

        } else if (endpoint.startsWith("/api/projects")) {
            // General project operations
            limit = Bandwidth.classic(
                projectsCapacity,
                Refill.intervally(projectsCapacity, Duration.ofSeconds(projectsRefillPeriod))
            );

        } else if (endpoint.startsWith("/api/overview")) {
            // Dashboard or overview-related data
            limit = Bandwidth.classic(
                overviewCapacity,
                Refill.intervally(overviewCapacity, Duration.ofSeconds(overviewRefillPeriod))
            );

        } else if (endpoint.startsWith("/api/auth/device") && !endpoint.contains("confirm")) {
            // Authentication using a device
            limit = Bandwidth.classic(
                authDeviceCapacity,
                Refill.intervally(authDeviceCapacity, Duration.ofSeconds(authDeviceRefillPeriod))
            );

        } else if (endpoint.startsWith("/api/auth/device/confirm")) {
            // Confirming device authentication
            limit = Bandwidth.classic(
                authDeviceConfirmCapacity,
                Refill.intervally(authDeviceConfirmCapacity, Duration.ofSeconds(authDeviceConfirmRefillPeriod))
            );
            
        } else {
            // Default fallback rate limit for unspecified endpoints
            limit = Bandwidth.classic(
                30,
                Refill.intervally(30, Duration.ofSeconds(60))
            );
        }

        // Build and return the rate limit bucket
        return Bucket.builder().addLimit(limit).build();
    }
}
