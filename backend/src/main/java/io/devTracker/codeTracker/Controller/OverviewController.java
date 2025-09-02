package io.devTracker.codeTracker.Controller;

import io.devTracker.codeTracker.Dto.OverviewDTO;
import io.devTracker.codeTracker.Model.Activity;
import io.devTracker.codeTracker.Model.Project;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.ActivityRepository;
import io.devTracker.codeTracker.Repository.ProjectRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

@RestController  
@RequestMapping("/api/overview")  
public class OverviewController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ActivityRepository activityRepository;

    // GET endpoint to retrieve an overview summary for the authenticated user
    @GetMapping
    public OverviewDTO.Summary getOverview(@AuthenticationPrincipal User user) {
        // Fetch all projects associated with the user
        List<Project> projects = projectRepository.findByUserId(user.getId());

        // Fetch all activities associated with the user
        List<Activity> activities = activityRepository.findByUserId(user.getId());

        // Count total number of projects and activities
        long totalProjects = projects.size();
        long totalActivities = activities.size();

        // Find the most recently created project
        Project recentProject = projects.stream()
                .max(Comparator.comparing(Project::getCreatedAt))
                .orElse(null);

        // Find the most recent activity
        Activity recentActivity = activities.stream()
                .max(Comparator.comparing(Activity::getCreatedAt))
                .orElse(null);

        // Get current date and calculate the start of the last 7 and 30 days
        LocalDate now = LocalDate.now();
        Date weekStart = Date.from(now.minusDays(7).atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date monthStart = Date.from(now.minusDays(30).atStartOfDay(ZoneId.systemDefault()).toInstant());

        // Count activities started in the last week
        long weekCount = activities.stream()
                .filter(a -> a.getStartTime().after(weekStart))
                .count();

        // Count activities started in the last month
        long monthCount = activities.stream()
                .filter(a -> a.getStartTime().after(monthStart))
                .count();

        // Convert recent project to DTO format, if it exists
        OverviewDTO.RecentItem rp = recentProject == null ? null : new OverviewDTO.RecentItem(
                recentProject.getId(),
                recentProject.getName(),
                recentProject.getCreatedAt().toInstant()
        );

        // Convert recent activity to DTO format, if it exists
        OverviewDTO.RecentItem ra = recentActivity == null ? null : new OverviewDTO.RecentItem(
                recentActivity.getId(),
                recentActivity.getProjectName(),
                recentActivity.getCreatedAt().toInstant()
        );

        // Return a summary DTO containing counts and recent items
        return new OverviewDTO.Summary(totalProjects, totalActivities, rp, ra, weekCount, monthCount);
    }
}
