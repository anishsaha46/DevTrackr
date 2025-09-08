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
public class RateLimitService{

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


    private final Map<String,Bucket> buckets = new ConcurrentHashMap<>();

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


}