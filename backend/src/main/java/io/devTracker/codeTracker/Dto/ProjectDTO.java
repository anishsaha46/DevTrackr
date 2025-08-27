package io.devTracker.codeTracker.Dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public class ProjectDTO {
    public record ProjectResponse(
        String id,
        String name,
        String userId,
        Instant createdAt,
        Instant updatedAt,
        long activityCount
    ) {}

    public record CreateProjectRequest(
        @NotBlank(message = "Project name is required")
        String name
    ) {}

    public record UpdateProjectRequest(
        @NotBlank(message = "Project name is required")
        String name
    ) {}
}
