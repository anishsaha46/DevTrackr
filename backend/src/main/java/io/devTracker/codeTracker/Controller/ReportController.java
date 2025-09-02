package io.devTracker.codeTracker.Controller;

import io.devTracker.codeTracker.Model.Activity;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Repository.ActivityRepository;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;



@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired
    private ActivityRepository activityRepository;

    /**
    * Utility method to calculate the start date of a period based on the string value.
    * Supports "day", "week" (default), and "month".
    */
    private Date getPeriodStart(String period) {
        Calendar cal = Calendar.getInstance();
        switch (period) {
            case "day":
                cal.add(Calendar.DAY_OF_YEAR, -1);
                break;
            case "month":
                cal.add(Calendar.MONTH, -1);
                break;
            default:  // "week"
                cal.add(Calendar.WEEK_OF_YEAR, -1);
                break;
        }
        return cal.getTime();
    }

      /**
    * Returns a summary of user's activity over a time period (day, week, or month).
    * The summary includes:
    * - total time spent
    * - time spent per programming language
    * - time spent per project
    */
    @GetMapping("/summary")
    public Map<String, Object> getSummary(
            @RequestParam(defaultValue = "week") String period,
            @AuthenticationPrincipal User user) {

        // Determine the start date for the requested period
        Date from = getPeriodStart(period);

        // Fetch activities for the user that occurred after the start date
        List<Activity> filtered = activityRepository.findByUserIdAndStartTimeAfter(user.getId(), from);

        // Calculate total time spent (in milliseconds)
        long totalTime = filtered.stream()
                .mapToLong(a -> a.getEndTime().getTime() - a.getStartTime().getTime())
                .sum();

        // Group by programming language and sum durations
        Map<String, Long> byLanguage = filtered.stream()
                .collect(Collectors.groupingBy(
                        Activity::getLanguage,
                        Collectors.summingLong(a -> a.getEndTime().getTime() - a.getStartTime().getTime())
                ));

        // Group by project name and sum durations
        Map<String, Long> byProject = filtered.stream()
                .collect(Collectors.groupingBy(
                        Activity::getProjectName,
                        Collectors.summingLong(a -> a.getEndTime().getTime() - a.getStartTime().getTime())
                ));

        // Return summary data as a JSON object
        return Map.of(
                "totalTime", totalTime,
                "byLanguage", byLanguage,
                "byProject", byProject
        );
    }
}
