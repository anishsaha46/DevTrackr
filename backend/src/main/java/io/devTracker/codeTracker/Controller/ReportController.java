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


    /**
    * DTO for representing heatmap data (used in /heatmap endpoint).
    * Each entry includes:
    * - date (String)
    * - activity level (int)
    */
    @Data
    public static class HeatmapEntry {
        private final String date;
        private final int activityLevel;
    }



    /**
    * Returns a list of heatmap entries representing the number of activities per day
    * for a specified year. Used for visualizing daily activity frequency.
    *
    * @param year the year for which to generate the heatmap data
    * @param user the authenticated user for whom the heatmap data is being generated
    * @return a list of HeatmapEntry objects, each containing a date and the corresponding activity level
    */
    @GetMapping("/heatmap")
    public List<HeatmapEntry> getHeatmap(@RequestParam int year, @AuthenticationPrincipal User user) {
        // Define date range: Jan 1 to Dec 31 of the given year
        LocalDate startOfYear = LocalDate.of(year, 1, 1);
        LocalDate endOfYear = LocalDate.of(year, 12, 31);

        // Fetch user activities within the given year
        List<Activity> activities = activityRepository.findByUserIdAndStartTimeBetween(
                user.getId(),
                Date.from(startOfYear.atStartOfDay(ZoneId.systemDefault()).toInstant()),
                Date.from(endOfYear.atStartOfDay(ZoneId.systemDefault()).toInstant())
        );

        // Group activities by date and count how many occurred on each day
        Map<LocalDate, Integer> map = activities.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStartTime().toInstant().atZone(ZoneId.systemDefault()).toLocalDate(),
                        Collectors.summingInt(a -> 1)
                ));

        // Convert the map into a list of HeatmapEntry objects
        return map.entrySet().stream()
                .map(e -> new HeatmapEntry(e.getKey().toString(), e.getValue()))
                .collect(Collectors.toList());
    }



    /**
    * Returns a paginated timeline of the user's activities sorted by start time (most recent first).
    */
    @GetMapping("/timeline")
    public Page<Activity> getTimeline(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User user) {

        // Create a pageable object with descending sort by startTime
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());

        // Return a page of activities for the user
        return activityRepository.findByUserId(user.getId(), pageable);
    }
}
