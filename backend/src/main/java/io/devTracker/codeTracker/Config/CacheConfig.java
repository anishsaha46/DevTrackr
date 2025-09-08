package io.devTracker.codeTracker.Config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        // Default cache configuration with TTL of 10 minutes
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // Configure different TTLs for different caches
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Overview cache: 5 minutes
        cacheConfigurations.put("overview", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // Projects cache: 10 minutes
        cacheConfigurations.put("projects", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // Project activities cache: 2 minutes
        cacheConfigurations.put("projectActivities", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        
        // Heatmap cache: 60 minutes
        cacheConfigurations.put("heatmap", defaultConfig.entryTtl(Duration.ofMinutes(60)));
        
        // GitHub API cache: 10 minutes
        cacheConfigurations.put("github", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}