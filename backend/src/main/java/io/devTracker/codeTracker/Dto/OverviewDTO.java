package io.devTracker.codeTracker.Dto;

import java.time.Instant;

public class OverviewDTO {
    public record RecentItem(String id, String name, Instant createdAt) {}

    public record Summary(
        long totalProjects,
        long totalActivities,
        RecentItem recentProject,
        RecentItem recentActivity,
        long weekActivityCount,
        long monthActivityCount
    ) {}
}
