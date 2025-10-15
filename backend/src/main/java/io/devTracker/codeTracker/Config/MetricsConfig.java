package io.devTracker.codeTracker.Config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for Prometheus metrics
 */
@Configuration
public class MetricsConfig {

    /**
     * Creates a TimedAspect bean that can be used with @Timed annotation
     * to track method execution time
     */
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
}