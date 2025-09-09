package io.devTracker.codeTracker.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for caching GitHub API data to reduce API calls and improve performance.
 * Uses Redis for caching and scheduled jobs to refresh data periodically.
 */
@Service
public class GitHubCacheService {

    private static final Logger logger = LoggerFactory.getLogger(GitHubCacheService.class);
    
    @Autowired
    private GitHubService gitHubService;
    
    @Value("${github.cache.enabled:true}")
    private boolean cacheEnabled;
    
    /**
     * Retrieves user information from GitHub API with caching.
     * If data is in cache, returns cached data; otherwise, fetches from GitHub API.
     *
     * @param accessToken GitHub access token
     * @return Map containing user information
     */
    @Cacheable(value = "github", key = "'user_' + #accessToken.substring(0, 10)", 
               condition = "#root.target.isCacheEnabled()")
    public Map<String, Object> getCachedUserInfo(String accessToken) {
        try {
            logger.info("Cache miss for GitHub user info - fetching from API");
            return gitHubService.getUserInfo(accessToken);
        } catch (Exception e) {
            logger.error("Error fetching GitHub user info: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
    
    /**
     * Scheduled job to refresh GitHub data in cache.
     * Runs every 10 minutes to ensure cache data is relatively fresh.
     */
    @Scheduled(fixedRateString = "${github.cache.refresh-rate:600000}")
    @CacheEvict(value = "github", allEntries = true)
    public void refreshGitHubCache() {
        if (!cacheEnabled) {
            return;
        }
        
        logger.info("Refreshing GitHub cache data");
        // The actual refresh happens when clients request data after cache eviction
    }
    
    /**
     * Manually evict all GitHub cache entries.
     * Useful for admin operations or when data is known to be stale.
     */
    @CacheEvict(value = "github", allEntries = true)
    public void clearGitHubCache() {
        logger.info("Manually clearing all GitHub cache entries");
    }
    
    /**
     * Check if caching is enabled for this service.
     * Used in @Cacheable condition expressions.
     *
     * @return true if caching is enabled, false otherwise
     */
    public boolean isCacheEnabled() {
        return cacheEnabled;
    }
}