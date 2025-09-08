package io.devTracker.codeTracker.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
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
        @Pattern(regexp = "^[A-Za-z0-9 _.-]{1,64}$", message = "Invalid project name")
        String projectName,
        
        @Pattern(regexp = "^[A-Za-z0-9+/#.-]{1,32}$", message = "Invalid language")
        String language,
        
        @NotBlank(message = "Start time is required")
        Instant startTime,
        
        @NotBlank(message = "End time is required")
        Instant endTime,
        
        @Pattern(regexp = "^[A-Za-z0-9 _./\\\\-]{1,256}$", message = "Invalid file path")
        String file,
        @Min(value = 1, message = "timeSpent must be >= 1 second")
        @Max(value = 8 * 60 * 60, message = "timeSpent must be <= 8 hours")
        Integer timeSpent,
        @Pattern(regexp = "^[A-Za-z0-9\\-]{1,64}$", message = "Invalid sessionId")
        String sessionId,
        @Pattern(regexp = "^[A-Za-z0-9]{1,10}$", message = "Invalid extension")
        String fileExtension
    ) {}

    public record SubmitActivitiesRequest(
        List<ActivityRequest> activities
    ) {}
}
