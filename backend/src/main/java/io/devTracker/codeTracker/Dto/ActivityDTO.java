package io.devTracker.codeTracker.Dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;

public class ActivityDTO {
    public record ActivityResponse(
        String id,
        String userId,
        String projectName,
        String language,
        Instant startTime,
        Instant endTime,
        Instant createdAt,
        Instant updatedAt,
        String file,
        Integer timeSpent,
        String sessionId,
        String fileExtension
    ) {}

    public record ActivityRequest(
        @NotBlank(message = "Project name is required")
        String projectName,
        
        String language,
        
        @NotBlank(message = "Start time is required")
        Instant startTime,
        
        @NotBlank(message = "End time is required")
        Instant endTime,
        
        String file,
        Integer timeSpent,
        String sessionId,
        String fileExtension
    ) {}

    public record SubmitActivitiesRequest(
        List<ActivityRequest> activities
    ) {}
}
