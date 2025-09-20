package io.devTracker.codeTracker.Dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public class ProjectDTO {
    // Simplified response to only include essential data
    public record ProjectResponse(
        String id,
        String name,
        Instant createdAt
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
